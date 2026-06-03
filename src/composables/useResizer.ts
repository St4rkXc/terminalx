import { ref } from "vue";

export interface UseResizerOptions {
  initialSizes: number[];
  minSize?: number;
}

export function useResizer(options: UseResizerOptions) {
  const sizes = ref<number[]>([...options.initialSizes]);
  const minSize = options.minSize ?? 10;

  const startDrag = (
    index: number,
    startEvent: MouseEvent,
    direction: "horizontal" | "vertical"
  ) => {
    startEvent.preventDefault();

    const container = (startEvent.currentTarget as HTMLElement).parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const totalSizePx = direction === "horizontal" ? rect.width : rect.height;

    const startCoord = direction === "horizontal" ? startEvent.clientX : startEvent.clientY;
    const startSizeA = sizes.value[index];
    const startSizeB = sizes.value[index + 1];
    const sumSize = startSizeA + startSizeB;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentCoord = direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
      const deltaPx = currentCoord - startCoord;
      const deltaPercent = (deltaPx / totalSizePx) * 100;

      let newSizeA = startSizeA + deltaPercent;
      let newSizeB = startSizeB - deltaPercent;

      // Clamp sizes to respect minSize limits
      if (newSizeA < minSize) {
        newSizeA = minSize;
        newSizeB = sumSize - minSize;
      } else if (newSizeB < minSize) {
        newSizeB = minSize;
        newSizeA = sumSize - minSize;
      }

      sizes.value[index] = newSizeA;
      sizes.value[index + 1] = newSizeB;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return {
    sizes,
    startDrag,
  };
}
