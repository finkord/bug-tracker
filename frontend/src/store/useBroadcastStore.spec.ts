import { describe, it, expect, beforeEach } from 'vitest';
import { useBroadcastStore, DEFAULT_BROADCAST } from './useBroadcastStore';

describe('useBroadcastStore', () => {
  beforeEach(() => {
    useBroadcastStore.getState().resetBroadcast();
  });

  it('should initialize with default broadcast config and isDismissed false', () => {
    const state = useBroadcastStore.getState();
    expect(state.broadcast.enabled).toBe(true);
    expect(state.broadcast.message).toBe(DEFAULT_BROADCAST.message);
    expect(state.isDismissed).toBe(false);
  });

  it('should update broadcast partially', () => {
    useBroadcastStore.getState().updateBroadcast({
      message: 'Scheduled Maintenance at 02:00 UTC',
      severity: 'warning',
    });

    const state = useBroadcastStore.getState();
    expect(state.broadcast.message).toBe('Scheduled Maintenance at 02:00 UTC');
    expect(state.broadcast.severity).toBe('warning');
    expect(state.isDismissed).toBe(false);
  });

  it('should dismiss broadcast', () => {
    useBroadcastStore.getState().dismissBroadcast();
    expect(useBroadcastStore.getState().isDismissed).toBe(true);
  });

  it('should reset broadcast to defaults', () => {
    useBroadcastStore.getState().updateBroadcast({
      message: 'Temporary Alert',
      severity: 'critical',
    });
    useBroadcastStore.getState().dismissBroadcast();

    expect(useBroadcastStore.getState().isDismissed).toBe(true);

    useBroadcastStore.getState().resetBroadcast();

    const state = useBroadcastStore.getState();
    expect(state.broadcast.message).toBe(DEFAULT_BROADCAST.message);
    expect(state.broadcast.severity).toBe('info');
    expect(state.isDismissed).toBe(false);
  });
});
