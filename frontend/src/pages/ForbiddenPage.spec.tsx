import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForbiddenPage } from './ForbiddenPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ForbiddenPage', () => {
  it('renders default 403 page with security badge and informative guidance', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(
      screen.getByText(/you do not have permission to access this resource or view this page\./i),
    ).toBeInTheDocument();
  });

  it('renders custom message and required role badge when supplied', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage
          title="Admin Console Access Denied"
          message="Administrator privileges required."
          requiredRole="ADMIN"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /admin console access denied/i })).toBeInTheDocument();
    expect(screen.getByText('Administrator privileges required.')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('navigates to dashboard when "Back to Dashboard" is clicked', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to my issues when "My Issues" is clicked', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /my issues/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-issues');
  });

  it('navigates back when "Go Back" is clicked', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
