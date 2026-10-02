import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuickSearchModal } from './QuickSearchModal';

const mockUseIssuesQuery = vi.fn();

vi.mock('../../api/queries', () => ({
  useIssuesQuery: (filters?: Record<string, unknown>) => mockUseIssuesQuery(filters),
  useProjectsQuery: () => ({ data: [] }),
}));

describe('QuickSearchModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIssuesQuery.mockReturnValue({
      data: {
        items: [
          {
            id: 101,
            key: 'PHX-101',
            title: 'Fix crash in auth pipeline',
            priority: 'HIGH',
            status: 'OPEN',
          },
          {
            id: 102,
            key: 'PHX-102',
            title: 'Refactor database connection pool',
            priority: 'MEDIUM',
            status: 'IN_PROGRESS',
          },
        ],
        total: 2,
      },
      isLoading: false,
    });
  });

  it('renders input and initial prompt when opened', () => {
    render(
      <MemoryRouter>
        <QuickSearchModal isOpen={true} onClose={vi.fn()} onSelectIssue={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText(/search issues by key/i)).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create new issue')).toBeInTheDocument();
  });

  it('renders matching issue results when user types a query', async () => {
    render(
      <MemoryRouter>
        <QuickSearchModal isOpen={true} onClose={vi.fn()} onSelectIssue={vi.fn()} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/search issues by key/i);
    fireEvent.change(input, { target: { value: 'crash' } });

    await waitFor(() => {
      expect(screen.getByText('PHX-101')).toBeInTheDocument();
      expect(screen.getByText('Fix crash in auth pipeline')).toBeInTheDocument();
    });
  });

  it('calls onSelectIssue when a result item is clicked', async () => {
    const handleSelectIssue = vi.fn();

    render(
      <MemoryRouter>
        <QuickSearchModal isOpen={true} onClose={vi.fn()} onSelectIssue={handleSelectIssue} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/search issues by key/i);
    fireEvent.change(input, { target: { value: 'database' } });

    await waitFor(() => {
      expect(screen.getByText('PHX-102')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('PHX-102'));
    expect(handleSelectIssue).toHaveBeenCalledWith(102);
  });
});
