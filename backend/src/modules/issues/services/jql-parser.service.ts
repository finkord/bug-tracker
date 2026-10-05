import { Injectable, BadRequestException } from '@nestjs/common';
import type { SelectQueryBuilder } from 'typeorm';
import type { Issue } from '../entities/issue.entity.js';

export interface JqlToken {
  field: string;
  operator: '=' | '!=' | 'in' | 'not in' | '~' | '!~' | 'is' | 'is not';
  value: string | string[];
}

export interface JqlAst {
  conditions: JqlToken[];
  orderBy?: {
    field: 'createdAt' | 'updatedAt' | 'priority' | 'key' | 'title';
    direction: 'ASC' | 'DESC';
  };
  raw: string;
}

@Injectable()
export class JqlParserService {
  /**
   * Validates a JQL string safely without throwing exceptions.
   * Returns validation status, error messages, and parsed ordering/condition count.
   */
  validate(jqlString: string): {
    isValid: boolean;
    errorMessage?: string;
    conditionsCount: number;
    orderBy?: JqlAst['orderBy'];
  } {
    try {
      const ast = this.parse(jqlString);
      return {
        isValid: true,
        conditionsCount: ast.conditions.length,
        orderBy: ast.orderBy,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid JQL syntax';
      return {
        isValid: false,
        errorMessage: message.replace(/^JQL parse failure:\s*/i, ''),
        conditionsCount: 0,
      };
    }
  }

  /**
   * Parses a Jira-compatible JQL query string into structured AST.
   */
  parse(jqlString: string): JqlAst {
    const raw = jqlString.trim();
    if (!raw) {
      return { conditions: [], raw: '' };
    }

    try {
      let queryPart = raw;
      let orderPart = '';

      const orderByIndex = raw.toUpperCase().lastIndexOf('ORDER BY');
      if (orderByIndex !== -1) {
        queryPart = raw.substring(0, orderByIndex).trim();
        orderPart = raw.substring(orderByIndex + 8).trim();
      }

      let orderBy: JqlAst['orderBy'] = undefined;
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
        return { conditions: [], orderBy, raw };
      }

      // Split clauses by top-level "AND" outside quotation marks
      const clauses = this.splitClauses(queryPart);
      const conditions: JqlToken[] = [];

      for (const clause of clauses) {
        const trimmed = clause.trim();
        if (!trimmed) continue;

        // IN / NOT IN: field (NOT IN|IN) (...)
        const inMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+(NOT\s+IN|IN)\s*\(([^)]+)\)$/i);
        if (inMatch) {
          const field = this.normalizeField(inMatch[1]);
          const op = inMatch[2].toUpperCase().replace(/\s+/, ' ') === 'NOT IN' ? 'not in' : 'in';
          const values = inMatch[3]
            .split(',')
            .map((v) => this.cleanValue(v))
            .filter(Boolean);
          conditions.push({ field, operator: op, value: values });
          continue;
        }

        // IS / IS NOT: field IS (NOT EMPTY|EMPTY)
        const isMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+IS\s+(NOT\s+EMPTY|EMPTY)$/i);
        if (isMatch) {
          const field = this.normalizeField(isMatch[1]);
          const op = isMatch[2].toUpperCase().includes('NOT') ? 'is not' : 'is';
          conditions.push({ field, operator: op, value: 'EMPTY' });
          continue;
        }

        // Standard comparison operators: =, !=, ~, !~ (ensure not matched on == or ===)
        const opMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(!=|!~|=|~)(?!=)\s*(.+)$/);
        if (opMatch) {
          const field = this.normalizeField(opMatch[1]);
          const op = opMatch[2] as '=' | '!=' | '~' | '!~';
          const val = this.cleanValue(opMatch[3]);
          conditions.push({ field, operator: op, value: val });
          continue;
        }

        throw new BadRequestException(`Unrecognized or invalid JQL clause: "${trimmed}"`);
      }

      return { conditions, orderBy, raw };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      const msg = err instanceof Error ? err.message : 'Invalid JQL syntax';
      throw new BadRequestException(`JQL parse failure: ${msg}`);
    }
  }

  /**
   * Applies parsed JQL AST conditions and ordering to TypeORM SelectQueryBuilder.
   */
  applyToQueryBuilder(
    qb: SelectQueryBuilder<Issue>,
    jql: string,
    currentUserId?: number,
  ): boolean {
    const ast = this.parse(jql);

    ast.conditions.forEach((cond, idx) => {
      const pName = `jql_${cond.field}_${idx}`;
      const { field, operator, value } = cond;

      switch (field) {
        case 'project': {
          if (operator === '=') {
            qb.andWhere(`(LOWER(project.key) = LOWER(:${pName}) OR issue.projectId = :${pName}Num)`, {
              [pName]: String(value).toUpperCase(),
              [`${pName}Num`]: Number(value) || -1,
            });
          } else if (operator === '!=') {
            qb.andWhere(`(LOWER(project.key) != LOWER(:${pName}) AND issue.projectId != :${pName}Num)`, {
              [pName]: String(value).toUpperCase(),
              [`${pName}Num`]: Number(value) || -1,
            });
          } else if (operator === 'in' && Array.isArray(value)) {
            const upperList = value.map((v) => String(v).toUpperCase());
            const numList = value.map((v) => Number(v)).filter((v) => !isNaN(v));
            qb.andWhere(
              `(UPPER(project.key) IN (:...${pName}Keys)${numList.length ? ` OR issue.projectId IN (:...${pName}Ids)` : ''})`,
              {
                [`${pName}Keys`]: upperList,
                ...(numList.length ? { [`${pName}Ids`]: numList } : {}),
              },
            );
          } else if (operator === 'not in' && Array.isArray(value)) {
            const upperList = value.map((v) => String(v).toUpperCase());
            const numList = value.map((v) => Number(v)).filter((v) => !isNaN(v));
            qb.andWhere(
              `(UPPER(project.key) NOT IN (:...${pName}Keys)${numList.length ? ` AND issue.projectId NOT IN (:...${pName}Ids)` : ''})`,
              {
                [`${pName}Keys`]: upperList,
                ...(numList.length ? { [`${pName}Ids`]: numList } : {}),
              },
            );
          }
          break;
        }

        case 'status': {
          if (operator === '=') {
            qb.andWhere(`UPPER(issue.status) = UPPER(:${pName})`, { [pName]: String(value) });
          } else if (operator === '!=') {
            qb.andWhere(`UPPER(issue.status) != UPPER(:${pName})`, { [pName]: String(value) });
          } else if (operator === 'in' && Array.isArray(value)) {
            qb.andWhere(`UPPER(issue.status) IN (:...${pName})`, { [pName]: value.map((v) => String(v).toUpperCase()) });
          } else if (operator === 'not in' && Array.isArray(value)) {
            qb.andWhere(`UPPER(issue.status) NOT IN (:...${pName})`, { [pName]: value.map((v) => String(v).toUpperCase()) });
          }
          break;
        }

        case 'priority': {
          if (operator === '=') {
            qb.andWhere(`UPPER(issue.priority) = UPPER(:${pName})`, { [pName]: String(value) });
          } else if (operator === '!=') {
            qb.andWhere(`UPPER(issue.priority) != UPPER(:${pName})`, { [pName]: String(value) });
          } else if (operator === 'in' && Array.isArray(value)) {
            qb.andWhere(`UPPER(issue.priority) IN (:...${pName})`, { [pName]: value.map((v) => String(v).toUpperCase()) });
          } else if (operator === 'not in' && Array.isArray(value)) {
            qb.andWhere(`UPPER(issue.priority) NOT IN (:...${pName})`, { [pName]: value.map((v) => String(v).toUpperCase()) });
          }
          break;
        }

        case 'issueType': {
          if (operator === '=') {
            qb.andWhere(`UPPER(issue.issueType) = UPPER(:${pName})`, { [pName]: String(value) });
          } else if (operator === '!=') {
            qb.andWhere(`UPPER(issue.issueType) != UPPER(:${pName})`, { [pName]: String(value) });
          } else if (operator === 'in' && Array.isArray(value)) {
            qb.andWhere(`UPPER(issue.issueType) IN (:...${pName})`, { [pName]: value.map((v) => String(v).toUpperCase()) });
          } else if (operator === 'not in' && Array.isArray(value)) {
            qb.andWhere(`UPPER(issue.issueType) NOT IN (:...${pName})`, { [pName]: value.map((v) => String(v).toUpperCase()) });
          }
          break;
        }

        case 'assignee': {
          const valLower = String(value).toLowerCase();
          const isCurrentUser = valLower === 'currentuser()' || valLower === 'me';
          const isUnassigned = valLower === 'unassigned' || valLower === 'empty';

          if (operator === '=') {
            if (isCurrentUser) {
              qb.andWhere(`issue.assigneeId = :${pName}Uid`, { [`${pName}Uid`]: currentUserId || -1 });
            } else if (isUnassigned) {
              qb.andWhere(`issue.assigneeId IS NULL`);
            } else if (/^\d+$/.test(String(value))) {
              qb.andWhere(`issue.assigneeId = :${pName}Id`, { [`${pName}Id`]: Number(value) });
            } else {
              qb.andWhere(`LOWER(assignee.fullName) LIKE :${pName}Name`, { [`${pName}Name`]: `%${valLower}%` });
            }
          } else if (operator === '!=') {
            if (isCurrentUser) {
              qb.andWhere(`(issue.assigneeId != :${pName}Uid OR issue.assigneeId IS NULL)`, { [`${pName}Uid`]: currentUserId || -1 });
            } else if (isUnassigned) {
              qb.andWhere(`issue.assigneeId IS NOT NULL`);
            } else if (/^\d+$/.test(String(value))) {
              qb.andWhere(`(issue.assigneeId != :${pName}Id OR issue.assigneeId IS NULL)`, { [`${pName}Id`]: Number(value) });
            }
          } else if (operator === 'is' && isUnassigned) {
            qb.andWhere(`issue.assigneeId IS NULL`);
          } else if (operator === 'is not' && isUnassigned) {
            qb.andWhere(`issue.assigneeId IS NOT NULL`);
          }
          break;
        }

        case 'reporter': {
          const valLower = String(value).toLowerCase();
          const isCurrentUser = valLower === 'currentuser()' || valLower === 'me';

          if (operator === '=') {
            if (isCurrentUser) {
              qb.andWhere(`issue.reporterId = :${pName}Uid`, { [`${pName}Uid`]: currentUserId || -1 });
            } else if (/^\d+$/.test(String(value))) {
              qb.andWhere(`issue.reporterId = :${pName}Id`, { [`${pName}Id`]: Number(value) });
            } else {
              qb.andWhere(`LOWER(reporter.fullName) LIKE :${pName}Name`, { [`${pName}Name`]: `%${valLower}%` });
            }
          } else if (operator === '!=') {
            if (isCurrentUser) {
              qb.andWhere(`issue.reporterId != :${pName}Uid`, { [`${pName}Uid`]: currentUserId || -1 });
            } else if (/^\d+$/.test(String(value))) {
              qb.andWhere(`issue.reporterId != :${pName}Id`, { [`${pName}Id`]: Number(value) });
            }
          }
          break;
        }

        case 'sprint': {
          if (operator === 'is') {
            qb.andWhere(`issue.sprintId IS NULL`);
          } else if (operator === 'is not') {
            qb.andWhere(`issue.sprintId IS NOT NULL`);
          } else if (operator === '=') {
            if (/^\d+$/.test(String(value))) {
              qb.andWhere(`issue.sprintId = :${pName}SprintId`, { [`${pName}SprintId`]: Number(value) });
            } else {
              qb.andWhere(`sprint.name = :${pName}SprintName`, { [`${pName}SprintName`]: String(value) });
            }
          } else if (operator === '!=') {
            if (/^\d+$/.test(String(value))) {
              qb.andWhere(`(issue.sprintId != :${pName}SprintId OR issue.sprintId IS NULL)`, { [`${pName}SprintId`]: Number(value) });
            } else {
              qb.andWhere(`(sprint.name != :${pName}SprintName OR sprint.name IS NULL)`, { [`${pName}SprintName`]: String(value) });
            }
          }
          break;
        }

        case 'text': {
          const rawTerm = String(value).trim();
          const likeTerm = `%${rawTerm.toLowerCase()}%`;
          qb.andWhere(
            `(to_tsvector('english', coalesce(issue.title, '') || ' ' || coalesce(issue.description, '')) @@ plainto_tsquery('english', :${pName}Raw) OR LOWER(issue.title) LIKE :${pName}Like OR LOWER(project.key) LIKE :${pName}Like)`,
            {
              [`${pName}Raw`]: rawTerm,
              [`${pName}Like`]: likeTerm,
            },
          );
          break;
        }

        case 'key': {
          const keyRaw = String(value).trim().toUpperCase();
          const match = keyRaw.match(/^([A-Z0-9_-]+)-(\d+)$/);
          if (match) {
            const [, pKey, numStr] = match;
            qb.andWhere(`(UPPER(project.key) = :${pName}PKey AND issue.issueNum = :${pName}Num)`, {
              [`${pName}PKey`]: pKey,
              [`${pName}Num`]: parseInt(numStr, 10),
            });
          } else if (/^\d+$/.test(keyRaw)) {
            qb.andWhere(`issue.id = :${pName}Id`, { [`${pName}Id`]: parseInt(keyRaw, 10) });
          }
          break;
        }
      }
    });

    if (ast.orderBy) {
      const colMap: Record<string, string> = {
        createdAt: 'issue.createdAt',
        updatedAt: 'issue.updatedAt',
        priority: 'issue.priority',
        key: 'issue.issueNum',
        title: 'issue.title',
      };
      const col = colMap[ast.orderBy.field] || 'issue.createdAt';
      qb.orderBy(col, ast.orderBy.direction);
      return true;
    }
    return false;
  }

  private normalizeField(f: string): string {
    const lower = f.toLowerCase();
    if (lower === 'project' || lower === 'projectid' || lower === 'projectkey') return 'project';
    if (lower === 'status') return 'status';
    if (lower === 'priority') return 'priority';
    if (lower === 'issuetype' || lower === 'type') return 'issueType';
    if (lower === 'assignee' || lower === 'assigneeid') return 'assignee';
    if (lower === 'reporter' || lower === 'reporterid') return 'reporter';
    if (lower === 'sprint' || lower === 'sprintid') return 'sprint';
    if (lower === 'text' || lower === 'summary' || lower === 'description') return 'text';
    if (lower === 'key' || lower === 'issuekey' || lower === 'id') return 'key';
    return lower;
  }

  private cleanValue(v: string): string {
    let res = v.trim();
    if (
      (res.startsWith('"') && res.endsWith('"')) ||
      (res.startsWith("'") && res.endsWith("'"))
    ) {
      res = res.slice(1, -1);
    }
    return res.trim();
  }

  private splitClauses(queryPart: string): string[] {
    const clauses: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    const tokens = queryPart.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.toUpperCase() === 'AND' && !inQuotes) {
        if (current.trim()) {
          clauses.push(current.trim());
          current = '';
        }
      } else {
        current += (current ? ' ' : '') + t;
        for (const ch of t) {
          if ((ch === '"' || ch === "'") && (!inQuotes || quoteChar === ch)) {
            inQuotes = !inQuotes;
            quoteChar = inQuotes ? ch : '';
          }
        }
      }
    }
    if (current.trim()) {
      clauses.push(current.trim());
    }
    return clauses;
  }
}
