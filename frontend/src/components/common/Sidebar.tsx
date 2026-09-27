import React from 'react';
import { SuperSidebar } from '../navigation/SuperSidebar';

interface SidebarProps {
  currentProjectId?: number;
}

/**
 * Super-Sidebar navigation export wrapper.
 * Re-exports the modular SuperSidebar architecture.
 */
export const Sidebar: React.FC<SidebarProps> = (props) => {
  return <SuperSidebar {...props} />;
};

export { SuperSidebar };
