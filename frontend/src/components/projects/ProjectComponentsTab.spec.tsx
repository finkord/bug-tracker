import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectComponentsTab } from './ProjectComponentsTab';
import * as queries from '../../api/queries';

vi.mock('../../api/queries', () => ({
  useProjectComponentsQuery: vi.fn(),
  useCreateProjectComponentMutation: vi.fn(),
  useUpdateProjectComponentMutation: vi.fn(),
  useDeleteProjectComponentMutation: vi.fn(),
  useUserDetailQuery: vi.fn(() => ({ data: null })),
}));

describe('ProjectComponentsTab', () => {
  const mockMutateAsyncCreate = vi.fn();
  const mockMutateAsyncUpdate = vi.fn();
  const mockMutateAsyncDelete = vi.fn();

  const mockUsers = [
    { id: 1, fullName: 'Alice Developer', email: 'alice@test.local', role: 'DEVELOPER' },
    { id: 2, fullName: 'Bob Architect', email: 'bob@test.local', role: 'ADMIN' },
  ];

  const mockComponents = [
    {
      id: 101,
      projectId: 1,
      name: 'Auth Subsystem',
      description: 'Handles JWT and OAuth logic',
      leadId: 1,
      lead: { id: 1, fullName: 'Alice Developer', email: 'alice@test.local' },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(queries.useCreateProjectComponentMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncCreate,
    } as any);

    vi.mocked(queries.useUpdateProjectComponentMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncUpdate,
    } as any);

    vi.mocked(queries.useDeleteProjectComponentMutation).mockReturnValue({
      mutateAsync: mockMutateAsyncDelete,
      isPending: false,
    } as any);
  });

  it('renders components table and left-aligned actions', () => {
    vi.mocked(queries.useProjectComponentsQuery).mockReturnValue({
      data: mockComponents,
      isLoading: false,
    } as any);

    render(<ProjectComponentsTab projectId={1} allUsers={mockUsers as any} />);

    expect(screen.getByText('Auth Subsystem')).toBeInTheDocument();
    expect(screen.getByText('Handles JWT and OAuth logic')).toBeInTheDocument();
    expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    expect(screen.getByTitle('Edit component')).toBeInTheDocument();
    expect(screen.getByTitle('Delete component')).toBeInTheDocument();
  });

  it('opens edit modal pre-populated with component details when clicking edit button', async () => {
    vi.mocked(queries.useProjectComponentsQuery).mockReturnValue({
      data: mockComponents,
      isLoading: false,
    } as any);

    render(<ProjectComponentsTab projectId={1} allUsers={mockUsers as any} />);

    const editBtn = screen.getByTitle('Edit component');
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Project Component')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('e.g. Authentication, Billing, Search Engine') as HTMLInputElement;
    expect(nameInput.value).toBe('Auth Subsystem');

    // Update name and submit
    fireEvent.change(nameInput, { target: { value: 'Auth & Security Subsystem' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockMutateAsyncUpdate).toHaveBeenCalledWith({
        projectId: 1,
        componentId: 101,
        payload: {
          name: 'Auth & Security Subsystem',
          description: 'Handles JWT and OAuth logic',
          leadId: 1,
        },
      });
    });
  });

  it('opens create modal with clean fields when clicking Add Component', async () => {
    vi.mocked(queries.useProjectComponentsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    render(<ProjectComponentsTab projectId={1} allUsers={mockUsers as any} />);

    fireEvent.click(screen.getByText('Add Component'));

    expect(screen.getByText('Add Project Component')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('e.g. Authentication, Billing, Search Engine') as HTMLInputElement;
    expect(nameInput.value).toBe('');

    fireEvent.change(nameInput, { target: { value: 'New Subsystem' } });
    fireEvent.click(screen.getByText('Create Component'));

    await waitFor(() => {
      expect(mockMutateAsyncCreate).toHaveBeenCalledWith({
        projectId: 1,
        payload: {
          name: 'New Subsystem',
          description: undefined,
          leadId: undefined,
        },
      });
    });
  });
});
