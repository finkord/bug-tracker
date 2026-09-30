import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminSecurityLogsTab } from './AdminSecurityLogsTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', () => ({
  useLoginAuditLogsQuery: vi.fn(),
}));

describe('AdminSecurityLogsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when query is loading', () => {
    vi.mocked(queries.useLoginAuditLogsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLoginAuditLogsQuery>);

    render(<AdminSecurityLogsTab />);

    expect(screen.getByText(/Loading forensic login logs/i)).toBeInTheDocument();
  });

  it('renders empty state when no audit records are found', () => {
    vi.mocked(queries.useLoginAuditLogsQuery).mockReturnValue({
      data: { items: [], total: 0, page: 1, limit: 25 },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLoginAuditLogsQuery>);

    render(<AdminSecurityLogsTab />);

    expect(screen.getByText(/No login events match the selected criteria/i)).toBeInTheDocument();
  });

  it('renders audit log entries with status badges, emails, and IP addresses', () => {
    vi.mocked(queries.useLoginAuditLogsQuery).mockReturnValue({
      data: {
        items: [
          {
            id: 'log-1',
            attemptedEmail: 'admin@bugtracker.local',
            ipAddress: '127.0.0.1',
            status: 'SUCCESS',
            failureReason: null,
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
            createdAt: '2026-09-30T07:00:00Z',
          },
          {
            id: 'log-2',
            attemptedEmail: 'intruder@bad.com',
            ipAddress: '192.168.1.50',
            status: 'FAILED_PASSWORD',
            failureReason: 'Invalid credentials',
            userAgent: 'curl/7.68.0',
            createdAt: '2026-09-30T07:05:00Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 25,
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLoginAuditLogsQuery>);

    render(<AdminSecurityLogsTab />);

    expect(screen.getByText('admin@bugtracker.local')).toBeInTheDocument();
    expect(screen.getByText('intruder@bad.com')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.50')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('FAILED_PASSWORD')).toBeInTheDocument();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('filters rows based on user input in search field', () => {
    vi.mocked(queries.useLoginAuditLogsQuery).mockReturnValue({
      data: {
        items: [
          {
            id: 'log-1',
            attemptedEmail: 'alice@company.com',
            ipAddress: '10.0.0.1',
            status: 'SUCCESS',
            failureReason: null,
            userAgent: 'Firefox',
            createdAt: '2026-09-30T07:00:00Z',
          },
          {
            id: 'log-2',
            attemptedEmail: 'bob@company.com',
            ipAddress: '10.0.0.2',
            status: 'ACCOUNT_LOCKED',
            failureReason: 'Account locked due to failed attempts',
            userAgent: 'Chrome',
            createdAt: '2026-09-30T07:05:00Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 25,
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof queries.useLoginAuditLogsQuery>);

    render(<AdminSecurityLogsTab />);

    const searchInput = screen.getByPlaceholderText(/Search by email, IP address, or reason/i);
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('alice@company.com')).toBeInTheDocument();
    expect(screen.queryByText('bob@company.com')).not.toBeInTheDocument();
  });
});
