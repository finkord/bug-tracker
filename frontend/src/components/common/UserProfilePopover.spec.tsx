import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserProfilePopover } from './UserProfilePopover';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/queries/index.js', () => ({
  useUserDetailQuery: vi.fn().mockReturnValue({
    data: {
      id: 42,
      fullName: 'Alex Vance',
      email: 'alex@example.com',
      systemRole: 'ADMIN',
      jobTitle: 'Lead Engineer',
      createdAt: '2024-01-15T00:00:00Z',
    },
    isLoading: false,
  }),
}));

describe('UserProfilePopover Component', () => {
  const sampleUser = {
    id: 42,
    fullName: 'Alex Vance',
    email: 'alex@example.com',
    systemRole: 'ADMIN',
    jobTitle: 'Lead Engineer',
  };

  it('renders trigger element and opens popover on click', async () => {
    render(
      <MemoryRouter>
        <UserProfilePopover user={sampleUser}>
          <span data-testid="trigger-user">Alex Vance</span>
        </UserProfilePopover>
      </MemoryRouter>,
    );

    const trigger = screen.getByTestId('trigger-user');
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(await screen.findByText('Lead Engineer')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('navigates to user issues when clicking Issues button', async () => {
    mockNavigate.mockClear();
    render(
      <MemoryRouter>
        <UserProfilePopover user={sampleUser}>
          <span data-testid="trigger-user">Alex Vance</span>
        </UserProfilePopover>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('trigger-user'));

    const issuesButton = await screen.findByRole('button', { name: /Issues/i });
    fireEvent.click(issuesButton);

    expect(mockNavigate).toHaveBeenCalledWith('/search?assigneeId=42');
  });

  it('navigates to public profile when clicking View Profile button', async () => {
    mockNavigate.mockClear();
    render(
      <MemoryRouter>
        <UserProfilePopover user={sampleUser}>
          <span data-testid="trigger-user">Alex Vance</span>
        </UserProfilePopover>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('trigger-user'));

    const profileButton = await screen.findByRole('button', { name: /View Profile/i });
    fireEvent.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith('/users/42');
  });
});
