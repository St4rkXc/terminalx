// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import './assets/index.css';

const app = createApp(App);

// Explicitly enable devtools in development
if (import.meta.env.DEV) {
  (app.config as any).devtools = true;
}

const pinia = createPinia();

// Add localstorage persistence support to Pinia stores
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.mount('#app');
