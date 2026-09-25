import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  showCollapsedLabels: boolean;
  setShowCollapsedLabels: (show: boolean) => void;
  toggleCollapsedLabels: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('bt_sidebar_collapsed') === 'true';
  });

  const [showCollapsedLabels, setShowCollapsedLabelsState] = useState<boolean>(() => {
    return localStorage.getItem('bt_pref_collapsed_labels') === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem('bt_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setCollapsed = (val: boolean) => {
    setCollapsedState(val);
    localStorage.setItem('bt_sidebar_collapsed', String(val));
  };

  const setShowCollapsedLabels = (val: boolean) => {
    setShowCollapsedLabelsState(val);
    localStorage.setItem('bt_pref_collapsed_labels', String(val));
  };

  const toggleCollapsedLabels = () => {
    setShowCollapsedLabelsState((prev) => {
      const next = !prev;
      localStorage.setItem('bt_pref_collapsed_labels', String(next));
      return next;
    });
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleSidebar,
        setCollapsed,
        mobileOpen,
        toggleMobile,
        closeMobile,
        showCollapsedLabels,
        setShowCollapsedLabels,
        toggleCollapsedLabels,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
