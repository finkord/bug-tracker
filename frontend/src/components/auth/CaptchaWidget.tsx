import {
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';

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

    // Read sitekey from props or Vite environment variable (treat placeholders as unconfigured)
    const rawKey =
      propSiteKey !== undefined
        ? propSiteKey
        : (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined);

    const activeSiteKey =
      rawKey && rawKey !== 'placeholder_turnstile_site_key' ? rawKey.trim() : undefined;

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

    // Expose imperative handle matching official Turnstile API
    useImperativeHandle(ref, () => ({
      reset: () => {
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
            sitekey: activeSiteKey || '',
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
              callbacksRef.current.onVerify(token);
            },
            'error-callback': (code?: string) => {
              if (!isMounted) return;
              callbacksRef.current.onError?.(code);
              callbacksRef.current.onReset?.();
            },
            'expired-callback': () => {
              if (!isMounted) return;
              callbacksRef.current.onExpired?.();
              callbacksRef.current.onReset?.();
            },
            'timeout-callback': () => {
              if (!isMounted) return;
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

    return (
      <div className="w-full flex flex-col my-2">
        {/* Full-width container managed entirely by Cloudflare Turnstile */}
        <div className="w-full min-h-[65px] transition-all">
          <div
            ref={containerRef}
            className="w-full min-h-[65px] [&>div]:!w-full [&_iframe]:!w-full"
          />
        </div>
      </div>
    );
  },
);

CaptchaWidget.displayName = 'CaptchaWidget';
