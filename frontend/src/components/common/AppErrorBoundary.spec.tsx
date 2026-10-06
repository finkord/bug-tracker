import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from './AppErrorBoundary';

// Component that conditionally throws an error
const BuggyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test crash in component render');
  }
  return <div>Safe child content</div>;
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <AppErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Safe child content')).toBeInTheDocument();
  });

  it('catches render error and displays recovery fallback view', () => {
    render(
      <AppErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(
      screen.getByText(/an unexpected error occurred while displaying this page\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('toggles technical details with error stack when clicked', () => {
    render(
      <AppErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </AppErrorBoundary>,
    );

    const toggleButton = screen.getByRole('button', { name: /technical details/i });
    expect(screen.queryByText(/Test crash in component render/i)).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getAllByText(/Test crash in component render/i).length).toBeGreaterThanOrEqual(1);
  });
});
