import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SprintFormModal } from './SprintFormModal';

vi.mock('../../api/queries/useTeamsQuery.js', () => ({
  useTeamsQuery: vi.fn(() => ({
    data: [
      { id: 10, name: 'Frontend Guild', sprintCapacityHours: 120 },
      { id: 20, name: 'Core Engine Team', sprintCapacityHours: 160 },
    ],
    isLoading: false,
  })),
}));

describe('SprintFormModal Component', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default values in create mode', () => {
    render(
      <SprintFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        defaultSprintNumber={3}
      />,
    );

    expect(screen.getByText('Create New Sprint')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sprint 3')).toBeInTheDocument();
    expect(screen.getByLabelText(/Sprint Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sprint Goal/i)).toBeInTheDocument();
  });

  it('validates required name field before submitting', () => {
    render(
      <SprintFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
      />,
    );

    const nameInput = screen.getByLabelText(/Sprint Name/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Create Sprint/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Sprint name is required.')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates that end date must be after start date', () => {
    render(
      <SprintFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
      />,
    );

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);

    fireEvent.change(startDateInput, { target: { value: '2026-10-15' } });
    fireEvent.change(endDateInput, { target: { value: '2026-10-10' } });

    const submitBtn = screen.getByRole('button', { name: /Create Sprint/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Sprint end date must be after start date.')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('submits valid sprint data and calls onClose', () => {
    render(
      <SprintFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        defaultSprintNumber={5}
      />,
    );

    const goalInput = screen.getByLabelText(/Sprint Goal/i);
    fireEvent.change(goalInput, { target: { value: 'Ship modern Agile Scrum engine' } });

    const submitBtn = screen.getByRole('button', { name: /Create Sprint/i });
    fireEvent.click(submitBtn);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sprint 5',
        goal: 'Ship modern Agile Scrum engine',
        status: 'PLANNED',
      }),
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
