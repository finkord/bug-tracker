import { useState, useEffect, useLayoutEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export interface CaptchaWidgetHandle {
  reset: () => void;
}

interface Props {
  onVerify: (token: string) => void;
  onReset?: () => void;
  siteKey?: string;
  action?: string;
}

export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, Props>(
  ({ onVerify, onReset, siteKey: propSiteKey, action = 'signup' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Consume active theme from ThemeContext (light vs dark)
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Read sitekey from props or Vite environment variable
    const activeSiteKey =
      propSiteKey || (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined);

    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;
    const onResetRef = useRef(onReset);
    onResetRef.current = onReset;

    const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Expose reset imperative handle to parent components (single-use token lifecycle)
    useImperativeHandle(ref, () => ({
      reset: () => {
        setStatus('idle');
        setErrorMessage(null);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            // Ignore reset error
          }
        }
        onResetRef.current?.();
      },
    }));

    // Synchronously clean up Turnstile widget before React unmounts DOM nodes to prevent "Cannot find Widget" warning
    useLayoutEffect(() => {
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          const currentId = widgetIdRef.current;
          widgetIdRef.current = null;
          try {
            window.turnstile.remove(currentId);
          } catch {
            // Ignore removal errors during unmount
          }
        }
      };
    }, []);

    // Cloudflare Turnstile integration when sitekey is configured
    useEffect(() => {
      if (!activeSiteKey) return;

      let isMounted = true;

      const renderWidget = () => {
        if (!window.turnstile || !containerRef.current || !isMounted) return;

        // Clean up previous widget instance if exists (e.g. on theme toggle)
        if (widgetIdRef.current && window.turnstile) {
          try {
            const currentId = widgetIdRef.current;
            widgetIdRef.current = null;
            window.turnstile.remove(currentId);
          } catch {
            // Ignore removal errors during remount
          }
        }

        // Clear container to avoid duplicate nested frames
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: activeSiteKey,
            action,
            theme: isDark ? 'dark' : 'light',
            callback: (token: string) => {
              if (!isMounted) return;
              setStatus('verified');
              setErrorMessage(null);
              onVerifyRef.current(token);
            },
            'error-callback': (code?: string) => {
              if (!isMounted) return;
              setStatus('error');
              setErrorMessage(code ? `Turnstile challenge error: ${code}` : 'Challenge failed');
              onResetRef.current?.();
            },
            'expired-callback': () => {
              if (!isMounted) return;
              setStatus('idle');
              onResetRef.current?.();
            },
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('Failed to render Turnstile widget:', err);
        }
      };

      // Load Turnstile script if not already present
      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        document.head.appendChild(script);
      } else if (window.turnstile) {
        renderWidget();
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            const currentId = widgetIdRef.current;
            widgetIdRef.current = null;
            window.turnstile.remove(currentId);
          } catch {
            // Ignore cleanup errors
          }
        }
      };
    }, [activeSiteKey, action, isDark]);

    // If real Cloudflare Turnstile sitekey is configured, render Turnstile container
    if (activeSiteKey) {
      return (
        <div className="w-full flex flex-col items-center justify-center my-1.5">
          {/* Container with theme-specific styling: clipped in dark mode to remove white 1px border; natural border in light mode */}
          <div
            className="flex items-center justify-center transition-all"
            style={
              isDark
                ? {
                    width: '300px',
                    height: '65px',
                    overflow: 'hidden',
                    clipPath: 'inset(1.5px round 6px)',
                    borderRadius: '6px',
                  }
                : {
                    width: '300px',
                    height: '65px',
                    overflow: 'hidden',
                    borderRadius: '6px',
                  }
            }
          >
            <div ref={containerRef} style={{ width: '300px', height: '65px' }} />
          </div>
          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-error)] mt-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage || 'Verification failed. Please try again.'}</span>
            </div>
          )}
        </div>
      );
    }

    // Fallback simulator for offline development / testing when no sitekey is configured
    const handleClick = () => {
      if (status === 'verified') return;

      setStatus('verifying');
      // Simulate security check verification
      setTimeout(() => {
        setStatus('verified');
        onVerify('valid-captcha-token');
      }, 700);
    };

    const handleReset = () => {
      setStatus('idle');
      if (onReset) onReset();
    };

    return (
      <div className="w-full p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClick}
            disabled={status === 'verifying'}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
              status === 'verified'
                ? 'bg-[var(--md-sys-color-success)] border-transparent text-[var(--md-sys-color-on-primary)]'
                : status === 'verifying'
                ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)] active:scale-95'
            }`}
            title="Verify you are human"
          >
            {status === 'verified' && <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in-50" />}
            {status === 'verifying' && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--md-sys-color-primary)]" />}
          </button>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
              {status === 'verified' ? (
                <span className="text-[var(--md-sys-color-success)] font-semibold flex items-center gap-1.5">
                  Verified
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] hover:underline ml-1"
                  >
                    (Reset)
                  </button>
                </span>
              ) : status === 'verifying' ? (
                <span className="text-[var(--md-sys-color-primary)]">Checking browser...</span>
              ) : (
                <span>Verify you are human</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-outline)] pl-2">
          <ShieldCheck className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span className="font-medium text-[11px] text-[var(--md-sys-color-on-surface-variant)]">Turnstile</span>
        </div>
      </div>
    );
  },
);

CaptchaWidget.displayName = 'CaptchaWidget';
