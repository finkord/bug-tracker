import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from './BackButton.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BackButton component', () => {
  it('renders default label "Back"', () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(
      <MemoryRouter>
        <BackButton label="Back to Projects" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /back to projects/i })).toBeInTheDocument();
  });

  it('triggers custom onClick if provided', () => {
    const handleClick = vi.fn();
    render(
      <MemoryRouter>
        <BackButton onClick={handleClick} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to fallbackPath when history is at start', () => {
    mockNavigate.mockClear();
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    render(
      <MemoryRouter>
        <BackButton fallbackPath="/projects" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('navigates -1 on click when history is available', () => {
    mockNavigate.mockClear();
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(3);
    render(
      <MemoryRouter>
        <BackButton fallbackPath="/projects" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
