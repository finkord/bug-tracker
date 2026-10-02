import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectWebhooksTab } from './ProjectWebhooksTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', () => ({
  useProjectWebhooksQuery: vi.fn(),
  useCreateWebhookMutation: vi.fn(),
  useUpdateWebhookMutation: vi.fn(),
  useDeleteWebhookMutation: vi.fn(),
  useTestWebhookMutation: vi.fn(),
}));

describe('ProjectWebhooksTab', () => {
  const mockMutateAsyncCreate = vi.fn();
  const mockMutateAsyncUpdate = vi.fn();
  const mockMutateAsyncDelete = vi.fn();
  const mockMutateAsyncTest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(queries.useCreateWebhookMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncCreate,
    } as any);

    vi.mocked(queries.useUpdateWebhookMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncUpdate,
    } as any);

    vi.mocked(queries.useDeleteWebhookMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncDelete,
    } as any);

    vi.mocked(queries.useTestWebhookMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncTest,
    } as any);
  });

  it('renders empty state when no webhooks exist', () => {
    vi.mocked(queries.useProjectWebhooksQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectWebhooksTab projectId={1} />);

    expect(screen.getByText('No Outbound Webhooks Registered')).toBeInTheDocument();
    expect(screen.getByText('Register First Webhook')).toBeInTheDocument();
  });

  it('renders webhooks list with event badges and active status', () => {
    vi.mocked(queries.useProjectWebhooksQuery).mockReturnValue({
      data: [
        {
          id: 10,
          projectId: 1,
          name: 'Slack Alerts',
          url: 'https://hooks.slack.com/services/test',
          maskedSecret: 'whsec_••••••••',
          events: ['issue.created', 'status.changed'],
          isActive: true,
          failureCount: 0,
          lastFailureReason: null,
          lastTriggeredAt: '2026-10-02T10:00:00Z',
          createdAt: '2026-10-02T09:00:00Z',
          updatedAt: '2026-10-02T09:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectWebhooksTab projectId={1} />);

    expect(screen.getByText('Slack Alerts')).toBeInTheDocument();
    expect(screen.getByText('https://hooks.slack.com/services/test')).toBeInTheDocument();
    expect(screen.getByText('issue.created')).toBeInTheDocument();
    expect(screen.getByText('status.changed')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test Ping/i })).toBeInTheDocument();
  });

  it('opens registration modal when clicking New Webhook button', () => {
    vi.mocked(queries.useProjectWebhooksQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectWebhooksTab projectId={1} />);

    fireEvent.click(screen.getByRole('button', { name: /New Webhook/i }));

    expect(screen.getByText('Register Outbound Webhook')).toBeInTheDocument();
    expect(screen.getByLabelText(/Webhook Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Endpoint URL/i)).toBeInTheDocument();
    expect(screen.getByText(/All Events \(Wildcard\)/i)).toBeInTheDocument();
  });

  it('triggers test ping and renders response details', async () => {
    vi.mocked(queries.useProjectWebhooksQuery).mockReturnValue({
      data: [
        {
          id: 10,
          projectId: 1,
          name: 'Slack Alerts',
          url: 'https://hooks.slack.com/services/test',
          events: ['*'],
          isActive: true,
          failureCount: 0,
          lastFailureReason: null,
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    mockMutateAsyncTest.mockResolvedValue({
      success: true,
      statusCode: 200,
      responseTimeMs: 88,
      message: 'Endpoint responded successfully with HTTP 200',
    });

    render(<ProjectWebhooksTab projectId={1} />);

    fireEvent.click(screen.getByRole('button', { name: /Test Ping/i }));

    await waitFor(() => {
      expect(mockMutateAsyncTest).toHaveBeenCalledWith(10);
      expect(screen.getByText(/Test Ping Succeeded/i)).toBeInTheDocument();
      expect(screen.getByText('88ms')).toBeInTheDocument();
    });
  });

  it('deletes webhook after confirmation button is clicked', async () => {
    vi.mocked(queries.useProjectWebhooksQuery).mockReturnValue({
      data: [
        {
          id: 10,
          projectId: 1,
          name: 'Slack Alerts',
          url: 'https://hooks.slack.com/services/test',
          events: ['*'],
          isActive: true,
          failureCount: 0,
          lastFailureReason: null,
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    mockMutateAsyncDelete.mockResolvedValue({ success: true });

    render(<ProjectWebhooksTab projectId={1} />);

    // Click trash button to show confirm
    const deleteBtn = screen.getByRole('button', { name: /Delete webhook/i });
    fireEvent.click(deleteBtn);

    // Now 'Confirm' should appear
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockMutateAsyncDelete).toHaveBeenCalledWith(10);
    });
  });
});
