import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { BroadcastProvider } from './context/BroadcastContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ActivatePage } from './pages/ActivatePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { KanbanBoardPage } from './pages/KanbanBoardPage';
import { BacklogPage } from './pages/BacklogPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { AdvancedSearchPage } from './pages/AdvancedSearchPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { Shield, ExternalLink } from 'lucide-react';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] transition-colors duration-200">
      {user && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar />

        <main className="flex-1 overflow-x-hidden min-w-0">
          {children}
        </main>

        {/* Footer across available content width */}
        <footer className="w-full border-t border-[var(--md-sys-color-outline-variant)]/30 bg-[var(--md-sys-color-surface-container-low)] py-4 px-4 sm:px-6 text-xs text-[var(--md-sys-color-on-surface-variant)] transition-colors z-10">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
            <span className="font-semibold text-[var(--md-sys-color-on-surface)]">BugTracker</span>
            <span>• Volodymyr Fufalko (PPofSE Lab 6–7)</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="http://localhost:3000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 transition-colors"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 transition-colors"
            >
              <span>Mailpit Mailbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://localhost:9333"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 transition-colors"
            >
              <span>SeaweedFS S3</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
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
                  path="/issues/:id"
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
