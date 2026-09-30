import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreferencesPage } from './PreferencesPage';

vi.mock('../store', () => ({
  useSidebar: () => ({
    showCollapsedLabels: false,
    setShowCollapsedLabels: vi.fn(),
    toggleCollapsedLabels: vi.fn(),
  }),
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

vi.mock('../api/queries', () => ({
  useUserPreferencesQuery: () => ({
    data: { theme: 'dark', showCollapsedLabels: false },
    isLoading: false,
  }),
  useUpdateUserPreferencesMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('PreferencesPage', () => {
  it('renders with full width container class and no max-w restriction', () => {
    const { container } = render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv).toBeInTheDocument();
    expect(rootDiv.className).toContain('w-full');
    expect(rootDiv.className).not.toContain('max-w-5xl');
  });

  it('renders preferences header, settings cards, and live rail preview', () => {
    render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /^Preferences$/i })).toBeInTheDocument();
    expect(screen.getByText(/Collapsed Sidebar Text Labels/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Rail Preview/i)).toBeInTheDocument();
  });
});
