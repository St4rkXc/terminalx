<!-- src/components/dashboard/EconomicCalendar.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { safeLoad, safeSave } from '../../utils/localStorage';
import { fetchWithRetry } from '../../utils/fetchRetry';
import { Calendar } from 'lucide-vue-next';

interface CalendarEvent {
  event: string;
  date: string;
  country: string;
  currency: string;
  previous: string | null;
  estimate: string | null;
  actual: string | null;
  impact: 'High' | 'Medium' | 'Low' | string;
}

const settings = useSettingsStore();

const events = ref<CalendarEvent[]>([]);
const isLoading = ref(false);
const isError = ref(false);
const filterImpact = ref<'all' | 'high'>('all');

const hasKey = computed(() => !!settings.fmpApiKey);

const CACHE_KEY = 'terminalx_v1_calendar_cache';
const CACHE_TIME_KEY = 'terminalx_v1_calendar_cache_time';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

const loadEvents = async (force = false) => {
  if (!hasKey.value) return;

  const cachedTime = safeLoad<number>(CACHE_TIME_KEY, 0);
  const cacheExists = Date.now() - cachedTime < CACHE_DURATION;

  if (cacheExists && !force) {
    const cachedEvents = safeLoad<CalendarEvent[]>(CACHE_KEY, []);
    if (cachedEvents.length > 0) {
      events.value = cachedEvents;
      return;
    }
  }

  isLoading.value = true;
  isError.value = false;

  try {
    // Generate dates: today to today + 7 days
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);

    const formatDateStr = (d: Date) => d.toISOString().split('T')[0];
    const fromStr = formatDateStr(today);
    const toStr = formatDateStr(future);

    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${fromStr}&to=${toStr}&apikey=${settings.fmpApiKey}`;
    const response = await fetchWithRetry(url);
    const data = (await response.json()) as CalendarEvent[];

    // Sort chronologically
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    events.value = data;
    safeSave(CACHE_KEY, events.value);
    safeSave(CACHE_TIME_KEY, Date.now());

    isLoading.value = false;
  } catch (err) {
    console.error('[EconomicCalendar] Load failed:', err);
    isError.value = true;
    isLoading.value = false;
  }
};

const filteredEvents = computed(() => {
  if (filterImpact.value === 'all') return events.value;
  return events.value.filter((e) => e.impact === 'High');
});

// Group events by day for visual separation
const groupedEvents = computed(() => {
  const groups: { [key: string]: CalendarEvent[] } = {};
  filteredEvents.value.forEach((e) => {
    const dateObj = new Date(e.date);
    const dayName = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (!groups[dayName]) {
      groups[dayName] = [];
    }
    groups[dayName].push(e);
  });
  return groups;
});

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  loadEvents();
});
</script>

<template>
  <div class="h-full w-full bg-panel border border-border flex flex-col font-mono text-xs select-none">
    <!-- Panel Header -->
    <div class="h-8 border-b border-border flex items-center justify-between px-3 bg-black">
      <div class="flex items-center space-x-2">
        <Calendar class="h-3.5 w-3.5 text-accent-green" />
        <span class="text-[10px] text-accent-green uppercase font-bold tracking-wider">
          ECONOMIC CALENDAR
        </span>
      </div>
      <button
        v-if="hasKey"
        @click="loadEvents(true)"
        class="text-[8px] text-gray-500 hover:text-white uppercase font-bold hover:underline"
      >
        REFRESH
      </button>
    </div>

    <!-- Impact Filters -->
    <div class="h-7 border-b border-border bg-black/40 flex items-center px-2 space-x-1 select-none text-[9px] font-bold">
      <button
        @click="filterImpact = 'all'"
        class="px-2.5 py-0.5 rounded border border-border transition-colors hover:bg-surface"
        :class="filterImpact === 'all' ? 'text-accent-green border-accent-green bg-surface/30' : 'text-gray-500 border-transparent'"
      >
        ALL EVENTS
      </button>
      <button
        @click="filterImpact = 'high'"
        class="px-2.5 py-0.5 rounded border border-border transition-colors hover:bg-surface"
        :class="filterImpact === 'high' ? 'text-accent-green border-accent-green bg-surface/30' : 'text-gray-500 border-transparent'"
      >
        HIGH IMPACT (🔴)
      </button>
    </div>

    <!-- Events List -->
    <div class="flex-1 overflow-y-auto relative">
      <!-- Key Missing -->
      <div v-if="!hasKey" class="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-4 text-center space-y-2 text-[10px] text-gray-500">
        <span>FMP API KEY REQUIRED FOR ECONOMIC CALENDAR</span>
        <span class="text-[8px] text-gray-600">Please check your .env configuration</span>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="absolute inset-0 bg-black/40 flex items-center justify-center text-gray-500 text-[10px]">
        LOADING MACRO DIARIES...
      </div>

      <!-- Error -->
      <div v-else-if="isError" class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-2 text-accent-red text-[10px]">
        <span>ERROR FETCHING EVENTS SCHEDULE</span>
        <button @click="loadEvents(true)" class="px-2.5 py-1 bg-surface border border-border text-gray-300 rounded hover:bg-panel uppercase">
          RETRY
        </button>
      </div>

      <!-- Grouped List -->
      <div v-else-if="Object.keys(groupedEvents).length > 0" class="divide-y divide-border/20">
        <div v-for="(dayEvents, day) in groupedEvents" :key="day" class="p-2">
          <!-- Day Header -->
          <div class="text-[8px] font-bold text-accent-green border-b border-border/10 pb-0.5 mb-1.5 uppercase select-none">
            {{ day }}
          </div>

          <!-- Day events -->
          <div class="space-y-1.5">
            <div
              v-for="event in dayEvents"
              :key="event.event + event.date"
              class="flex items-start space-x-2 py-0.5 select-none"
            >
              <!-- Time & flag -->
              <span class="text-gray-400 font-mono text-[9px] w-9 flex-shrink-0">
                {{ formatTime(event.date) }}
              </span>
              
              <span class="text-[9px] text-white font-bold w-6 flex-shrink-0 bg-surface text-center rounded border border-border">
                {{ event.country }}
              </span>

              <!-- Impact dot -->
              <span
                class="flex-shrink-0 h-2 w-2 rounded-full mt-1 border border-black"
                :class="{
                  'bg-accent-red': event.impact === 'High',
                  'bg-accent-orange': event.impact === 'Medium',
                  'bg-gray-700': event.impact !== 'High' && event.impact !== 'Medium'
                }"
                :title="event.impact"
              ></span>

              <!-- Description -->
              <div class="flex-1 min-w-0">
                <div class="text-white font-semibold line-clamp-1 leading-normal">
                  {{ event.event }}
                </div>
                <div class="flex items-center space-x-2 text-[8px] text-gray-500 font-mono mt-0.5">
                  <span v-if="event.actual">ACTUAL: <b class="text-gray-300">{{ event.actual }}</b></span>
                  <span v-if="event.estimate">EST: <b class="text-gray-300">{{ event.estimate }}</b></span>
                  <span v-if="event.previous">PREV: <b class="text-gray-300">{{ event.previous }}</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="absolute inset-0 bg-black/40 flex items-center justify-center text-gray-500 text-[10px]">
        NO SCHEDULED EVENTS FOR THIS WEEK
      </div>
    </div>
  </div>
</template>
