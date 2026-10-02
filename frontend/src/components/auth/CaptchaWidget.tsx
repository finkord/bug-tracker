import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  'error-callback'?: (errorCode?: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
  'unsupported-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  tabindex?: number;
  size?: 'normal' | 'compact' | 'flexible';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  'refresh-timeout'?: 'auto' | 'manual' | 'never';
  appearance?: 'always' | 'execute' | 'interaction-only';
  execution?: 'render' | 'execute';
  'response-field'?: boolean;
  'response-field-name'?: string;
}

export interface TurnstileObject {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId: string) => string;
  isExpired: (widgetId: string) => boolean;
  execute?: (container?: string | HTMLElement, options?: TurnstileRenderOptions) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileObject;
    onloadTurnstileCallback?: () => void;
  }
}

export interface CaptchaWidgetHandle {
  reset: () => void;
  getResponse: () => string | null;
  isExpired: () => boolean;
}

export interface CaptchaWidgetProps {
  onVerify: (token: string) => void;
  onReset?: () => void;
  onError?: (errorCode?: string) => void;
  onTimeout?: () => void;
  onExpired?: () => void;
  siteKey?: string;
  action?: string;
  cData?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  appearance?: 'always' | 'execute' | 'interaction-only';
  retry?: 'auto' | 'never';
  refreshExpired?: 'auto' | 'manual' | 'never';
}

/**
 * Human-readable mapping for Cloudflare Turnstile error codes.
 * Reference: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/
 */
function formatTurnstileError(code?: string): string {
  if (!code) return 'Security verification failed. Please try again.';
  switch (code) {
    case '110200':
      return 'Turnstile configuration error: Domain name is not authorized.';
    case '110600':
      return 'Turnstile challenge execution failed. Please refresh.';
    case '300030':
      return 'Network connection issue with verification server. Retrying...';
    case '600010':
      return 'Interactive challenge timed out. Please try again.';
    default:
      return `Security verification error (${code}). Please retry.`;
  }
}

export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  (
    {
      onVerify,
      onReset,
      onError,
      onTimeout,
      onExpired,
      siteKey: propSiteKey,
      action = 'signup',
      cData,
      theme = 'auto',
      size = 'flexible',
      appearance = 'always',
      retry = 'auto',
      refreshExpired = 'auto',
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Read sitekey from props or Vite environment variable
    const activeSiteKey =
      propSiteKey !== undefined
        ? (propSiteKey || undefined)
        : (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined);

    // Keep callbacks current via refs without violating React 19 render rules
    const callbacksRef = useRef({
      onVerify,
      onReset,
      onError,
      onTimeout,
      onExpired,
    });

    useEffect(() => {
      callbacksRef.current = {
        onVerify,
        onReset,
        onError,
        onTimeout,
        onExpired,
      };
    });

    const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Expose imperative handle matching official Turnstile API
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
        callbacksRef.current.onReset?.();
      },
      getResponse: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            return window.turnstile.getResponse(widgetIdRef.current) || null;
          } catch {
            return null;
          }
        }
        return null;
      },
      isExpired: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            return window.turnstile.isExpired(widgetIdRef.current);
          } catch {
            return false;
          }
        }
        return false;
      },
    }));

    // Synchronously clean up Turnstile widget before React unmounts DOM nodes
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

    // Cloudflare Turnstile integration: Explicit rendering with full official configurations
    useEffect(() => {
      if (!activeSiteKey) return;

      let isMounted = true;

      const renderWidget = () => {
        if (!window.turnstile || !containerRef.current || !isMounted) return;

        // Clean up previous widget instance if exists
        if (widgetIdRef.current && window.turnstile) {
          try {
            const currentId = widgetIdRef.current;
            widgetIdRef.current = null;
            window.turnstile.remove(currentId);
          } catch {
            // Ignore removal errors
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
            cData,
            theme,
            size,
            appearance,
            retry,
            'retry-interval': 8000,
            'refresh-expired': refreshExpired,
            'refresh-timeout': 'auto',
            callback: (token: string) => {
              if (!isMounted) return;
              setStatus('verified');
              setErrorMessage(null);
              callbacksRef.current.onVerify(token);
            },
            'error-callback': (code?: string) => {
              if (!isMounted) return;
              setStatus('error');
              setErrorMessage(formatTurnstileError(code));
              callbacksRef.current.onError?.(code);
              callbacksRef.current.onReset?.();
            },
            'expired-callback': () => {
              if (!isMounted) return;
              setStatus('idle');
              callbacksRef.current.onExpired?.();
              callbacksRef.current.onReset?.();
            },
            'timeout-callback': () => {
              if (!isMounted) return;
              setStatus('error');
              setErrorMessage('Verification timed out. Please try again.');
              callbacksRef.current.onTimeout?.();
              callbacksRef.current.onReset?.();
            },
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('Failed to render Cloudflare Turnstile widget:', err);
        }
      };

      // Render immediately if window.turnstile is already available
      if (window.turnstile) {
        renderWidget();
      } else {
        const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        const existingScript = document.querySelector(`script[src*="turnstile/v0/api.js"]`);

        if (!existingScript) {
          const script = document.createElement('script');
          script.src = scriptUrl;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            renderWidget();
          };
          document.head.appendChild(script);
        } else {
          const checkInterval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkInterval);
              renderWidget();
            }
          }, 100);
          return () => clearInterval(checkInterval);
        }
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
    }, [activeSiteKey, action, cData, theme, size, appearance, retry, refreshExpired]);

    // If real Cloudflare Turnstile sitekey is configured, render Turnstile container
    if (activeSiteKey) {
      return (
        <div className="w-full flex flex-col my-2">
          {/* Responsive full-width container for Cloudflare Turnstile matching input field widths */}
          <div className="w-full min-h-[65px] transition-all">
            <div
              ref={containerRef}
              className="w-full min-h-[65px] [&>div]:!w-full [&_iframe]:!w-full"
            />
          </div>
          {status === 'error' && (
            <div className="flex items-center justify-between gap-1.5 text-xs text-[var(--md-sys-color-error)] mt-2 font-medium bg-[var(--md-sys-color-error-container)]/20 px-3 py-2 rounded-xl border border-[var(--md-sys-color-error)]/30">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{errorMessage || 'Verification failed. Please try again.'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage(null);
                  if (widgetIdRef.current && window.turnstile) {
                    try {
                      window.turnstile.reset(widgetIdRef.current);
                    } catch {
                      // Ignore error
                    }
                  }
                  callbacksRef.current.onReset?.();
                }}
                className="text-[11px] underline hover:no-underline font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
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
        callbacksRef.current.onVerify('valid-captcha-token');
      }, 600);
    };

    const handleReset = () => {
      setStatus('idle');
      callbacksRef.current.onReset?.();
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
                    className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] hover:underline ml-1 cursor-pointer"
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
