import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  isActive?: boolean;
  onEscape?: () => void;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement>(options: UseFocusTrapOptions = {}) {
  const {
    isActive = true,
    onEscape,
    autoFocus = true,
    restoreFocus = true,
  } = options;

  const ref = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!ref.current) return [];
    return Array.from(
      ref.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => {
      // Check visibility: offsetParent is null for hidden elements,
      // but also null in jsdom. Use getComputedStyle as fallback.
      if (el.offsetParent !== null) return true;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  // Use useLayoutEffect for auto-focus to ensure it runs synchronously before paint
  useLayoutEffect(() => {
    if (!isActive || !autoFocus) return;

    const element = ref.current;
    if (!element) return;

    // Store the currently focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Auto-focus first focusable element synchronously
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [isActive, autoFocus, restoreFocus, getFocusableElements]);

  // Use separate effect for keydown handling attached to document
  useEffect(() => {
    if (!isActive) return;

    const element = ref.current;
    if (!element) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the event target is within our trap container
      const isWithinTrap = element.contains(event.target as Node) ||
                           element.contains(document.activeElement);

      if (!isWithinTrap && document.activeElement !== document.body) return;

      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Attach to document to capture all keyboard events
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onEscape, restoreFocus, getFocusableElements]);

  return ref;
}
