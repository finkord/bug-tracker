import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { useAuth, useSidebar } from './store/index.js';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts.js';
import { useScrollRestoration } from './hooks/useScrollRestoration.js';
import { SessionExpiredModal } from './components/common/SessionExpiredModal.js';
import { WorkspaceHeader } from './components/workspace/WorkspaceHeader.js';
import { WorkspaceBroadcastBanner } from './components/workspace/WorkspaceBroadcastBanner.js';
import { Sidebar } from './components/common/Sidebar.js';
import { Footer } from './components/common/Footer.js';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/common/ProtectedRoute.js';
import { PageSkeletonLoader } from './components/common/PageSkeletonLoader.js';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal.js';
import { AppErrorBoundary } from './components/common/AppErrorBoundary.js';
import { Menu, Shield } from 'lucide-react';

const HomePage = React.lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ActivatePage = React.lazy(() =>
  import('./pages/ActivatePage').then((m) => ({ default: m.ActivatePage })),
);
const ForgotPasswordPage = React.lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = React.lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const ProfilePage = React.lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const UserProfileViewPage = React.lazy(() =>
  import('./pages/UserProfileViewPage').then((m) => ({ default: m.UserProfileViewPage })),
);
const PreferencesPage = React.lazy(() =>
  import('./pages/PreferencesPage').then((m) => ({ default: m.PreferencesPage })),
);
const ProjectsPage = React.lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const KanbanBoardPage = React.lazy(() =>
  import('./pages/KanbanBoardPage').then((m) => ({ default: m.KanbanBoardPage })),
);
const BacklogPage = React.lazy(() =>
  import('./pages/BacklogPage').then((m) => ({ default: m.BacklogPage })),
);
const IssueDetailPage = React.lazy(() =>
  import('./pages/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage })),
);
const AdvancedSearchPage = React.lazy(() =>
  import('./pages/AdvancedSearchPage').then((m) => ({ default: m.AdvancedSearchPage })),
);
const MyIssuesPage = React.lazy(() =>
  import('./pages/MyIssuesPage').then((m) => ({ default: m.MyIssuesPage })),
);
const TimeTrackingPage = React.lazy(() =>
  import('./pages/TimeTrackingPage').then((m) => ({ default: m.TimeTrackingPage })),
);
const AdminLayout = React.lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminUsersPage = React.lazy(() =>
  import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminTeamsPage = React.lazy(() =>
  import('./pages/admin/AdminTeamsPage').then((m) => ({ default: m.AdminTeamsPage })),
);
const AdminRbacPage = React.lazy(() =>
  import('./pages/admin/AdminRbacPage').then((m) => ({ default: m.AdminRbacPage })),
);
const AdminSecurityLogsPage = React.lazy(() =>
  import('./pages/admin/AdminSecurityLogsPage').then((m) => ({ default: m.AdminSecurityLogsPage })),
);
const AdminProjectsPage = React.lazy(() =>
  import('./pages/admin/AdminProjectsPage').then((m) => ({ default: m.AdminProjectsPage })),
);
const AdminAnnouncementsPage = React.lazy(() =>
  import('./pages/admin/AdminAnnouncementsPage').then((m) => ({ default: m.AdminAnnouncementsPage })),
);
const ProjectSettingsPage = React.lazy(() =>
  import('./pages/ProjectSettingsPage').then((m) => ({ default: m.ProjectSettingsPage })),
);
const ProjectOverviewPage = React.lazy(() =>
  import('./pages/ProjectOverviewPage').then((m) => ({ default: m.ProjectOverviewPage })),
);
const OAuthCallbackPage = React.lazy(() =>
  import('./pages/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })),
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ForbiddenPage = React.lazy(() =>
  import('./pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { toggleMobile, collapsed, collapseMode } = useSidebar();
  const isZeroPxSidebar = collapsed && collapseMode === 'hidden';

  useGlobalKeyboardShortcuts(Boolean(user));
  useScrollRestoration('main-content');

  if (loading) {
    return <PageSkeletonLoader />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-background)] transition-colors duration-200 select-none">
      {/* ─── Full-Height Super-Sidebar (y=0 to y=100vh) ────────────────────── */}
      <Sidebar />

      {/* ─── Right Workspace Column: Control Strip (Authed) + Floating Canvas Card ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {user && <WorkspaceHeader />}

        {/* ─── Elevated Main Canvas Card (Optical Curve Metaphor) ──────────── */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-w-0 outline-none focus:outline-none focus-visible:outline-none overflow-y-auto overflow-x-hidden mb-1 sm:mb-2 md:mb-3 bg-[var(--md-sys-color-background)] rounded-xl sm:rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)]/25 shadow-xs transition-[margin,colors] duration-200 ease-in-out flex flex-col ${
            isZeroPxSidebar
              ? 'mx-1 sm:mx-2 md:mx-3'
              : 'mr-1 sm:mr-2 md:mr-3 ml-0'
          } ${
            !user ? 'mt-1 sm:mt-2 md:mt-3' : ''
          }`}
        >
          {/* Global Broadcast Announcement Banner inside main page area */}
          <WorkspaceBroadcastBanner />

          {/* Mobile Top Strip for Guest Navigation (md:hidden) */}
          {!user && (
            <div className="md:hidden sticky top-0 z-30 px-4 h-14 shrink-0 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/15 bg-[var(--md-sys-color-surface-container-low)]/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-tight text-[var(--md-sys-color-on-surface)]">
                  BugTracker
                </span>
              </div>
              <button
                type="button"
                onClick={toggleMobile}
                className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs"
                aria-label="Open navigation menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col">{children}</div>

          {!user && <Footer />}
        </main>
      </div>
      <KeyboardShortcutsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <React.Suspense fallback={<PageSkeletonLoader />}>
            <AppErrorBoundary>
              <Routes>
              {/* Public & Guest-Only Routes */}
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/activate" element={<ActivatePage />} />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

              {/* Protected Workspace & Board Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-issues"
                element={
                  <ProtectedRoute>
                    <MyIssuesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/board"
                element={
                  <ProtectedRoute>
                    <KanbanBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/backlog"
                element={
                  <ProtectedRoute>
                    <BacklogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues/:key"
                element={
                  <ProtectedRoute>
                    <IssueDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <AdvancedSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/time-tracking"
                element={
                  <ProtectedRoute>
                    <TimeTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <ProtectedRoute>
                    <UserProfileViewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <PreferencesPage />
                  </ProtectedRoute>
                }
              />

              {/* Project Overview Hub */}
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectOverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectOverviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Project Settings / People */}
              <Route
                path="/projects/:projectId/settings"
                element={
                  <ProtectedRoute>
                    <ProjectSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/settings"
                element={
                  <ProtectedRoute>
                    <ProjectSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Console Nested Sub-Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="teams" element={<AdminTeamsPage />} />
                <Route path="rbac" element={<AdminRbacPage />} />
                <Route path="security" element={<AdminSecurityLogsPage />} />
                <Route path="projects" element={<AdminProjectsPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />

                {/* Backward Compatibility Aliases */}
                <Route path="dashboard" element={<Navigate to="/admin/users" replace />} />
                <Route path="security-logs" element={<Navigate to="/admin/security" replace />} />
              </Route>

                {/* Access Denied and Error Routes */}
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="/404" element={<NotFoundPage />} />

                {/* Catch-all 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppErrorBoundary>
          </React.Suspense>
        </AppLayout>
        <SessionExpiredModal />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
