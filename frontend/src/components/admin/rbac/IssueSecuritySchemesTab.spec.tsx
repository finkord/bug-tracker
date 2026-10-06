import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IssueSecuritySchemesTab } from './IssueSecuritySchemesTab';
import type { IssueSecuritySchemeItem } from '../../../api/client';

vi.mock('../../../api/queries', () => ({
  useCreateSecuritySchemeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSecuritySchemeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSecurityLevelMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSecurityLevelMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetDefaultSecurityLevelMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSecurityGrantMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSecurityGrantMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProjectRolesQuery: () => ({ data: [{ id: 1, name: 'Administrators' }] }),
  useGroupsQuery: () => ({ data: [{ id: 1, name: 'SecOps' }] }),
}));

describe('IssueSecuritySchemesTab Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockSchemes: IssueSecuritySchemeItem[] = [
    {
      id: 1,
      name: 'Default Issue Security Scheme',
      description: 'Baseline security classification controlling issue visibility tiers',
      isDefault: true,
      defaultLevelId: 10,
      levels: [
        {
          id: 10,
          schemeId: 1,
          name: 'Confidential',
          description: 'Restricted issue visible only to Project Leads and System Administrators',
          isDefault: true,
          grants: [
            {
              id: 101,
              levelId: 10,
              grantType: 'ROLE',
              roleId: 1,
              role: { id: 1, name: 'Administrators' },
            },
          ],
        },
        {
          id: 20,
          schemeId: 1,
          name: 'Public',
          description: 'Standard issue visible to all project members and stakeholders',
          isDefault: false,
          grants: [],
        },
      ],
    },
  ];

  it('renders security schemes with compact unified table for levels', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <IssueSecuritySchemesTab securitySchemes={mockSchemes} />
      </QueryClientProvider>,
    );

    // Scheme Title and Badge
    expect(screen.getByText('Default Issue Security Scheme')).toBeInTheDocument();
    expect(screen.getByText('DEFAULT SCHEME')).toBeInTheDocument();

    // Table Column Headers
    expect(screen.getByText('Security Level')).toBeInTheDocument();
    expect(screen.getByText('Users / Groups / Project Roles')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Level names
    expect(screen.getByText('Confidential')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();

    // Default Level indicator
    expect(screen.getByText('DEFAULT LEVEL')).toBeInTheDocument();

    // Authorized actor
    expect(screen.getByText('Role: Administrators')).toBeInTheDocument();

    // Make Default button for non-default level
    expect(screen.getByText('Make Default')).toBeInTheDocument();
  });
});
