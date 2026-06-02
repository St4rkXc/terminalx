<!-- src/components/dashboard/NewsFeed.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { safeLoad, safeSave } from '../../utils/localStorage';
import { fetchWithRetry } from '../../utils/fetchRetry';
import { Newspaper, ExternalLink } from 'lucide-vue-next';

interface NewsItem {
  id: number;
  headline: string;
  source: string;
  datetime: number;
  url: string;
  category: string;
  summary: string;
}

const settings = useSettingsStore();

const news = ref<NewsItem[]>([]);
const isLoading = ref(false);
const isError = ref(false);
const filterCategory = ref<'all' | 'crypto' | 'stocks' | 'macro'>('all');

const hasKey = computed(() => !!settings.finnhubApiKey);

const CACHE_KEY = 'terminalx_v1_news_cache';
const CACHE_TIME_KEY = 'terminalx_v1_news_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 mins

const loadNews = async (force = false) => {
  if (!hasKey.value) return;

  const cachedTime = safeLoad<number>(CACHE_TIME_KEY, 0);
  const cacheExists = Date.now() - cachedTime < CACHE_DURATION;

  if (cacheExists && !force) {
    const cachedNews = safeLoad<NewsItem[]>(CACHE_KEY, []);
    if (cachedNews.length > 0) {
      news.value = cachedNews;
      return;
    }
  }

  isLoading.value = true;
  isError.value = false;

  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${settings.finnhubApiKey}`;
    const response = await fetchWithRetry(url);
    const data = (await response.json()) as NewsItem[];
    
    news.value = data.slice(0, 30);
    safeSave(CACHE_KEY, news.value);
    safeSave(CACHE_TIME_KEY, Date.now());
    
    isLoading.value = false;
  } catch (err) {
    console.error('[NewsFeed] Load failed:', err);
    isError.value = true;
    isLoading.value = false;
  }
};

const filteredNews = computed(() => {
  if (filterCategory.value === 'all') return news.value;
  return news.value.filter((item) => {
    const headlineLower = item.headline.toLowerCase();
    const summaryLower = item.summary.toLowerCase();
    
    if (filterCategory.value === 'crypto') {
      return (
        item.category === 'crypto' ||
        headlineLower.includes('crypto') ||
        headlineLower.includes('bitcoin') ||
        headlineLower.includes('ethereum') ||
        headlineLower.includes('btc') ||
        summaryLower.includes('crypto')
      );
    }
    
    if (filterCategory.value === 'stocks') {
      return (
        item.category === 'company' ||
        headlineLower.includes('stock') ||
        headlineLower.includes('share') ||
        headlineLower.includes('nasdaq') ||
        headlineLower.includes('dow') ||
        summaryLower.includes('stock')
      );
    }

    if (filterCategory.value === 'macro') {
      return (
        headlineLower.includes('fed') ||
        headlineLower.includes('inflation') ||
        headlineLower.includes('economy') ||
        headlineLower.includes('cpi') ||
        headlineLower.includes('interest rate') ||
        summaryLower.includes('fed')
      );
    }

    return true;
  });
});

const timeAgo = (timestamp: number) => {
  const diffMs = Date.now() - timestamp * 1000;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
};

onMounted(() => {
  loadNews();
});
</script>

<template>
  <div class="h-full w-full bg-panel border border-border flex flex-col font-mono text-xs select-none">
    <!-- Panel Header -->
    <div class="h-8 border-b border-border flex items-center justify-between px-3 bg-black">
      <div class="flex items-center space-x-2">
        <Newspaper class="h-3.5 w-3.5 text-accent-green" />
        <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider">
          LIVE NEWS BULLETINS
        </span>
      </div>
      <button
        v-if="hasKey"
        @click="loadNews(true)"
        class="text-[8px] text-gray-500 hover:text-white uppercase font-bold hover:underline"
      >
        REFRESH
      </button>
    </div>

    <!-- Category Filters -->
    <div class="h-7 border-b border-border bg-black/40 flex items-center px-2 space-x-1 select-none text-[9px] font-bold">
      <button
        v-for="cat in ['all', 'crypto', 'stocks', 'macro']"
        :key="cat"
        @click="filterCategory = cat as any"
        class="px-2.5 py-0.5 rounded border border-border transition-colors hover:bg-surface"
        :class="filterCategory === cat ? 'text-accent-green border-accent-green bg-surface/30' : 'text-gray-500 border-transparent'"
      >
        {{ cat.toUpperCase() }}
      </button>
    </div>

    <!-- News List -->
    <div class="flex-1 overflow-y-auto relative">
      <!-- Key Missing -->
      <div v-if="!hasKey" class="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-gray-500">
        <span>FINNHUB API KEY REQUIRED FOR LIVE NEWS</span>
        <span class="text-[8px] text-gray-600">Please check your .env configuration</span>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="absolute inset-0 bg-black/40 flex items-center justify-center text-gray-500 text-[10px]">
        POLLING WIRES...
      </div>

      <!-- Error -->
      <div v-else-if="isError" class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-2 text-accent-red text-[10px]">
        <span>ERROR FETCHING DISPATCHES</span>
        <button @click="loadNews(true)" class="px-2.5 py-1 bg-surface border border-border text-gray-300 rounded hover:bg-panel uppercase">
          RETRY
        </button>
      </div>

      <!-- Feed list -->
      <div v-else-if="filteredNews.length > 0" class="divide-y divide-border/30">
        <a
          v-for="item in filteredNews"
          :key="item.id"
          :href="item.url"
          target="_blank"
          class="p-2.5 block hover:bg-surface/30 transition-all select-none relative group"
        >
          <div class="flex items-center justify-between text-[8px] text-gray-500 mb-1">
            <span class="font-bold text-accent-green uppercase">{{ item.source }}</span>
            <span>{{ timeAgo(item.datetime) }}</span>
          </div>
          
          <h4 class="text-white font-medium text-[10px] line-clamp-2 leading-relaxed group-hover:text-accent-green transition-colors pr-4">
            {{ item.headline }}
          </h4>
          <p class="text-[9px] text-gray-500 line-clamp-2 mt-1 leading-normal">
            {{ item.summary }}
          </p>

          <ExternalLink class="h-3 w-3 text-gray-600 group-hover:text-white absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>

      <!-- Empty State -->
      <div v-else class="absolute inset-0 bg-black/40 flex items-center justify-center text-gray-500 text-[10px]">
        NO CORRESPONDENCE FOUND
      </div>
    </div>
  </div>
</template>
