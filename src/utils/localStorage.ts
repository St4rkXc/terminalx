// src/utils/localStorage.ts

export const safeSave = (key: string, data: any): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[LocalStorage] Save failed for key "${key}":`, error);
    return false;
  }
};

export const safeLoad = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`[LocalStorage] Load failed for key "${key}". Returning fallback:`, error);
    return fallback;
  }
};
