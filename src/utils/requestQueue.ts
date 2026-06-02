// src/utils/requestQueue.ts

type Task = () => Promise<void>;

class RequestQueue {
  private queue: Task[] = [];
  private isProcessing = false;
  private delayBetweenRequests: number;

  constructor(delayMs = 12500) { // 12.5s delay = ~4.8 requests per minute (safely under 5/min limit)
    this.delayBetweenRequests = delayMs;
  }

  async add(task: Task) {
    return new Promise<void>((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.queue.push(wrappedTask);
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const task = this.queue.shift();

    if (task) {
      await task();
      // Wait for the defined interval before allowing the next request
      setTimeout(() => {
        this.isProcessing = false;
        this.process();
      }, this.delayBetweenRequests);
    }
  }
}

// Singleton instance for Polygon requests
export const polygonQueue = new RequestQueue();
