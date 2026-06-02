<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  orientation?: 'vertical' | 'horizontal';
  minPx?: number;
}>(), {
  orientation: 'vertical',
  minPx: 80
});

const emit = defineEmits<{
  (e: 'resize', deltaX: number): void;
}>();

const isDragging = ref(false);
let startX = 0;
let startY = 0;

const startDrag = (event: PointerEvent) => {
  isDragging.value = true;
  startX = event.clientX;
  startY = event.clientY;
  
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  
  document.body.style.userSelect = 'none';
  document.body.style.cursor = props.orientation === 'vertical' ? 'col-resize' : 'row-resize';
};

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return;
  
  if (props.orientation === 'vertical') {
    const deltaX = event.clientX - startX;
    startX = event.clientX;
    emit('resize', deltaX);
  } else {
    const deltaY = event.clientY - startY;
    startY = event.clientY;
    emit('resize', deltaY);
  }
};

const onPointerUp = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  
  // Dispatch window resize event so LightweightCharts or resize observers recalculate sizes
  window.dispatchEvent(new Event('resize'));
};

onUnmounted(() => {
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  if (isDragging.value) {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }
});
</script>

<template>
  <div
    class="relative select-none transition-colors duration-150 flex items-center justify-center z-20 group"
    :class="[
      orientation === 'vertical' 
        ? 'w-1 cursor-col-resize h-full hover:bg-emerald-500/20 active:bg-emerald-500/40' 
        : 'h-1 cursor-row-resize w-full hover:bg-emerald-500/20 active:bg-emerald-500/40',
      isDragging ? 'bg-emerald-500/30' : 'bg-zinc-800'
    ]"
    @pointerdown="startDrag"
  >
    <!-- Visual cue line inside the splitter -->
    <div 
      :class="[
        orientation === 'vertical' ? 'w-[2px] h-6 rounded-full' : 'h-[2px] w-6 rounded-full',
        isDragging ? 'bg-emerald-400' : 'bg-zinc-700 group-hover:bg-zinc-500'
      ]"
    />
  </div>
</template>
