import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTicketDragStore, type DropZoneTarget } from '../../store/useTicketDragStore';
import type { IssueType, IssuePriority } from '../../api/client';
import { Avatar } from './Avatar';
import {
  Bug,
  CheckSquare,
  Sparkles,
  Zap,
  Flame,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

export const TicketDragOverlay: React.FC = () => {
  const isDragging = useTicketDragStore((s) => s.isDragging);
  const activeDrag = useTicketDragStore((s) => s.activeDrag);
  const setHoverTarget = useTicketDragStore((s) => s.setHoverTarget);
  const cancelDrag = useTicketDragStore((s) => s.cancelDrag);
  const completeDrop = useTicketDragStore((s) => s.completeDrop);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Auto-scroll zones and speeds
  const verticalZone = 80;
  const horizontalZone = 90;
  const maxSpeed = 26;
  const minSpeed = 5;

  useEffect(() => {
    if (!isDragging || !activeDrag) return;

    pointerPosRef.current = {
      x: activeDrag.initialPointer.x,
      y: activeDrag.initialPointer.y,
    };

    const updateTransform = (x: number, y: number) => {
      if (overlayRef.current) {
        const left = x - activeDrag.offset.x;
        const top = y - activeDrag.offset.y;
        overlayRef.current.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(1.5deg) scale(1.02)`;
      }
    };

    updateTransform(activeDrag.initialPointer.x, activeDrag.initialPointer.y);

    const checkDropTarget = (x: number, y: number) => {
      const elements = document.elementsFromPoint(x, y);
      let detectedTarget: DropZoneTarget | null = null;

      for (const el of elements) {
        if (!(el instanceof HTMLElement)) continue;
        const dropZoneEl = el.closest<HTMLElement>('[data-drop-zone]');
        if (dropZoneEl) {
          const zoneType = dropZoneEl.dataset.dropZone;
          if (zoneType === 'sprint') {
            const sprintIdStr = dropZoneEl.dataset.sprintId;
            if (sprintIdStr) {
              detectedTarget = { type: 'sprint', sprintId: Number(sprintIdStr) };
              break;
            }
          } else if (zoneType === 'backlog') {
            detectedTarget = { type: 'backlog', sprintId: null };
            break;
          } else if (zoneType === 'column') {
            const status = dropZoneEl.dataset.columnStatus;
            if (status) {
              detectedTarget = { type: 'column', status: status as any };
              break;
            }
          } else if (zoneType === 'cell') {
            const status = dropZoneEl.dataset.columnStatus;
            const assigneeStr = dropZoneEl.dataset.assigneeId;
            if (status) {
              detectedTarget = {
                type: 'cell',
                status: status as any,
                assigneeId: assigneeStr === 'unassigned' || !assigneeStr ? null : Number(assigneeStr),
              };
              break;
            }
          }
        }
      }

      setHoverTarget(detectedTarget);
    };

    // Auto-scroll loop
    const runAutoScroll = () => {
      const { x, y } = pointerPosRef.current;
      let needsNextFrame = false;

      // 1. Vertical scrolling for #main-content
      const mainContainer = document.getElementById('main-content');
      if (mainContainer) {
        const rect = mainContainer.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right) {
          if (y >= rect.top && y <= rect.top + verticalZone && mainContainer.scrollTop > 0) {
            const proximity = Math.max(0, Math.min(1, (verticalZone - (y - rect.top)) / verticalZone));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (proximity * proximity));
            mainContainer.scrollTop -= speed;
            needsNextFrame = true;
          } else if (
            y <= rect.bottom &&
            y >= rect.bottom - verticalZone &&
            mainContainer.scrollTop < mainContainer.scrollHeight - mainContainer.clientHeight - 1
          ) {
            const proximity = Math.max(0, Math.min(1, (verticalZone - (rect.bottom - y)) / verticalZone));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (proximity * proximity));
            mainContainer.scrollTop += speed;
            needsNextFrame = true;
          }
        }
      }

      // 2. Horizontal scrolling for Kanban boards
      const hContainer =
        document.querySelector<HTMLElement>('[data-drag-scroll-x]') ||
        document.querySelector<HTMLElement>('.overflow-x-auto');

      if (hContainer && hContainer.scrollWidth > hContainer.clientWidth) {
        const hRect = hContainer.getBoundingClientRect();
        if (y >= hRect.top && y <= hRect.bottom) {
          if (x >= hRect.left && x <= hRect.left + horizontalZone && hContainer.scrollLeft > 0) {
            const proximity = Math.max(0, Math.min(1, (horizontalZone - (x - hRect.left)) / horizontalZone));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (proximity * proximity));
            hContainer.scrollLeft -= speed;
            needsNextFrame = true;
          } else if (
            x <= hRect.right &&
            x >= hRect.right - horizontalZone &&
            hContainer.scrollLeft < hContainer.scrollWidth - hContainer.clientWidth - 1
          ) {
            const proximity = Math.max(0, Math.min(1, (horizontalZone - (hRect.right - x)) / horizontalZone));
            const speed = Math.ceil(minSpeed + (maxSpeed - minSpeed) * (proximity * proximity));
            hContainer.scrollLeft += speed;
            needsNextFrame = true;
          }
        }
      }

      if (needsNextFrame) {
        checkDropTarget(x, y);
        rafIdRef.current = requestAnimationFrame(runAutoScroll);
      } else {
        rafIdRef.current = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
      updateTransform(e.clientX, e.clientY);
      checkDropTarget(e.clientX, e.clientY);

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(runAutoScroll);
      }
    };

    const handleWheel = () => {
      // Allow browser to scroll container naturally, then re-check target
      requestAnimationFrame(() => {
        checkDropTarget(pointerPosRef.current.x, pointerPosRef.current.y);
      });
    };

    const handlePointerUp = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      completeDrop();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        cancelDrag();
      }
    };

    const handleBlur = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      cancelDrag();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    // Initial check
    checkDropTarget(activeDrag.initialPointer.x, activeDrag.initialPointer.y);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isDragging, activeDrag, completeDrop, cancelDrag, setHoverTarget]);

  if (!isDragging || !activeDrag) return null;

  const { issue, variant, dimensions } = activeDrag;

  const renderTypeIcon = (type: IssueType) => {
    switch (type) {
      case 'BUG':
        return <Bug className="w-3.5 h-3.5 text-[var(--md-sys-color-error)]" />;
      case 'TASK':
        return <CheckSquare className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />;
      case 'FEATURE':
        return <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-success)]" />;
      case 'IMPROVEMENT':
        return <Zap className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />;
    }
  };

  const renderPriorityIcon = (priority: IssuePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <Flame className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-critical)]" />;
      case 'HIGH':
        return <AlertCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-priority-high)]" />;
      case 'MEDIUM':
        return <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-priority-medium)]" />;
      case 'LOW':
        return <span className="w-2 h-2 rounded-full bg-[var(--md-sys-color-priority-low)]" />;
    }
  };

  const overlayContent = (
    <div
      ref={overlayRef}
      style={{
        width: dimensions.width,
        top: 0,
        left: 0,
      }}
      className="fixed z-[9999] pointer-events-none select-none transition-none will-change-transform opacity-95 shadow-2xl"
    >
      {variant === 'row' ? (
        /* Sprint/Backlog Row Preview */
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border-2 border-[var(--md-sys-color-primary)] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="shrink-0">{renderTypeIcon(issue.issueType)}</div>
            <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {issue.key}
            </span>
            <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
              {issue.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              {renderPriorityIcon(issue.priority)}
            </div>
            {(issue.estimatedHours || 0) > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]">
                <Clock className="w-2.5 h-2.5 text-[var(--md-sys-color-primary)]" />
                <span>{issue.estimatedHours}h</span>
              </span>
            )}
            {issue.assignee && (
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            )}
          </div>
        </div>
      ) : (
        /* Kanban Card Preview */
        <div className="rounded-2xl p-3.5 bg-[var(--md-sys-color-surface-container)] border-2 border-[var(--md-sys-color-primary)] shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-[11px] font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                {issue.key}
              </span>
              {issue.sprint?.name && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center gap-1 shrink-0 truncate max-w-[100px]">
                  <Layers className="w-2.5 h-2.5" />
                  <span>{issue.sprint.name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {renderTypeIcon(issue.issueType)}
              {renderPriorityIcon(issue.priority)}
            </div>
          </div>
          <h4 className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] line-clamp-2 mb-2 leading-snug">
            {issue.title}
          </h4>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]/40 text-xs">
            <span className="font-mono text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {issue.status.replace('_', ' ')}
            </span>
            {issue.assignee && (
              <Avatar
                name={issue.assignee.fullName}
                avatarUrl={issue.assignee.avatarUrl}
                role={issue.assignee.systemRole}
                size="xs"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlayContent, document.body);
};
