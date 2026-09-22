import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-200">
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

          {/* Footer with Academic Information & Developer Links */}
          <footer className="w-full border-t border-slate-800/80 bg-[#080b11] py-8 px-4 mt-12 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-slate-300">Bug / Issue Tracking System</span>
                <span>• Vasyl Fufalko (Group IPZ-43, 2026)</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-400">
                <a
                  href="http://localhost:3000/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>Swagger Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>Mailpit (8025)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="http://localhost:9333"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>SeaweedFS (9333)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
