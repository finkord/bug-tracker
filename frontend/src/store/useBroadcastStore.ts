import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BroadcastSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface BroadcastConfig {
  enabled: boolean;
  message: string;
  severity: BroadcastSeverity;
  updatedAt: string;
  author: string;
}

export const DEFAULT_BROADCAST: BroadcastConfig = {
  enabled: true,
  message: 'BugTracker v3 Operational: Real-Time Sockets & SeaweedFS Active',
  severity: 'info',
  updatedAt: new Date().toISOString(),
  author: 'DevOps Lead',
};

export interface BroadcastState {
  broadcast: BroadcastConfig;
  isDismissed: boolean;
  setBroadcast: (config: BroadcastConfig) => void;
  updateBroadcast: (config: Partial<BroadcastConfig>) => void;
  resetBroadcast: () => void;
  dismissBroadcast: () => void;
}

export const useBroadcastStore = create<BroadcastState>()(
  persist(
    (set) => ({
      broadcast: DEFAULT_BROADCAST,
      isDismissed: false,
      setBroadcast: (config: BroadcastConfig) =>
        set((state) => ({
          broadcast: config,
          isDismissed: state.broadcast.message !== config.message ? false : state.isDismissed,
        })),
      updateBroadcast: (partial: Partial<BroadcastConfig>) =>
        set((state) => ({
          broadcast: {
            ...state.broadcast,
            ...partial,
            updatedAt: new Date().toISOString(),
          },
          isDismissed: false,
        })),
      resetBroadcast: () =>
        set({
          broadcast: {
            ...DEFAULT_BROADCAST,
            updatedAt: new Date().toISOString(),
          },
          isDismissed: false,
        }),
      dismissBroadcast: () => set({ isDismissed: true }),
    }),
    {
      name: 'bt_system_broadcast_config',
      partialize: (state) => ({
        broadcast: state.broadcast,
      }),
    },
  ),
);

/**
 * Drop-in backward-compatible hook selector for existing components.
 */
export const useBroadcast = () => useBroadcastStore();
