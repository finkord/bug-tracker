import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

/**
 * Hook to automatically preserve and restore scroll position of the primary content
 * container across page transitions and back/forward navigation.
 */
export function useScrollRestoration(containerId = 'main-content') {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKey = `${location.pathname}${location.search}`;
  const previousKeyRef = useRef<string>(currentKey);

  // Continuously record scroll position of the active page
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleScroll = () => {
      scrollPositions.set(currentKey, container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerId, currentKey]);

  // Restore scroll position on route change or POP navigation
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const savedPos = scrollPositions.get(currentKey);

    if (savedPos !== undefined && savedPos > 0) {
      // Set immediately
      container.scrollTop = savedPos;

      // Also retry on next animation frames in case asynchronously rendered list items shift layout
      let attempts = 0;
      const maxAttempts = 5;

      const restore = () => {
        if (!container) return;
        if (container.scrollTop < savedPos) {
          container.scrollTop = savedPos;
        }
        attempts++;
        if (attempts < maxAttempts && container.scrollTop < savedPos) {
          setTimeout(restore, 40 * attempts);
        }
      };

      requestAnimationFrame(restore);
    } else {
      // Fresh route navigation or top: reset to 0
      container.scrollTop = 0;
    }

    previousKeyRef.current = currentKey;
  }, [containerId, currentKey, navigationType]);
}

export function clearScrollPositions() {
  scrollPositions.clear();
}

export function getScrollPosition(key: string): number | undefined {
  return scrollPositions.get(key);
}

export function setScrollPosition(key: string, pos: number) {
  scrollPositions.set(key, pos);
}
