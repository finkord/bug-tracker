import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { UserPicker } from './UserPicker';
import { EmptyState } from './EmptyState';
import { Inbox } from 'lucide-react';

describe('StatusBadge', () => {
  it('renders correct labels for each status', () => {
    const { rerender } = render(<StatusBadge status="OPEN" />);
    expect(screen.getByText('Open')).toBeInTheDocument();

    rerender(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<StatusBadge status="REVIEW" />);
    expect(screen.getByText('In Review')).toBeInTheDocument();

    rerender(<StatusBadge status="RESOLVED" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();

    rerender(<StatusBadge status="CLOSED" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders interactive button when interactive is true with onStatusChange', () => {
    const onChange = vi.fn();
    render(<StatusBadge status="OPEN" interactive onStatusChange={onChange} />);
    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it('renders correct labels for each priority', () => {
    const { rerender } = render(<PriorityBadge priority="CRITICAL" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();

    rerender(<PriorityBadge priority="HIGH" />);
    expect(screen.getByText('High')).toBeInTheDocument();

    rerender(<PriorityBadge priority="MEDIUM" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<PriorityBadge priority="LOW" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders interactive trigger when interactive is true', () => {
    const onChange = vi.fn();
    render(<PriorityBadge priority="HIGH" interactive onPriorityChange={onChange} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});

describe('UserPicker', () => {
  const mockUsers = [
    { id: 1, fullName: 'Alice Smith', email: 'alice@example.com' },
    { id: 2, fullName: 'Bob Jones', email: 'bob@example.com' },
  ];

  it('renders placeholder when value is null', () => {
    const onChange = vi.fn();
    render(
      <UserPicker
        value={null}
        onChange={onChange}
        users={mockUsers}
        placeholder="Assign user..."
      />,
    );
    expect(screen.getByText('Assign user...')).toBeInTheDocument();
  });

  it('renders selected user name when value matches a user', () => {
    const onChange = vi.fn();
    render(
      <UserPicker
        value={1}
        onChange={onChange}
        users={mockUsers}
      />,
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders title, description, and triggers action onClick', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={<Inbox data-testid="inbox-icon" />}
        title="No items found"
        description="Try adjusting your search criteria"
        action={{
          label: 'Create item',
          onClick: onAction,
        }}
      />,
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
    expect(screen.getByTestId('inbox-icon')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /create item/i });
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
