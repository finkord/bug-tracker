import { useEffect, useRef } from 'react';

interface AutoScrollOptions {
  verticalZone?: number;
  horizontalZone?: number;
  maxSpeed?: number;
  minSpeed?: number;
}

/**
 * Universal auto-scroll engine for HTML5 Drag-and-Drop operations.
 * Solves the native browser scroll-lock on nested overflow containers
 * (#main-content and horizontal Kanban/Scrum boards) during ticket dragging.
 *
 * Features:
 * 1. Proportional smooth acceleration when dragging near top/bottom/left/right edges
 * 2. Active mouse wheel / trackpad scroll support during drag sessions
 * 3. Zero-allocation requestAnimationFrame loop that pauses when idle
 */
export function useDragAutoScroll(options: AutoScrollOptions = {}) {
  const {
    verticalZone = 80,
    horizontalZone = 90,
    maxSpeed = 24,
    minSpeed = 4,
  } = options;

  const isDraggingRef = useRef(false);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleDragStart = () => {
      isDraggingRef.current = true;
      document.body.classList.add('is-dragging-ticket');
    };

    const stopDragging = () => {
      isDraggingRef.current = false;
      document.body.classList.remove('is-dragging-ticket');
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const runScrollLoop = () => {
      if (!isDraggingRef.current) {
        rafIdRef.current = null;
        return;
      }

      let needsNextFrame = false;
      const { x, y } = pointerRef.current;

      // 1. Vertical auto-scroll on #main-content
      const mainContainer = document.getElementById('main-content');
      if (mainContainer) {
        const rect = mainContainer.getBoundingClientRect();

        // Ensure pointer is horizontally aligned with the container
        if (x >= rect.left && x <= rect.right) {
          // Scroll up zone (near top of mainContainer)
          if (y >= rect.top && y <= rect.top + verticalZone && mainContainer.scrollTop > 0) {
            const proximity = (verticalZone - (y - rect.top)) / verticalZone;
            const clamped = Math.max(0, Math.min(1, proximity));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (clamped * clamped));
            mainContainer.scrollTop -= speed;
            needsNextFrame = true;
          }
          // Scroll down zone (near bottom of mainContainer)
          else if (
            y <= rect.bottom &&
            y >= rect.bottom - verticalZone &&
            mainContainer.scrollTop < mainContainer.scrollHeight - mainContainer.clientHeight - 1
          ) {
            const proximity = (verticalZone - (rect.bottom - y)) / verticalZone;
            const clamped = Math.max(0, Math.min(1, proximity));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (clamped * clamped));
            mainContainer.scrollTop += speed;
            needsNextFrame = true;
          }
        }
      }

      // 2. Horizontal auto-scroll for Kanban / Scrum boards
      const hContainer =
        document.querySelector<HTMLElement>('[data-drag-scroll-x]') ||
        document.querySelector<HTMLElement>('.overflow-x-auto');

      if (hContainer && hContainer.scrollWidth > hContainer.clientWidth) {
        const hRect = hContainer.getBoundingClientRect();

        if (y >= hRect.top && y <= hRect.bottom) {
          // Scroll left zone
          if (x >= hRect.left && x <= hRect.left + horizontalZone && hContainer.scrollLeft > 0) {
            const proximity = (horizontalZone - (x - hRect.left)) / horizontalZone;
            const clamped = Math.max(0, Math.min(1, proximity));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (clamped * clamped));
            hContainer.scrollLeft -= speed;
            needsNextFrame = true;
          }
          // Scroll right zone
          else if (
            x <= hRect.right &&
            x >= hRect.right - horizontalZone &&
            hContainer.scrollLeft < hContainer.scrollWidth - hContainer.clientWidth - 1
          ) {
            const proximity = (horizontalZone - (hRect.right - x)) / horizontalZone;
            const clamped = Math.max(0, Math.min(1, proximity));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (clamped * clamped));
            hContainer.scrollLeft += speed;
            needsNextFrame = true;
          }
        }
      }

      if (needsNextFrame && isDraggingRef.current) {
        rafIdRef.current = requestAnimationFrame(runScrollLoop);
      } else {
        rafIdRef.current = null;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      // Record pointer position continuously
      pointerRef.current = { x: e.clientX, y: e.clientY };

      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        document.body.classList.add('is-dragging-ticket');
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(runScrollLoop);
      }
    };

    // Support manual mouse wheel / trackpad scrolling while dragging
    const handleWheel = (e: WheelEvent) => {
      if (!isDraggingRef.current) return;

      const mainContainer = document.getElementById('main-content');
      if (mainContainer && e.deltaY !== 0) {
        mainContainer.scrollTop += e.deltaY;
      }

      const hContainer =
        document.querySelector<HTMLElement>('[data-drag-scroll-x]') ||
        document.querySelector<HTMLElement>('.overflow-x-auto');

      if (hContainer && e.deltaX !== 0) {
        hContainer.scrollLeft += e.deltaX;
      }
    };

    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('dragover', handleDragOver, { capture: true, passive: true });
    window.addEventListener('dragend', stopDragging, { capture: true });
    window.addEventListener('drop', stopDragging, { capture: true });
    window.addEventListener('wheel', handleWheel, { capture: true, passive: true });
    window.addEventListener('blur', stopDragging);

    return () => {
      stopDragging();
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('dragover', handleDragOver, { capture: true });
      window.removeEventListener('dragend', stopDragging, { capture: true });
      window.removeEventListener('drop', stopDragging, { capture: true });
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('blur', stopDragging);
    };
  }, [verticalZone, horizontalZone, maxSpeed, minSpeed]);
}
