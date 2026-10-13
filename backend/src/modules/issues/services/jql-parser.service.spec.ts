import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { JqlParserService } from './jql-parser.service.js';

describe('JqlParserService', () => {
  let service: JqlParserService;

  beforeEach(() => {
    service = new JqlParserService();
  });

  describe('parse', () => {
    it('should return empty conditions for empty or whitespace query', () => {
      const result = service.parse('');
      expect(result.conditions).toEqual([]);
      expect(result.orderBy).toBeUndefined();

      const whitespace = service.parse('   ');
      expect(whitespace.conditions).toEqual([]);
    });

    it('should parse single equality condition for project', () => {
      const result = service.parse('project = "CORE"');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'project',
        operator: '=',
        value: 'CORE',
      });
    });

    it('should parse status IN list condition', () => {
      const result = service.parse('status IN ("OPEN", "IN_PROGRESS")');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'status',
        operator: 'in',
        value: ['OPEN', 'IN_PROGRESS'],
      });
    });

    it('should parse priority NOT IN list condition', () => {
      const result = service.parse('priority NOT IN (LOW, MEDIUM)');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'priority',
        operator: 'not in',
        value: ['LOW', 'MEDIUM'],
      });
    });

    it('should parse sprint is EMPTY condition', () => {
      const result = service.parse('sprint is EMPTY');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'sprint',
        operator: 'is',
        value: 'EMPTY',
      });
    });

    it('should parse sprint is not EMPTY condition', () => {
      const result = service.parse('sprint is not EMPTY');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'sprint',
        operator: 'is not',
        value: 'EMPTY',
      });
    });

    it('should parse text search operator ~', () => {
      const result = service.parse('text ~ "database migration failure"');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'text',
        operator: '~',
        value: 'database migration failure',
      });
    });

    it('should parse multiple conditions joined by AND with currentUser() function', () => {
      const result = service.parse('project = "CORE" AND assignee = currentUser() AND status != "DONE"');
      expect(result.conditions).toHaveLength(3);
      expect(result.conditions[0]).toEqual({
        field: 'project',
        operator: '=',
        value: 'CORE',
      });
      expect(result.conditions[1]).toEqual({
        field: 'assignee',
        operator: '=',
        value: 'currentUser()',
      });
      expect(result.conditions[2]).toEqual({
        field: 'status',
        operator: '!=',
        value: 'DONE',
      });
    });

    it('should parse ORDER BY clause with direction', () => {
      const result = service.parse('status = "OPEN" ORDER BY priority DESC');
      expect(result.conditions).toHaveLength(1);
      expect(result.orderBy).toEqual({
        field: 'priority',
        direction: 'DESC',
      });
    });

    it('should throw BadRequestException on malformed syntax', () => {
      expect(() => service.parse('invalid clause without operator')).toThrow(BadRequestException);
    });
    it('should parse key IN and NOT IN conditions', () => {
      const inRes = service.parse('key IN ("CORE-1", "CORE-2")');
      expect(inRes.conditions).toHaveLength(1);
      expect(inRes.conditions[0]).toEqual({
        field: 'key',
        operator: 'in',
        value: ['CORE-1', 'CORE-2'],
      });

      const notInRes = service.parse('key NOT IN ("CORE-3")');
      expect(notInRes.conditions).toHaveLength(1);
      expect(notInRes.conditions[0]).toEqual({
        field: 'key',
        operator: 'not in',
        value: ['CORE-3'],
      });
    });

    it('should parse assignee IN condition with numeric IDs and currentUser()', () => {
      const result = service.parse('assignee IN (1, 2, currentUser())');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'assignee',
        operator: 'in',
        value: ['1', '2', 'currentUser()'],
      });
    });

    it('should parse sprint = active and sprint != active condition', () => {
      const result = service.parse('sprint = active');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'sprint',
        operator: '=',
        value: 'active',
      });

      const notActive = service.parse('sprint != active');
      expect(notActive.conditions[0]).toEqual({
        field: 'sprint',
        operator: '!=',
        value: 'active',
      });
    });

    it('should parse negated text search operator !~', () => {
      const result = service.parse('text !~ "system failure"');
      expect(result.conditions).toHaveLength(1);
      expect(result.conditions[0]).toEqual({
        field: 'text',
        operator: '!~',
        value: 'system failure',
      });
    });
  });

  describe('applyToQueryBuilder', () => {
    it('should attach SQL where clauses and parameters to query builder', () => {
      const mockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };

      service.applyToQueryBuilder(
        mockQb as any,
        'project = "CORE" AND status = "OPEN" AND assignee = currentUser() ORDER BY createdAt ASC',
        42,
      );

      expect(mockQb.andWhere).toHaveBeenCalledTimes(3);
      expect(mockQb.orderBy).toHaveBeenCalledWith('issue.createdAt', 'ASC');
    });

    it('should handle unassigned assignee properly', () => {
      const mockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };

      service.applyToQueryBuilder(mockQb as any, 'assignee = "unassigned"');

      expect(mockQb.andWhere).toHaveBeenCalledWith('issue.assigneeId IS NULL');
    });

    it('should handle key IN and NOT IN with issue keys and IDs', () => {
      const mockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };

      service.applyToQueryBuilder(mockQb as any, 'key IN ("CORE-1", "CORE-2", 42)');
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '((UPPER(project.key) = :jql_key_0_pk_0 AND issue.issueNum = :jql_key_0_nm_0) OR (UPPER(project.key) = :jql_key_0_pk_1 AND issue.issueNum = :jql_key_0_nm_1) OR (issue.id = :jql_key_0_id_2))',
        {
          jql_key_0_pk_0: 'CORE',
          jql_key_0_nm_0: 1,
          jql_key_0_pk_1: 'CORE',
          jql_key_0_nm_1: 2,
          jql_key_0_id_2: 42,
        },
      );

      const notInMockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };
      service.applyToQueryBuilder(notInMockQb as any, 'key NOT IN ("CORE-3")');
      expect(notInMockQb.andWhere).toHaveBeenCalledWith(
        'NOT ((UPPER(project.key) = :jql_key_0_pk_0 AND issue.issueNum = :jql_key_0_nm_0))',
        {
          jql_key_0_pk_0: 'CORE',
          jql_key_0_nm_0: 3,
        },
      );
    });

    it('should handle assignee IN and NOT IN including currentUser() and unassigned', () => {
      const mockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };

      service.applyToQueryBuilder(mockQb as any, 'assignee IN (1, currentUser())', 99);
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(issue.assigneeId IN (:...jql_assignee_0AssigneeIds) OR issue.assigneeId = :jql_assignee_0CurrentUid)',
        { jql_assignee_0AssigneeIds: [1], jql_assignee_0CurrentUid: 99 },
      );

      const notInMockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };
      service.applyToQueryBuilder(notInMockQb as any, 'assignee NOT IN (unassigned, 5)');
      expect(notInMockQb.andWhere).toHaveBeenCalledWith(
        'NOT (issue.assigneeId IN (:...jql_assignee_0AssigneeIds) OR issue.assigneeId IS NULL)',
        { jql_assignee_0AssigneeIds: [5] },
      );
    });

    it('should handle sprint active status and IN clauses', () => {
      const qbActive = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };
      service.applyToQueryBuilder(qbActive as any, 'sprint = active');
      expect(qbActive.andWhere).toHaveBeenCalledWith("sprint.status = 'ACTIVE'");

      const qbNotActive = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };
      service.applyToQueryBuilder(qbNotActive as any, 'sprint != active');
      expect(qbNotActive.andWhere).toHaveBeenCalledWith("(sprint.status != 'ACTIVE' OR sprint.status IS NULL)");

      const qbIn = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };
      service.applyToQueryBuilder(qbIn as any, 'sprint IN (10, active)');
      expect(qbIn.andWhere).toHaveBeenCalledWith(
        "(issue.sprintId IN (:...jql_sprint_0SprintIds) OR sprint.status = 'ACTIVE')",
        { jql_sprint_0SprintIds: [10] },
      );
    });

    it('should handle negated text search !~', () => {
      const mockQb = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
      };

      service.applyToQueryBuilder(mockQb as any, 'text !~ "migration"');
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        "NOT ((to_tsvector('english', coalesce(issue.title, '') || ' ' || coalesce(issue.description, '')) @@ plainto_tsquery('english', :jql_text_0Raw) OR LOWER(issue.title) LIKE :jql_text_0Like OR LOWER(project.key) LIKE :jql_text_0Like))",
        {
          jql_text_0Like: '%migration%',
          jql_text_0Raw: 'migration',
        },
      );
    });
  });

  describe('validate', () => {
    it('should return isValid: true and condition count for valid query', () => {
      const res = service.validate('project = "CORE" AND status = "OPEN" ORDER BY priority DESC');
      expect(res.isValid).toBe(true);
      expect(res.conditionsCount).toBe(2);
      expect(res.orderBy).toEqual({ field: 'priority', direction: 'DESC' });
      expect(res.errorMessage).toBeUndefined();
    });

    it('should return isValid: true for empty query', () => {
      const res = service.validate('');
      expect(res.isValid).toBe(true);
      expect(res.conditionsCount).toBe(0);
    });

    it('should return isValid: false with errorMessage for syntax errors', () => {
      const res = service.validate('status === "INVALID"');
      expect(res.isValid).toBe(false);
      expect(res.conditionsCount).toBe(0);
      expect(res.errorMessage).toBeDefined();
    });
  });
});

