import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store';
import { ForbiddenPage } from '../../pages/ForbiddenPage.js';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAdmin =
    user?.isAdmin ||
    user?.groups?.some((g) => ['administrators', 'admin', 'admins'].includes(g.toLowerCase())) ||
    user?.systemRole === 'ADMIN';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <ForbiddenPage
        title="Admin Console Access Denied"
        message="You do not have administrative privileges to access the Admin Center. Please contact your workspace administrator if you need access."
        requiredRole="ADMIN"
      />
    );
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--md-sys-color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
