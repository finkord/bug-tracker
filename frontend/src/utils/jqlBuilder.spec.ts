import { describe, it, expect } from 'vitest';
import { buildJqlFromFilters } from './jqlBuilder';

describe('buildJqlFromFilters', () => {
  it('builds empty JQL when all options are default or empty', () => {
    const result = buildJqlFromFilters({});
    expect(result).toBe('');
  });

  it('maps project key to equality clause', () => {
    const result = buildJqlFromFilters({ projectKey: 'CORE' });
    expect(result).toBe('project = "CORE"');
  });

  it('ignores ALL projectKey', () => {
    const result = buildJqlFromFilters({ projectKey: 'ALL' });
    expect(result).toBe('');
  });

  it('maps statuses, priorities, and types to IN clauses', () => {
    const result = buildJqlFromFilters({
      statuses: ['OPEN', 'IN_PROGRESS'],
      priorities: ['HIGH', 'CRITICAL'],
      issueTypes: ['BUG'],
    });
    expect(result).toBe(
      'status IN ("OPEN", "IN_PROGRESS") AND priority IN ("HIGH", "CRITICAL") AND issueType IN ("BUG")',
    );
  });

  it('maps ME and currentUser() assignee correctly', () => {
    expect(buildJqlFromFilters({ assignee: 'ME' })).toBe('assignee = currentUser()');
    expect(buildJqlFromFilters({ assignee: 'currentUser()' })).toBe('assignee = currentUser()');
  });

  it('maps UNASSIGNED to is EMPTY', () => {
    expect(buildJqlFromFilters({ assignee: 'UNASSIGNED' })).toBe('assignee is EMPTY');
    expect(buildJqlFromFilters({ assignee: 'unassigned' })).toBe('assignee is EMPTY');
  });

  it('maps user ID assignee to string equality', () => {
    expect(buildJqlFromFilters({ assignee: '42' })).toBe('assignee = "42"');
  });

  it('maps BACKLOG to sprint is EMPTY', () => {
    expect(buildJqlFromFilters({ sprint: 'BACKLOG' })).toBe('sprint is EMPTY');
    expect(buildJqlFromFilters({ sprint: 'backlog' })).toBe('sprint is EMPTY');
  });

  it('maps ACTIVE sprint to sprint = active', () => {
    expect(buildJqlFromFilters({ sprint: 'ACTIVE' })).toBe('sprint = active');
    expect(buildJqlFromFilters({ sprint: 'active' })).toBe('sprint = active');
  });

  it('maps text query to ~ operator', () => {
    const result = buildJqlFromFilters({ query: 'login memory leak' });
    expect(result).toBe('text ~ "login memory leak"');
  });

  it('appends ORDER BY when sortBy is specified', () => {
    const result = buildJqlFromFilters({
      projectKey: 'PROJ',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    expect(result).toBe('project = "PROJ" ORDER BY updatedAt DESC');
  });
});
