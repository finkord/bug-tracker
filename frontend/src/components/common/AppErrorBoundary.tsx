import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '../ui/index.js';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled React Error Boundary caught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-testid="app-error-boundary-fallback"
          className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="max-w-lg w-full flex flex-col items-center space-y-5">
            {/* Warning Shield Metaphor */}
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--md-sys-color-error-container)]/25 text-[var(--md-sys-color-error)] border border-[var(--md-sys-color-error)]/20 shadow-xs">
              <AlertTriangle className="w-10 h-10 stroke-[1.75]" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Something went wrong
              </h1>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-md mx-auto">
                An unexpected error occurred while displaying this page. Your session and saved data are intact.
              </p>
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="filled"
                size="md"
                onClick={this.handleReset}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Try Again
              </Button>

              <Button
                variant="tonal"
                size="md"
                onClick={this.handleReload}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reload Page
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Back to Home
              </Button>
            </div>

            {/* Collapsible Technical Details */}
            {this.state.error && (
              <div className="w-full text-left pt-4">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 transition-colors"
                >
                  <span>Technical details</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      this.state.showDetails ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/20 overflow-x-auto max-h-48 text-[11px] font-mono text-[var(--md-sys-color-error)] select-text">
                    <p className="font-semibold mb-1">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap text-[10px] text-[var(--md-sys-color-on-surface-variant)] opacity-80">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
