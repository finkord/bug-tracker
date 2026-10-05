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
    if (options.assignee === 'currentUser()') {
      clauses.push('assignee = currentUser()');
    } else if (options.assignee === 'unassigned') {
      clauses.push('assignee = "unassigned"');
    } else {
      clauses.push(`assignee = "${options.assignee}"`);
    }
  }

  if (options.sprint && options.sprint !== 'ALL') {
    if (options.sprint === 'EMPTY' || options.sprint === 'backlog') {
      clauses.push('sprint is EMPTY');
    } else {
      clauses.push(`sprint = "${options.sprint}"`);
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
