import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ActivatePage } from './pages/ActivatePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminSecurityAuditPage } from './pages/AdminSecurityAuditPage';
import { Shield, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] transition-colors duration-200">
            <Navbar />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/activate" element={<ActivatePage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/security-logs"
                  element={
                    <AdminRoute>
                      <AdminSecurityAuditPage />
                    </AdminRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer with Developer Information & Local Dashboards */}
            <footer className="w-full border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] py-8 px-4 mt-12 text-xs text-[var(--md-sys-color-on-surface-variant)] transition-colors">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">BugTracker</span>
                  <span>• Volodymyr Fufalko</span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="http://localhost:3000/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 transition-colors"
                  >
                    <span>API Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 transition-colors"
                  >
                    <span>Mailbox (8025)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="http://localhost:9333"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--md-sys-color-primary)] flex items-center gap-1 transition-colors"
                  >
                    <span>Storage (9333)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
