import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ShieldAlert, User, LogOut, Lock } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-3xl m3-surface">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600/40 transition-all shadow-lg shadow-indigo-500/10">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              BugTracker
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              Secured
            </span>
          </div>
        </Link>

        {/* Navigation & User Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Profile Link */}
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive('/profile')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{user.fullName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    user.systemRole === 'ADMIN'
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {user.systemRole}
                </span>
              </Link>

              {/* Admin Security Dashboard Link */}
              {user.systemRole === 'ADMIN' && (
                <Link
                  to="/admin/security-logs"
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive('/admin/security-logs')
                      ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                  title="Security Forensics & Audit Logs"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline text-xs font-semibold">Security Audit</span>
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                title="Sign out of system"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive('/login')
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-600/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
