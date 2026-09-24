import React, { createContext, useContext, useState, useEffect } from 'react';

export type BroadcastSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface BroadcastConfig {
  enabled: boolean;
  message: string;
  severity: BroadcastSeverity;
  updatedAt: string;
  author: string;
}

const DEFAULT_BROADCAST: BroadcastConfig = {
  enabled: true,
  message: '🚀 BugTracker v2.0 Operational: Real-Time Sockets & SeaweedFS Active',
  severity: 'info',
  updatedAt: new Date().toISOString(),
  author: 'DevOps Lead',
};

const STORAGE_KEY = 'bt_system_broadcast_config';
const BROADCAST_EVENT = 'bt_broadcast_updated';

interface BroadcastContextType {
  broadcast: BroadcastConfig;
  updateBroadcast: (config: Partial<BroadcastConfig>) => void;
  resetBroadcast: () => void;
  isDismissed: boolean;
  dismissBroadcast: () => void;
}

const BroadcastContext = createContext<BroadcastContextType | undefined>(undefined);

export const BroadcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [broadcast, setBroadcast] = useState<BroadcastConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_BROADCAST;
    } catch {
      return DEFAULT_BROADCAST;
    }
  });

  const [isDismissed, setIsDismissed] = useState(false);

  // Sync across tabs and custom events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setBroadcast(parsed);
          setIsDismissed(false);
        } catch {
          // Ignore parse errors
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent<BroadcastConfig>) => {
      if (e.detail) {
        setBroadcast(e.detail);
        setIsDismissed(false);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(BROADCAST_EVENT as any, handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(BROADCAST_EVENT as any, handleCustomEvent);
    };
  }, []);

  const updateBroadcast = (partial: Partial<BroadcastConfig>) => {
    setBroadcast((prev) => {
      const next: BroadcastConfig = {
        ...prev,
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: next }));
      setIsDismissed(false);
      return next;
    });
  };

  const resetBroadcast = () => {
    updateBroadcast(DEFAULT_BROADCAST);
  };

  const dismissBroadcast = () => {
    setIsDismissed(true);
  };

  return (
    <BroadcastContext.Provider
      value={{
        broadcast,
        updateBroadcast,
        resetBroadcast,
        isDismissed,
        dismissBroadcast,
      }}
    >
      {children}
    </BroadcastContext.Provider>
  );
};

export const useBroadcast = () => {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error('useBroadcast must be used within a BroadcastProvider');
  }
  return context;
};
