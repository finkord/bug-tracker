import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './ProtectedRoute';

let mockAuthState = {
  user: null as any,
  loading: false,
};

vi.mock('../../store', () => ({
  useAuth: () => mockAuthState,
}));

describe('Route Guards (ProtectedRoute, AdminRoute, PublicOnlyRoute)', () => {
  beforeEach(() => {
    mockAuthState = { user: null, loading: false };
    vi.clearAllMocks();
  });

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated user to /login', () => {
      mockAuthState = { user: null, loading: false };

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Protected Area</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Secret Protected Area')).not.toBeInTheDocument();
    });

    it('renders children for authenticated user', () => {
      mockAuthState = {
        user: { id: 1, email: 'user@example.com', isAdmin: false },
        loading: false,
      };

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <ProtectedRoute>
            <div>Secret Protected Area</div>
          </ProtectedRoute>
        </MemoryRouter>,
      );

      expect(screen.getByText('Secret Protected Area')).toBeInTheDocument();
    });
  });

  describe('AdminRoute', () => {
    it('redirects unauthenticated user to /login', () => {
      mockAuthState = { user: null, loading: false };

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Console Content</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Admin Console Content')).not.toBeInTheDocument();
    });

    it('displays ForbiddenPage with 403 when authenticated user lacks admin privileges', () => {
      mockAuthState = {
        user: { id: 2, email: 'regular@example.com', isAdmin: false, systemRole: 'USER' },
        loading: false,
      };

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminRoute>
            <div>Admin Console Content</div>
          </AdminRoute>
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /admin console access denied/i })).toBeInTheDocument();
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByText('Admin Console Content')).not.toBeInTheDocument();
    });

    it('renders admin content for user with isAdmin flag', () => {
      mockAuthState = {
        user: { id: 1, email: 'admin@example.com', isAdmin: true },
        loading: false,
      };

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminRoute>
            <div>Admin Console Content</div>
          </AdminRoute>
        </MemoryRouter>,
      );

      expect(screen.getByText('Admin Console Content')).toBeInTheDocument();
    });

    it('renders admin content for user with systemRole ADMIN', () => {
      mockAuthState = {
        user: { id: 1, email: 'admin@example.com', isAdmin: false, systemRole: 'ADMIN' },
        loading: false,
      };

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminRoute>
            <div>Admin Console Content</div>
          </AdminRoute>
        </MemoryRouter>,
      );

      expect(screen.getByText('Admin Console Content')).toBeInTheDocument();
    });
  });

  describe('PublicOnlyRoute', () => {
    it('renders children when guest', () => {
      mockAuthState = { user: null, loading: false };

      render(
        <MemoryRouter initialEntries={['/login']}>
          <PublicOnlyRoute>
            <div>Login Form</div>
          </PublicOnlyRoute>
        </MemoryRouter>,
      );

      expect(screen.getByText('Login Form')).toBeInTheDocument();
    });

    it('redirects authenticated user to /dashboard', () => {
      mockAuthState = {
        user: { id: 1, email: 'user@example.com' },
        loading: false,
      };

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard View</div>} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <div>Login Form</div>
                </PublicOnlyRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Dashboard View')).toBeInTheDocument();
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });
  });
});
