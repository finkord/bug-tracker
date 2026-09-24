import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type UserProfile, type AuthTokens } from '../api/client';
import { Clock, LogIn } from 'lucide-react';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (tokens: AuthTokens) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen to unauthorized event dispatched on token expiration
    const handleUnauthorized = () => {
      setUser(null);
      setSessionExpiredOpen(true);
    };

    window.addEventListener('bt:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bt:unauthorized', handleUnauthorized);
  }, []);

  const login = async (tokens: AuthTokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    if (tokens.user) {
      setUser({
        ...tokens.user,
        oauthProvider: tokens.user.oauthProvider || 'LOCAL',
      });
      setLoading(false);
    } else {
      setLoading(true);
    }
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Proceed with client logout even if backend token is already expired
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}

      {/* Global Session Expired Modal */}
      {sessionExpiredOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[28px] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Session Expired
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Your 8-hour working session has expired or could not be renewed automatically.
                Please sign in again to continue your work.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSessionExpiredOpen(false);
                  window.location.href = '/login';
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold text-xs shadow-xs hover:opacity-90 active:scale-98 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
