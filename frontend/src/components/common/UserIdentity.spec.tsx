import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserIdentity } from './UserIdentity';

vi.mock('../../api/queries', () => ({
  useUserDetailQuery: vi.fn().mockReturnValue({ data: null }),
}));

describe('UserIdentity', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders avatar without name by default', () => {
    renderWithProviders(
      <UserIdentity
        userId={1}
        name="Alice Smith"
        email="alice@example.com"
      />,
    );

    expect(screen.getByText('AS')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('renders name and email when requested', () => {
    renderWithProviders(
      <UserIdentity
        userId={2}
        name="Bob Jones"
        email="bob@example.com"
        showName
        showEmail
      />,
    );

    expect(screen.getByText('BJ')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders unclickable content when clickable is false or no userId provided', () => {
    renderWithProviders(
      <UserIdentity
        name="Unassigned User"
        showName
        clickable={false}
      />,
    );

    expect(screen.getByText('Unassigned User')).toBeInTheDocument();
  });
});
