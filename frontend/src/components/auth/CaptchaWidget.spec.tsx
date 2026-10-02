import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { CaptchaWidget, type CaptchaWidgetHandle } from './CaptchaWidget';

describe('CaptchaWidget Component', () => {
  beforeEach(() => {
    delete (window as any).turnstile;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Offline development fallback mode', () => {
    it('renders the interactive simulator when no sitekey is provided', () => {
      const onVerify = vi.fn();
      render(<CaptchaWidget siteKey="" onVerify={onVerify} />);

      expect(screen.getByText(/verify you are human/i)).toBeInTheDocument();
      expect(screen.getByTitle(/verify you are human/i)).toBeInTheDocument();
      expect(screen.getByText(/turnstile/i)).toBeInTheDocument();
    });

    it('simulates verification when clicked and calls onVerify with valid-captcha-token', async () => {
      vi.useFakeTimers();
      const onVerify = vi.fn();
      render(<CaptchaWidget siteKey="" onVerify={onVerify} />);

      const button = screen.getByTitle(/verify you are human/i);
      fireEvent.click(button);

      expect(screen.getByText(/checking browser\.\.\./i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(650);
      });

      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(onVerify).toHaveBeenCalledWith('valid-captcha-token');
      vi.useRealTimers();
    });

    it('resets verification state when reset button is clicked', async () => {
      vi.useFakeTimers();
      const onVerify = vi.fn();
      const onReset = vi.fn();
      render(<CaptchaWidget siteKey="" onVerify={onVerify} onReset={onReset} />);

      const button = screen.getByTitle(/verify you are human/i);
      fireEvent.click(button);

      act(() => {
        vi.advanceTimersByTime(650);
      });

      const resetButton = screen.getByRole('button', { name: /\(reset\)/i });
      fireEvent.click(resetButton);

      expect(screen.getByText(/verify you are human/i)).toBeInTheDocument();
      expect(onReset).toHaveBeenCalledOnce();
      vi.useRealTimers();
    });

    it('resets via imperative ref handle', async () => {
      vi.useFakeTimers();
      const onVerify = vi.fn();
      const onReset = vi.fn();
      const ref = createRef<CaptchaWidgetHandle>();

      render(<CaptchaWidget siteKey="" ref={ref} onVerify={onVerify} onReset={onReset} />);

      const button = screen.getByTitle(/verify you are human/i);
      fireEvent.click(button);

      act(() => {
        vi.advanceTimersByTime(650);
      });

      expect(screen.getByText(/verified/i)).toBeInTheDocument();

      act(() => {
        ref.current?.reset();
      });

      expect(screen.getByText(/verify you are human/i)).toBeInTheDocument();
      expect(onReset).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Cloudflare Turnstile explicit rendering mode', () => {
    it('injects official Turnstile explicit script when sitekey is provided', () => {
      const onVerify = vi.fn();
      render(<CaptchaWidget siteKey="1x00000000000000000000AA" onVerify={onVerify} />);

      const script = document.querySelector('script[src*="turnstile/v0/api.js"]');
      expect(script).toBeTruthy();
      expect(script?.getAttribute('src')).toBe(
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
      );
    });

    it('calls turnstile.render with official options and invokes onVerify on token callback', () => {
      const renderMock = vi.fn().mockReturnValue('widget-id-123');
      const removeMock = vi.fn();
      const resetMock = vi.fn();

      window.turnstile = {
        render: renderMock,
        remove: removeMock,
        reset: resetMock,
        getResponse: vi.fn().mockReturnValue('token-abc'),
        isExpired: vi.fn().mockReturnValue(false),
      };

      const onVerify = vi.fn();
      const onReset = vi.fn();

      const { unmount } = render(
        <CaptchaWidget
          siteKey="1x00000000000000000000AA"
          action="signup"
          theme="auto"
          size="flexible"
          onVerify={onVerify}
          onReset={onReset}
        />,
      );

      expect(renderMock).toHaveBeenCalledOnce();
      const renderCallArgs = renderMock.mock.calls[0];
      const options = renderCallArgs[1];

      expect(options.sitekey).toBe('1x00000000000000000000AA');
      expect(options.action).toBe('signup');
      expect(options.theme).toBe('auto');
      expect(options.size).toBe('flexible');
      expect(options.appearance).toBe('always');
      expect(options.retry).toBe('auto');
      expect(options['refresh-expired']).toBe('auto');

      // Simulate token callback
      act(() => {
        options.callback('cf-turnstile-token-xyz');
      });
      expect(onVerify).toHaveBeenCalledWith('cf-turnstile-token-xyz');

      // Simulate unmount cleanup
      unmount();
      expect(removeMock).toHaveBeenCalledWith('widget-id-123');
    });

    it('handles interactive timeout callback and error callback', () => {
      let capturedOptions: any = null;
      window.turnstile = {
        render: vi.fn().mockImplementation((_container, options) => {
          capturedOptions = options;
          return 'widget-id-999';
        }),
        remove: vi.fn(),
        reset: vi.fn(),
        getResponse: vi.fn(),
        isExpired: vi.fn(),
      };

      const onError = vi.fn();
      const onTimeout = vi.fn();
      const onReset = vi.fn();

      render(
        <CaptchaWidget
          siteKey="1x00000000000000000000AA"
          onVerify={vi.fn()}
          onError={onError}
          onTimeout={onTimeout}
          onReset={onReset}
        />,
      );

      expect(capturedOptions).toBeTruthy();

      // Trigger timeout callback
      act(() => {
        capturedOptions['timeout-callback']();
      });

      expect(onTimeout).toHaveBeenCalledOnce();
      expect(onReset).toHaveBeenCalled();
      expect(screen.getByText(/verification timed out/i)).toBeInTheDocument();
    });
  });
});
