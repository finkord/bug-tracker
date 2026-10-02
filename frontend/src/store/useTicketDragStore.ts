import { create } from 'zustand';
import type { IssueItem, IssueStatus } from '../api/client';

export type DropZoneTarget =
  | { type: 'sprint'; sprintId: number }
  | { type: 'backlog'; sprintId: null }
  | { type: 'column'; status: IssueStatus }
  | { type: 'cell'; status: IssueStatus; assigneeId: number | null };

export interface ActiveDragPayload {
  issue: IssueItem;
  variant: 'row' | 'card';
  initialPointer: { x: number; y: number };
  offset: { x: number; y: number };
  dimensions: { width: number; height: number };
  onDrop: (target: DropZoneTarget) => void;
}

interface TicketDragStoreState {
  isDragging: boolean;
  activeDrag: ActiveDragPayload | null;
  hoverTarget: DropZoneTarget | null;

  startDrag: (payload: ActiveDragPayload) => void;
  setHoverTarget: (target: DropZoneTarget | null) => void;
  cancelDrag: () => void;
  completeDrop: () => void;
}

export const useTicketDragStore = create<TicketDragStoreState>((set, get) => ({
  isDragging: false,
  activeDrag: null,
  hoverTarget: null,

  startDrag: (payload) => {
    document.body.classList.add('is-dragging-ticket');
    set({
      isDragging: true,
      activeDrag: payload,
      hoverTarget: null,
    });
  },

  setHoverTarget: (target) => {
    const current = get().hoverTarget;
    // Simple equality check to prevent redundant state broadcasts
    if (current === target) return;
    if (
      current &&
      target &&
      current.type === target.type &&
      (current as unknown as Record<string, unknown>).sprintId === (target as unknown as Record<string, unknown>).sprintId &&
      (current as unknown as Record<string, unknown>).status === (target as unknown as Record<string, unknown>).status &&
      (current as unknown as Record<string, unknown>).assigneeId === (target as unknown as Record<string, unknown>).assigneeId
    ) {
      return;
    }
    set({ hoverTarget: target });
  },

  cancelDrag: () => {
    document.body.classList.remove('is-dragging-ticket');
    set({
      isDragging: false,
      activeDrag: null,
      hoverTarget: null,
    });
  },

  completeDrop: () => {
    const { activeDrag, hoverTarget } = get();
    document.body.classList.remove('is-dragging-ticket');
    if (activeDrag && hoverTarget) {
      activeDrag.onDrop(hoverTarget);
    }
    set({
      isDragging: false,
      activeDrag: null,
      hoverTarget: null,
    });
  },
}));
