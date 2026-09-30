import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { JqlParserService, JqlToken } from './jql-parser.service.js';

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
  });
});
