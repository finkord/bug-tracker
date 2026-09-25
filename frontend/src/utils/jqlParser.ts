import type { IssueItem } from '../api/client';

export interface JqlToken {
  field: string;
  operator: '=' | '!=' | 'in' | 'not in' | '~' | 'is' | 'is not';
  value: string | string[];
}

export interface JqlQuery {
  conditions: JqlToken[];
  orderBy?: {
    field: 'createdAt' | 'updatedAt' | 'priority' | 'key' | 'title';
    direction: 'ASC' | 'DESC';
  };
  raw: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Parses a subset of Jira JQL (Jira Query Language) into an executable query structure.
 * Supports:
 * - project = "KEY" | project IN (KEY1, KEY2)
 * - status = "OPEN" | status IN (OPEN, IN_PROGRESS)
 * - priority = "CRITICAL" | priority != "LOW"
 * - issueType = "BUG" | type IN (BUG, TASK)
 * - assignee = currentUser() | assignee = "unassigned" | assignee = 12
 * - reporter = currentUser() | reporter = 12
 * - sprint = "Sprint 1" | sprint is EMPTY | sprint is not EMPTY
 * - text ~ "search keyword" | summary ~ "keyword"
 * - ORDER BY <field> [ASC|DESC]
 */
export function parseJql(jqlString: string): JqlQuery {
  const raw = jqlString.trim();
  if (!raw) {
    return { conditions: [], raw: '', isValid: true };
  }

  try {
    let queryPart = raw;
    let orderPart = '';

    const orderByIndex = raw.toUpperCase().lastIndexOf('ORDER BY');
    if (orderByIndex !== -1) {
      queryPart = raw.substring(0, orderByIndex).trim();
      orderPart = raw.substring(orderByIndex + 8).trim();
    }

    let orderBy: JqlQuery['orderBy'] = undefined;
    if (orderPart) {
      const orderTokens = orderPart.split(/\s+/);
      const fieldRaw = orderTokens[0]?.toLowerCase();
      const dirRaw = (orderTokens[1] || 'DESC').toUpperCase();

      let field: 'createdAt' | 'updatedAt' | 'priority' | 'key' | 'title' = 'createdAt';
      if (fieldRaw === 'created' || fieldRaw === 'createdat') field = 'createdAt';
      else if (fieldRaw === 'updated' || fieldRaw === 'updatedat') field = 'updatedAt';
      else if (fieldRaw === 'priority') field = 'priority';
      else if (fieldRaw === 'key' || fieldRaw === 'issuekey') field = 'key';
      else if (fieldRaw === 'title' || fieldRaw === 'summary') field = 'title';

      orderBy = {
        field,
        direction: dirRaw === 'ASC' ? 'ASC' : 'DESC',
      };
    }

    if (!queryPart) {
      return { conditions: [], orderBy, raw, isValid: true };
    }

    // Split conditions by top-level "AND"
    const conditionStrings = queryPart.split(/\s+AND\s+/i);
    const conditions: JqlToken[] = [];

    for (const condStr of conditionStrings) {
      const trimmed = condStr.trim();
      if (!trimmed) continue;

      // Check for: field IN (...) or field NOT IN (...)
      const inMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+(NOT\s+IN|IN)\s*\(([^)]+)\)$/i);
      if (inMatch) {
        const field = normalizeField(inMatch[1]);
        const op = inMatch[2].toUpperCase().replace(/\s+/, ' ') === 'NOT IN' ? 'not in' : 'in';
        const values = inMatch[3]
          .split(',')
          .map((v) => cleanValue(v))
          .filter(Boolean);
        conditions.push({ field, operator: op, value: values });
        continue;
      }

      // Check for: sprint is EMPTY / is NOT EMPTY
      const isMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+IS\s+(NOT\s+EMPTY|EMPTY)$/i);
      if (isMatch) {
        const field = normalizeField(isMatch[1]);
        const op = isMatch[2].toUpperCase().includes('NOT') ? 'is not' : 'is';
        conditions.push({ field, operator: op, value: 'EMPTY' });
        continue;
      }

      // Check for standard operators: =, !=, ~, !~
      const opMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(=|!=|~|!~)\s*(.+)$/);
      if (opMatch) {
        const field = normalizeField(opMatch[1]);
        const op = opMatch[2] as '=' | '!=' | '~';
        const val = cleanValue(opMatch[3]);
        conditions.push({ field, operator: op, value: val });
        continue;
      }

      throw new Error(`Unrecognized clause near: "${trimmed}"`);
    }

    return { conditions, orderBy, raw, isValid: true };
  } catch (err: any) {
    return {
      conditions: [],
      raw,
      isValid: false,
      errorMessage: err.message || 'Invalid JQL syntax',
    };
  }
}

function normalizeField(f: string): string {
  const lower = f.toLowerCase();
  if (lower === 'project' || lower === 'projectid' || lower === 'projectkey') return 'project';
  if (lower === 'status') return 'status';
  if (lower === 'priority') return 'priority';
  if (lower === 'issuetype' || lower === 'type') return 'issueType';
  if (lower === 'assignee' || lower === 'assigneeid') return 'assignee';
  if (lower === 'reporter' || lower === 'reporterid') return 'reporter';
  if (lower === 'sprint') return 'sprint';
  if (lower === 'text' || lower === 'summary' || lower === 'description') return 'text';
  return lower;
}

function cleanValue(v: string): string {
  let res = v.trim();
  if (
    (res.startsWith('"') && res.endsWith('"')) ||
    (res.startsWith("'") && res.endsWith("'"))
  ) {
    res = res.slice(1, -1);
  }
  return res.trim();
}

/**
 * Evaluates in-memory issues against parsed JQL query.
 */
export function evaluateJql(
  issues: IssueItem[],
  query: JqlQuery,
  currentUserId?: number,
): IssueItem[] {
  if (!query.isValid) return [];

  const filtered = issues.filter((issue) => {
    for (const cond of query.conditions) {
      const { field, operator, value } = cond;

      if (field === 'project') {
        const projKey = (issue.projectKey || issue.projectName || '').toUpperCase();
        const projId = String(issue.projectId);
        if (operator === '=' || operator === '~') {
          const matchVal = String(value).toUpperCase();
          if (projKey !== matchVal && projId !== matchVal) return false;
        } else if (operator === '!=') {
          const matchVal = String(value).toUpperCase();
          if (projKey === matchVal || projId === matchVal) return false;
        } else if (operator === 'in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (!list.includes(projKey) && !list.includes(projId)) return false;
        } else if (operator === 'not in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (list.includes(projKey) || list.includes(projId)) return false;
        }
      } else if (field === 'status') {
        const stat = (issue.status || '').toUpperCase();
        if (operator === '=') {
          if (stat !== String(value).toUpperCase()) return false;
        } else if (operator === '!=') {
          if (stat === String(value).toUpperCase()) return false;
        } else if (operator === 'in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (!list.includes(stat)) return false;
        } else if (operator === 'not in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (list.includes(stat)) return false;
        }
      } else if (field === 'priority') {
        const prio = (issue.priority || '').toUpperCase();
        if (operator === '=') {
          if (prio !== String(value).toUpperCase()) return false;
        } else if (operator === '!=') {
          if (prio === String(value).toUpperCase()) return false;
        } else if (operator === 'in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (!list.includes(prio)) return false;
        } else if (operator === 'not in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (list.includes(prio)) return false;
        }
      } else if (field === 'issueType') {
        const type = (issue.issueType || '').toUpperCase();
        if (operator === '=') {
          if (type !== String(value).toUpperCase()) return false;
        } else if (operator === '!=') {
          if (type === String(value).toUpperCase()) return false;
        } else if (operator === 'in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (!list.includes(type)) return false;
        } else if (operator === 'not in' && Array.isArray(value)) {
          const list = value.map((v) => v.toUpperCase());
          if (list.includes(type)) return false;
        }
      } else if (field === 'assignee') {
        const isCurrentUser =
          String(value).toLowerCase() === 'currentuser()' ||
          String(value).toLowerCase() === 'me';
        const isUnassigned =
          String(value).toLowerCase() === 'unassigned' ||
          String(value).toLowerCase() === 'empty' ||
          value === null;

        if (operator === '=') {
          if (isCurrentUser) {
            if (!issue.assignee || issue.assignee.id !== currentUserId) return false;
          } else if (isUnassigned) {
            if (issue.assignee) return false;
          } else {
            const target = String(value).toLowerCase();
            const matchesId = String(issue.assignee?.id) === target;
            const matchesName = (issue.assignee?.fullName || '').toLowerCase().includes(target);
            if (!matchesId && !matchesName) return false;
          }
        } else if (operator === '!=') {
          if (isCurrentUser) {
            if (issue.assignee?.id === currentUserId) return false;
          } else if (isUnassigned) {
            if (!issue.assignee) return false;
          }
        }
      } else if (field === 'reporter') {
        const isCurrentUser =
          String(value).toLowerCase() === 'currentuser()' ||
          String(value).toLowerCase() === 'me';
        if (operator === '=') {
          if (isCurrentUser) {
            if (!issue.reporter || issue.reporter.id !== currentUserId) return false;
          } else {
            const target = String(value).toLowerCase();
            const matchesId = String(issue.reporter?.id) === target;
            const matchesName = (issue.reporter?.fullName || '').toLowerCase().includes(target);
            if (!matchesId && !matchesName) return false;
          }
        }
      } else if (field === 'sprint') {
        if (operator === 'is') {
          if (value === 'EMPTY' && issue.sprint) return false;
        } else if (operator === 'is not') {
          if (value === 'EMPTY' && !issue.sprint) return false;
        } else if (operator === '=') {
          if (issue.sprint !== value) return false;
        } else if (operator === '!=') {
          if (issue.sprint === value) return false;
        }
      } else if (field === 'text') {
        const q = String(value).toLowerCase();
        const keyMatch = issue.key.toLowerCase().includes(q);
        const titleMatch = issue.title.toLowerCase().includes(q);
        const descMatch = (issue.description || '').toLowerCase().includes(q);
        if (!keyMatch && !titleMatch && !descMatch) return false;
      }
    }
    return true;
  });

  // Apply sorting
  const orderBy = query.orderBy || { field: 'createdAt', direction: 'DESC' };
  return filtered.sort((a, b) => {
    let comp = 0;
    if (orderBy.field === 'createdAt') {
      comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (orderBy.field === 'updatedAt') {
      comp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    } else if (orderBy.field === 'priority') {
      const weight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      comp = (weight[a.priority] || 0) - (weight[b.priority] || 0);
    } else if (orderBy.field === 'key') {
      comp = a.key.localeCompare(b.key);
    } else if (orderBy.field === 'title') {
      comp = a.title.localeCompare(b.title);
    }
    return orderBy.direction === 'DESC' ? -comp : comp;
  });
}

/**
 * Converts visual filter parameters into equivalent JQL string.
 */
export function buildJqlFromFilters(params: {
  query?: string;
  projectKey?: string;
  statuses?: string[];
  priorities?: string[];
  issueTypes?: string[];
  assignee?: string;
  sprint?: string;
  sortBy?: string;
  sortOrder?: string;
}): string {
  const clauses: string[] = [];

  if (params.query && params.query.trim()) {
    clauses.push(`text ~ "${params.query.trim()}"`);
  }

  if (params.projectKey && params.projectKey !== 'ALL') {
    clauses.push(`project = "${params.projectKey}"`);
  }

  if (params.issueTypes && params.issueTypes.length > 0) {
    if (params.issueTypes.length === 1) {
      clauses.push(`issueType = "${params.issueTypes[0]}"`);
    } else {
      clauses.push(`issueType IN (${params.issueTypes.map((t) => `"${t}"`).join(', ')})`);
    }
  }

  if (params.statuses && params.statuses.length > 0) {
    if (params.statuses.length === 1) {
      clauses.push(`status = "${params.statuses[0]}"`);
    } else {
      clauses.push(`status IN (${params.statuses.map((s) => `"${s}"`).join(', ')})`);
    }
  }

  if (params.priorities && params.priorities.length > 0) {
    if (params.priorities.length === 1) {
      clauses.push(`priority = "${params.priorities[0]}"`);
    } else {
      clauses.push(`priority IN (${params.priorities.map((p) => `"${p}"`).join(', ')})`);
    }
  }

  if (params.assignee) {
    if (params.assignee === 'ME') {
      clauses.push(`assignee = currentUser()`);
    } else if (params.assignee === 'UNASSIGNED') {
      clauses.push(`assignee = "unassigned"`);
    } else if (params.assignee !== 'ALL') {
      clauses.push(`assignee = ${params.assignee}`);
    }
  }

  if (params.sprint) {
    if (params.sprint === 'BACKLOG') {
      clauses.push(`sprint is EMPTY`);
    } else if (params.sprint === 'ACTIVE') {
      clauses.push(`sprint is not EMPTY`);
    } else if (params.sprint !== 'ALL') {
      clauses.push(`sprint = "${params.sprint}"`);
    }
  }

  const orderClause = `ORDER BY ${params.sortBy || 'createdAt'} ${params.sortOrder?.toUpperCase() || 'DESC'}`;
  return clauses.length > 0 ? `${clauses.join(' AND ')} ${orderClause}` : orderClause;
}
