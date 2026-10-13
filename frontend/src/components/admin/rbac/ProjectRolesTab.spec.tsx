import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectRolesTab } from './ProjectRolesTab';
import type { ProjectRoleItem } from '../../../api/client';

vi.mock('../../../api/queries', () => ({
  useCreateProjectRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProjectRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProjectRoleMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('ProjectRolesTab Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockRoles: ProjectRoleItem[] = [
    {
      id: 1,
      name: 'Administrators',
      description: 'System administrators with full project control',
      isDefault: false,
    },
    {
      id: 2,
      name: 'Developers',
      description: 'Software engineers with write access',
      isDefault: true,
    },
    {
      id: 3,
      name: 'Project Lead',
      description: 'Principal lead for the project',
      isDefault: false,
    },
    {
      id: 4,
      name: 'External Contractor',
      description: 'Custom external vendor role',
      isDefault: false,
    },
  ];

  it('renders roles and distinguishes System Baseline from Custom Role', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectRolesTab roles={mockRoles} />
      </QueryClientProvider>,
    );

    // Baseline roles should be marked as System Baseline
    expect(screen.getByText('Administrators')).toBeInTheDocument();
    expect(screen.getByText('Developers')).toBeInTheDocument();
    expect(screen.getByText('Project Lead')).toBeInTheDocument();

    const baselineBadges = screen.getAllByText('System Baseline');
    expect(baselineBadges.length).toBe(3);

    // Custom role should be marked as Custom Role
    expect(screen.getByText('External Contractor')).toBeInTheDocument();
    expect(screen.getByText('Custom Role')).toBeInTheDocument();

    // Delete button should only exist for custom role
    const deleteButtons = screen.getAllByTitle('Delete Role');
    expect(deleteButtons.length).toBe(1);
  });
});
