import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreferencesPage } from './PreferencesPage';

let mockServerPrefs: Record<string, unknown> | undefined = { theme: 'dark', showCollapsedLabels: false };
let mockActiveTheme = 'dark';
const mockSetTheme = vi.fn();
const mockMutate = vi.fn();

vi.mock('../store', () => ({
  useSidebar: () => ({
    showCollapsedLabels: false,
    setShowCollapsedLabels: vi.fn(),
    toggleCollapsedLabels: vi.fn(),
    collapseMode: 'rail',
    setCollapseMode: vi.fn(),
    brandStyle: 'vibrant',
    setBrandStyle: vi.fn(),
  }),
  useTheme: () => ({
    theme: mockActiveTheme,
    setTheme: mockSetTheme,
  }),
}));

vi.mock('../api/queries', () => ({
  useUserPreferencesQuery: () => ({
    data: mockServerPrefs,
    isLoading: false,
  }),
  useUpdateUserPreferencesMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe('PreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerPrefs = { theme: 'dark', showCollapsedLabels: false };
    mockActiveTheme = 'dark';
    localStorage.clear();
  });

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
    expect(screen.getByText(/Brand Logo Style/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Rail Preview/i)).toBeInTheDocument();
  });

  it('does not overwrite active local light theme when server returns dark, and syncs local theme to server', () => {
    localStorage.setItem('theme', JSON.stringify({ state: { theme: 'light' } }));
    mockActiveTheme = 'light';
    mockServerPrefs = { theme: 'dark', showCollapsedLabels: false };

    render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    // setTheme should NOT have been called with 'dark' to prevent clobbering active light theme
    expect(mockSetTheme).not.toHaveBeenCalledWith('dark');
    // Instead it should sync the user's active theme to the server
    expect(mockMutate).toHaveBeenCalledWith({ theme: 'light' });
  });

  it('adopts server theme when no local theme was stored in localStorage', () => {
    mockActiveTheme = 'dark';
    mockServerPrefs = { theme: 'light', showCollapsedLabels: false };

    render(
      <MemoryRouter>
        <PreferencesPage />
      </MemoryRouter>,
    );

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
