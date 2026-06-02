// src/composables/useWebSocketManager.ts
import { ref } from 'vue';

type ConnectionStatus = 'online' | 'connecting' | 'offline';
type MessageCallback = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private status = ref<ConnectionStatus>('offline');
  private subscriptions = new Map<string, Set<MessageCallback>>();
  private messageIdCounter = 1;
  private reconnectTimeout: any = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  constructor() {
    // Prevent multiple instances
  }

  public get connectionStatus() {
    return this.status;
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.status.value = 'connecting';
    // Use the combined streams endpoint
    this.ws = new WebSocket('wss://stream.binance.com:9443/stream');

    this.ws.onopen = () => {
      this.status.value = 'online';
      this.reconnectDelay = 1000;
      this.resubscribeAll();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.stream) {
          const callbacks = this.subscriptions.get(message.stream.toLowerCase());
          if (callbacks) {
            callbacks.forEach((cb) => cb(message.data));
          }
        }
      } catch (err) {
        console.error('[WS Manager] Message parse error:', err);
      }
    };

    this.ws.onclose = () => {
      this.status.value = 'offline';
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[WS Manager] Error:', err);
      if (this.ws) {
        this.ws.close();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      console.log('[WS Manager] Reconnecting...');
      this.connect();
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private resubscribeAll() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const streams = Array.from(this.subscriptions.keys());
    if (streams.length === 0) return;

    const payload = {
      method: 'SUBSCRIBE',
      params: streams,
      id: this.messageIdCounter++,
    };
    this.ws.send(JSON.stringify(payload));
  }

  public subscribe(stream: string, callback: MessageCallback) {
    const normalizedStream = stream.toLowerCase();
    
    if (!this.subscriptions.has(normalizedStream)) {
      this.subscriptions.set(normalizedStream, new Set());
      
      // If WS is already open, send SUBSCRIBE frame immediately
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const payload = {
          method: 'SUBSCRIBE',
          params: [normalizedStream],
          id: this.messageIdCounter++,
        };
        this.ws.send(JSON.stringify(payload));
      }
    }

    this.subscriptions.get(normalizedStream)!.add(callback);

    // Bootstrap connection if not already running
    if (!this.ws) {
      this.connect();
    }
  }

  public unsubscribe(stream: string, callback: MessageCallback) {
    const normalizedStream = stream.toLowerCase();
    const callbacks = this.subscriptions.get(normalizedStream);

    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(normalizedStream);

        // If WS is open, send UNSUBSCRIBE frame
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const payload = {
            method: 'UNSUBSCRIBE',
            params: [normalizedStream],
            id: this.messageIdCounter++,
          };
          this.ws.send(JSON.stringify(payload));
        }
      }
    }

    // If no more subscriptions are active, we can optionally close the socket to save resources
    if (this.subscriptions.size === 0 && this.ws) {
      this.ws.close();
    }
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
