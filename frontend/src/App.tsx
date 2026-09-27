import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { BroadcastProvider } from './context/BroadcastContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ActivatePage } from './pages/ActivatePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { PreferencesPage } from './pages/PreferencesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { KanbanBoardPage } from './pages/KanbanBoardPage';
import { BacklogPage } from './pages/BacklogPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { AdvancedSearchPage } from './pages/AdvancedSearchPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRbacPage } from './pages/AdminRbacPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] transition-colors duration-200">
        <Navbar />
        <main className="flex-1 min-w-0">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-background)] transition-colors duration-200 select-none">
      {/* ─── Full-Height Super-Sidebar (y=0 to y=100vh) ────────────────────── */}
      <Sidebar />

      {/* ─── Right Workspace Column: Top Control Strip + Floating Canvas Card ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar />

        {/* ─── Elevated Main Canvas Card (Optical Curve Metaphor) ──────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden mx-1 mb-1 sm:mx-2 sm:mb-2 md:mr-3 md:mb-3 md:mx-0 bg-[var(--md-sys-color-background)] rounded-xl sm:rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)]/25 shadow-xs transition-all duration-200 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <BroadcastProvider>
            <SidebarProvider>
              <AppLayout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/activate" element={<ActivatePage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

                  {/* Protected Workspace & Board Routes */}
                  <Route
                    path="/projects"
                    element={
                      <ProtectedRoute>
                        <ProjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/board"
                    element={
                      <ProtectedRoute>
                        <KanbanBoardPage />
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
                    path="/backlog"
                    element={
                      <ProtectedRoute>
                        <BacklogPage />
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
                    path="/preferences"
                    element={
                      <ProtectedRoute>
                        <PreferencesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Project Settings / People */}
                  <Route
                    path="/projects/:id/settings"
                    element={
                      <ProtectedRoute>
                        <ProjectSettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Console Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage defaultTab="users" />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage defaultTab="users" />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/rbac"
                    element={
                      <AdminRoute>
                        <AdminRbacPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/security-logs"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage defaultTab="system" />
                      </AdminRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </SidebarProvider>
          </BroadcastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
