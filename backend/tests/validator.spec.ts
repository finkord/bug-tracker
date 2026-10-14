import { describe, it, expect } from 'vitest';
import { BugTrackerValidator, ValueError } from './validator';

describe('BugTrackerValidator Unit Tests', () => {
  // Test 1: Valid project key
  it('TC-U01: should accept valid 2-10 uppercase project keys', () => {
    expect(BugTrackerValidator.isValidProjectKey('CORE')).toBe(true);
    expect(BugTrackerValidator.isValidProjectKey('AUTH')).toBe(true);
    expect(BugTrackerValidator.isValidProjectKey('BT')).toBe(true);
  });

  // Test 2: Invalid project key formats
  it('TC-U02: should reject invalid project key formats (lowercase, too short, symbols)', () => {
    expect(BugTrackerValidator.isValidProjectKey('core')).toBe(false);
    expect(BugTrackerValidator.isValidProjectKey('C')).toBe(false);
    expect(BugTrackerValidator.isValidProjectKey('CORE-APP')).toBe(false);
    expect(BugTrackerValidator.isValidProjectKey('123')).toBe(false);
  });

  // Test 3: Permitted FSM transitions
  it('TC-U03: should validate permitted FSM workflow transitions', () => {
    expect(BugTrackerValidator.isValidFsmTransition('NEW', 'IN_PROGRESS')).toBe(true);
    expect(BugTrackerValidator.isValidFsmTransition('IN_PROGRESS', 'REVIEW')).toBe(true);
    expect(BugTrackerValidator.isValidFsmTransition('REVIEW', 'RESOLVED')).toBe(true);
    expect(BugTrackerValidator.isValidFsmTransition('RESOLVED', 'CLOSED')).toBe(true);
  });

  // Test 4: Forbidden FSM transitions
  it('TC-U04: should reject forbidden FSM workflow transitions', () => {
    expect(BugTrackerValidator.isValidFsmTransition('NEW', 'RESOLVED')).toBe(false);
    expect(BugTrackerValidator.isValidFsmTransition('NEW', 'REVIEW')).toBe(false);
    expect(BugTrackerValidator.isValidFsmTransition('CLOSED', 'RESOLVED')).toBe(false);
  });

  // Test 5: Worklog calculation within estimate
  it('TC-U05: should calculate correct worklog progress percentage within estimate', () => {
    const result = BugTrackerValidator.calculateWorklogProgress(4, 8);
    expect(result.percent).toBe(50);
    expect(result.isOvertime).toBe(false);
  });

  // Test 6: Worklog overtime detection
  it('TC-U06: should detect overtime when spent hours exceed original estimate', () => {
    const result = BugTrackerValidator.calculateWorklogProgress(10, 8);
    expect(result.percent).toBe(125);
    expect(result.isOvertime).toBe(true);
  });

  // Test 7: Worklog negative input exception
  it('TC-U07: should throw ValueError when worklog time values are negative', () => {
    expect(() => BugTrackerValidator.calculateWorklogProgress(-2, 8)).toThrow(ValueError);
    expect(() => BugTrackerValidator.calculateWorklogProgress(4, -5)).toThrow(ValueError);
  });

  // Test 8: Password strength compliance
  it('TC-U08: should validate compliant password meeting all 5 criteria', () => {
    const res = BugTrackerValidator.validatePasswordStrength('Str0ng!Passw0rd');
    expect(res.isValid).toBe(true);
    expect(res.score).toBe(5);
    expect(res.errors).toHaveLength(0);
  });

  // Test 9: Password strength rejection (too short, missing digit/special)
  it('TC-U09: should reject weak password and list missing criteria', () => {
    const res = BugTrackerValidator.validatePasswordStrength('simple');
    expect(res.isValid).toBe(false);
    expect(res.score).toBe(1);
    expect(res.errors).toContain('Password must be at least 10 characters long');
    expect(res.errors).toContain('Password must contain at least one uppercase letter');
    expect(res.errors).toContain('Password must contain at least one numeric digit');
    expect(res.errors).toContain('Password must contain at least one special character');
  });

  // Test 10: Password non-string type error
  it('TC-U10: should throw TypeError if password is not a string', () => {
    expect(() => BugTrackerValidator.validatePasswordStrength(123456789 as any)).toThrow(TypeError);
  });
});
