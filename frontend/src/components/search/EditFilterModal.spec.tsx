import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditFilterModal } from './EditFilterModal';

describe('EditFilterModal', () => {
  const sampleFilter = {
    id: '12',
    name: 'Frontend In-Progress',
    description: 'All frontend bugs currently in progress',
    jql: 'project = FE AND status = IN_PROGRESS',
    isFavorite: true,
    createdAt: '2026-10-01T10:00:00Z',
  };

  it('renders with existing filter values populated', () => {
    render(
      <EditFilterModal
        isOpen={true}
        onClose={vi.fn()}
        filter={sampleFilter}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Frontend In-Progress')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All frontend bugs currently in progress')).toBeInTheDocument();
    expect(screen.getByDisplayValue('project = FE AND status = IN_PROGRESS')).toBeInTheDocument();
  });

  it('submits updated values when form is saved', () => {
    const onSave = vi.fn();
    render(
      <EditFilterModal
        isOpen={true}
        onClose={vi.fn()}
        filter={sampleFilter}
        onSave={onSave}
      />,
    );

    const nameInput = screen.getByDisplayValue('Frontend In-Progress');
    fireEvent.change(nameInput, { target: { value: 'Frontend Blockers' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({
      id: '12',
      name: 'Frontend Blockers',
      description: 'All frontend bugs currently in progress',
      jql: 'project = FE AND status = IN_PROGRESS',
      isFavorite: true,
    });
  });
});
