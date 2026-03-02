import { useCallback, useState, type KeyboardEvent } from 'react';

interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  loop?: boolean;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

interface UseKeyboardNavigationReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  resetActiveIndex: () => void;
}

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onEscape,
  loop = true,
  orientation = 'vertical',
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      let newIndex = activeIndex;
      let handled = false;

      switch (event.key) {
        case 'ArrowDown':
          if (isVertical) {
            event.preventDefault();
            handled = true;
            if (loop) {
              newIndex = (activeIndex + 1) % itemCount;
            } else {
              newIndex = Math.min(activeIndex + 1, itemCount - 1);
            }
          }
          break;

        case 'ArrowUp':
          if (isVertical) {
            event.preventDefault();
            handled = true;
            if (loop) {
              newIndex = (activeIndex - 1 + itemCount) % itemCount;
            } else {
              newIndex = Math.max(activeIndex - 1, 0);
            }
          }
          break;

        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault();
            handled = true;
            if (loop) {
              newIndex = (activeIndex + 1) % itemCount;
            } else {
              newIndex = Math.min(activeIndex + 1, itemCount - 1);
            }
          }
          break;

        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault();
            handled = true;
            if (loop) {
              newIndex = (activeIndex - 1 + itemCount) % itemCount;
            } else {
              newIndex = Math.max(activeIndex - 1, 0);
            }
          }
          break;

        case 'Home':
          event.preventDefault();
          handled = true;
          newIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          handled = true;
          newIndex = itemCount - 1;
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(activeIndex);
          return;

        case 'Escape':
          event.preventDefault();
          onEscape?.();
          return;
      }

      if (handled && newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, itemCount, loop, orientation, onSelect, onEscape]
  );

  const resetActiveIndex = useCallback(() => {
    setActiveIndex(0);
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    resetActiveIndex,
  };
}
