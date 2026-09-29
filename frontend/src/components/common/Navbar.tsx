import React from 'react';
import { useAuth } from '../../store';
import { PublicNavbar } from '../public/PublicNavbar';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';

/**
 * Top Navigation Header wrapper.
 * Dynamically routes to PublicNavbar or WorkspaceHeader based on authentication state.
 */
export const Navbar: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <PublicNavbar />;
  }

  return <WorkspaceHeader />;
};

export { PublicNavbar, WorkspaceHeader };
