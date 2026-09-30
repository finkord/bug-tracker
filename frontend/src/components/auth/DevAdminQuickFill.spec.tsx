import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevAdminQuickFill } from './DevAdminQuickFill';

describe('DevAdminQuickFill', () => {
  it('renders the dev admin auto-fill action card with Quick Fill label and helper text', () => {
    const handleFill = vi.fn();
    render(<DevAdminQuickFill onFill={handleFill} />);

    expect(screen.getByText('Quick Fill')).toBeInTheDocument();
    expect(screen.getByText(/auto-fill demo administrator credentials/i)).toBeInTheDocument();
    expect(screen.queryByText(/dev only/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auto-fill administrator credentials/i })).toBeInTheDocument();
  });

  it('triggers onFill with email and password when auto-fill button is clicked', () => {
    const handleFill = vi.fn();
    render(<DevAdminQuickFill onFill={handleFill} />);

    const button = screen.getByRole('button', { name: /auto-fill administrator credentials/i });
    fireEvent.click(button);

    expect(handleFill).toHaveBeenCalledTimes(1);
    expect(handleFill).toHaveBeenCalledWith(
      expect.stringContaining('@'),
      expect.any(String)
    );
    expect(screen.getByText('Filled')).toBeInTheDocument();
  });

  it('disables the auto-fill button when disabled prop is true', () => {
    const handleFill = vi.fn();
    render(<DevAdminQuickFill onFill={handleFill} disabled={true} />);

    const button = screen.getByRole('button', { name: /auto-fill administrator credentials/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleFill).not.toHaveBeenCalled();
  });
});
