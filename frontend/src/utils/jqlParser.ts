
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
 * Parses a subset of JQL (Issue Query Language) into an executable query structure.
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
  } catch (err: unknown) {
    return {
      conditions: [],
      raw,
      isValid: false,
      errorMessage: err instanceof Error ? err.message : 'Invalid JQL syntax',
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
