import { describe, it, expect } from 'vitest';
import { CreateProjectSchema, ProjectSchema } from './project.schema';

describe('ProjectSchema', () => {
  it('should validate a complete valid project item', () => {
    const validProject = {
      id: 1,
      name: 'Bug Tracker Core',
      key: 'BTC',
      description: 'Core repository',
      leadId: 10,
      lead: {
        id: 10,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        avatarUrl: null,
      },
      totalIssues: 15,
      openIssues: 3,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-28T00:00:00Z',
    };

    const result = ProjectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('should reject invalid project key in CreateProjectSchema', () => {
    const invalidPayload = {
      name: 'Test Project',
      key: 'invalid-key-lowercase',
    };

    const result = CreateProjectSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should accept valid uppercase alphanumeric key in CreateProjectSchema', () => {
    const validPayload = {
      name: 'Mobile App',
      key: 'MBL2',
      description: 'Native mobile client',
    };

    const result = CreateProjectSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
