import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Shield, ShieldAlert, User, LogOut, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full m3-card transition-colors">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center group-hover:scale-105 transition-all shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-[var(--md-sys-color-on-surface)]">
            BugTracker
          </span>
        </Link>

        {/* Right Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] active:scale-95 transition-all"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {user ? (
            <>
              {/* Profile Pill */}
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive('/profile')
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                    : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{user.fullName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    user.systemRole === 'ADMIN'
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {user.systemRole}
                </span>
              </Link>

              {/* Admin Security Link */}
              {user.systemRole === 'ADMIN' && (
                <Link
                  to="/admin/security-logs"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive('/admin/security-logs')
                      ? 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]'
                      : 'text-[var(--md-sys-color-warning)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                  }`}
                  title="Security Audit Logs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Security Log</span>
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive('/login')
                    ? 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full text-xs font-semibold m3-btn-filled shadow-sm"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
