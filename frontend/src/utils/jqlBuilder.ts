export interface JqlBuilderOptions {
  query?: string;
  projectKey?: string;
  statuses?: string[];
  priorities?: string[];
  issueTypes?: string[];
  assignee?: string;
  sprint?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

/**
 * Builds a JQL query string from UI filter selections.
 */
export function buildJqlFromFilters(options: JqlBuilderOptions): string {
  const clauses: string[] = [];

  if (options.projectKey && options.projectKey !== 'ALL') {
    clauses.push(`project = "${options.projectKey}"`);
  }

  if (options.statuses && options.statuses.length > 0) {
    const list = options.statuses.map((s) => `"${s}"`).join(', ');
    clauses.push(`status IN (${list})`);
  }

  if (options.priorities && options.priorities.length > 0) {
    const list = options.priorities.map((p) => `"${p}"`).join(', ');
    clauses.push(`priority IN (${list})`);
  }

  if (options.issueTypes && options.issueTypes.length > 0) {
    const list = options.issueTypes.map((t) => `"${t}"`).join(', ');
    clauses.push(`issueType IN (${list})`);
  }

  if (options.assignee && options.assignee !== 'ALL') {
    const rawAssignee = options.assignee.trim();
    const lower = rawAssignee.toLowerCase();
    if (lower === 'currentuser()' || lower === 'me') {
      clauses.push('assignee = currentUser()');
    } else if (lower === 'unassigned' || lower === 'empty') {
      clauses.push('assignee is EMPTY');
    } else {
      clauses.push(`assignee = "${rawAssignee}"`);
    }
  }

  if (options.sprint && options.sprint !== 'ALL') {
    const rawSprint = options.sprint.trim();
    const lower = rawSprint.toLowerCase();
    if (lower === 'empty' || lower === 'backlog' || lower === 'none') {
      clauses.push('sprint is EMPTY');
    } else if (lower === 'active' || lower === 'opensprints()') {
      clauses.push('sprint = active');
    } else {
      clauses.push(`sprint = "${rawSprint}"`);
    }
  }

  if (options.query && options.query.trim()) {
    clauses.push(`text ~ "${options.query.trim()}"`);
  }

  let result = clauses.join(' AND ');

  if (options.sortBy) {
    const dir = (options.sortOrder || 'DESC').toUpperCase();
    result = result ? `${result} ORDER BY ${options.sortBy} ${dir}` : `ORDER BY ${options.sortBy} ${dir}`;
  }

  return result;
}
