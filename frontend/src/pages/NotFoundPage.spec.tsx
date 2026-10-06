import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFoundPage', () => {
  it('renders default 404 page with informative text and badge', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByText(/the page you are looking for doesn't exist, has been deleted, or may have moved\./i),
    ).toBeInTheDocument();
  });

  it('renders customized resource missing message when resourceType and resourceId are provided', () => {
    render(
      <MemoryRouter>
        <NotFoundPage resourceType="Project" resourceId="PHX-CORE" />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/the project "PHX-CORE" could not be found or you do not have permission to view it\./i),
    ).toBeInTheDocument();
  });

  it('navigates to dashboard when "Go to Dashboard" button is clicked', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to projects directory when "Browse Projects" is clicked', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /browse projects/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('calls navigate(-1) when "Go Back" button is clicked', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
