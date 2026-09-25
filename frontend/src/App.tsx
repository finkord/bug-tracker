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
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-background)] transition-colors duration-200">
      {/* ─── Continuous Full-Width Top Bar (GitLab style) ──────────────────── */}
      <Navbar />

      {/* ─── Workspace Row: Sidebar (left) + Curved Main Canvas (right) ────── */}
      <div className="flex-1 flex min-w-0 relative">
        {user && <Sidebar />}

        <main
          className={`flex-1 overflow-x-hidden min-w-0 ${user
              ? 'bg-[var(--md-sys-color-background)] md:rounded-tl-[20px] md:border-t md:border-l md:border-[var(--md-sys-color-outline-variant)]/20 shadow-xs'
              : 'bg-[var(--md-sys-color-background)]'
            }`}
        >
          {children}
        </main>
      </div>

      {!user && <Footer />}
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
