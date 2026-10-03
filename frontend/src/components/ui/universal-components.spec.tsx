import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { UserPicker } from './UserPicker';
import { EmptyState } from './EmptyState';
import { ConfirmDialog } from './ConfirmDialog';
import { SearchInput } from './SearchInput';
import { Inbox } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

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
    renderWithProviders(
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
    renderWithProviders(
      <UserPicker
        value={1}
        onChange={onChange}
        users={mockUsers}
      />,
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('renders Assign to me option and selects currentUser when clicked', () => {
    const onChange = vi.fn();
    const currentUser = { id: 2, fullName: 'Bob Jones', email: 'bob@example.com' };
    renderWithProviders(
      <UserPicker
        value={1}
        onChange={onChange}
        users={mockUsers}
        currentUser={currentUser}
        showAssignToMe
      />,
    );

    const trigger = screen.getByText('Alice Smith');
    fireEvent.click(trigger);

    const assignToMeBtn = screen.getByText('Assign to me');
    expect(assignToMeBtn).toBeInTheDocument();

    fireEvent.click(assignToMeBtn);
    expect(onChange).toHaveBeenCalledWith(2, currentUser);
  });

  it('renders current user with (You) badge in dropdown even if not initially in users list', () => {
    const onChange = vi.fn();
    const currentUser = { id: 99, fullName: 'Super Dev', email: 'super@example.com' };
    renderWithProviders(
      <UserPicker
        value={null}
        onChange={onChange}
        users={mockUsers}
        currentUser={currentUser}
        placeholder="Unassigned"
      />,
    );

    const trigger = screen.getByText('Unassigned');
    fireEvent.click(trigger);

    expect(screen.getByText('(You)')).toBeInTheDocument();
    expect(screen.getByText('Super Dev')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Super Dev'));
    expect(onChange).toHaveBeenCalledWith(99, currentUser);
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

describe('ConfirmDialog', () => {
  it('renders title, description, and triggers onConfirm when confirmed', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Item"
        description="Are you sure you want to delete this item?"
        confirmLabel="Yes, Delete"
        cancelLabel="No, Cancel"
        variant="danger"
      />,
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /yes, delete/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /no, cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render content when isOpen is false', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        isOpen={false}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Hidden Dialog"
        description="This should not appear"
      />,
    );

    expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument();
  });
});

describe('SearchInput', () => {
  it('renders input with value and calls onChange when typing', () => {
    const onChange = vi.fn();
    render(
      <SearchInput
        value=""
        onChange={onChange}
        placeholder="Search tickets..."
      />,
    );

    const input = screen.getByPlaceholderText('Search tickets...');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'BUG-123' } });
    expect(onChange).toHaveBeenCalledWith('BUG-123');
  });

  it('renders clear button when value is present and clears on click', () => {
    const onChange = vi.fn();
    render(
      <SearchInput
        value="Search term"
        onChange={onChange}
        placeholder="Search..."
      />,
    );

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });
});

