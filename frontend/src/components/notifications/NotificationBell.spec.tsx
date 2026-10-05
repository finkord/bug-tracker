import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { notificationsApi } from '../../api/modules/notifications.api.js';

vi.mock('../../api/modules/notifications.api.js', () => ({
  notificationsApi: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    snoozeNotification: vi.fn(),
  },
}));

vi.mock('../../api/socket.js', () => ({
  realtimeSocket: {
    onNotificationNew: vi.fn(() => () => {}),
  },
}));

describe('NotificationBell Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unreadCount: 3 });
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: [
        {
          id: 1,
          userId: 1,
          actorId: 2,
          actor: { id: 2, fullName: 'Alice Lead', email: 'alice@test.local', avatarUrl: null },
          issueId: 10,
          type: 'ASSIGNED',
          title: 'Assigned: PROJ-10',
          message: 'Alice assigned Defect to you',
          isRead: false,
          snoozedUntil: null,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 40,
      totalPages: 1,
    });
    vi.mocked(notificationsApi.markAsRead).mockResolvedValue({ success: true, affected: 1 });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('renders bell button with unread count badge', async () => {
    renderComponent();

    const badge = await screen.findByText('3');
    expect(badge).toBeInTheDocument();
  });

  it('opens inbox drawer on click and displays notification items', async () => {
    renderComponent();

    const bellBtn = screen.getByLabelText('Notifications Inbox');
    fireEvent.click(bellBtn);

    expect(await screen.findByText('Inbox')).toBeInTheDocument();
    expect(await screen.findByText('Assigned: PROJ-10')).toBeInTheDocument();
    expect(screen.getByText('Alice assigned Defect to you')).toBeInTheDocument();
  });

  it('allows clicking mark as read button', async () => {
    renderComponent();

    const bellBtn = screen.getByLabelText('Notifications Inbox');
    fireEvent.click(bellBtn);

    const markReadBtn = await screen.findByTitle('Mark as read (E)');
    fireEvent.click(markReadBtn);

    await vi.waitFor(() => {
      expect(notificationsApi.markAsRead).toHaveBeenCalledWith([1]);
    });
  });

  it('toggles sound alerts and persists preference in localStorage', async () => {
    renderComponent();

    const bellBtn = screen.getByLabelText('Notifications Inbox');
    fireEvent.click(bellBtn);

    const soundBtn = await screen.findByLabelText('Mute sound alerts');
    fireEvent.click(soundBtn);

    expect(localStorage.getItem('bugtracker_sound_alerts_enabled')).toBe('false');
    expect(await screen.findByLabelText('Enable sound alerts')).toBeInTheDocument();

    const enableSoundBtn = screen.getByLabelText('Enable sound alerts');
    fireEvent.click(enableSoundBtn);

    expect(localStorage.getItem('bugtracker_sound_alerts_enabled')).toBe('true');
  });
});
