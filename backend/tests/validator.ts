export type IssueStatus = 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';

const ALLOWED_FSM_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  NEW: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['REVIEW', 'NEW'],
  REVIEW: ['RESOLVED', 'IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['IN_PROGRESS'],
};

export class BugTrackerValidator {
  /**
   * Validates project mnemonic key (2-10 uppercase Latin characters).
   */
  static isValidProjectKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    return /^[A-Z]{2,10}$/.test(key);
  }

  /**
   * Validates issue status transition according to finite state machine rules.
   */
  static isValidFsmTransition(currentStatus: IssueStatus, targetStatus: IssueStatus): boolean {
    if (!ALLOWED_FSM_TRANSITIONS[currentStatus]) return false;
    return ALLOWED_FSM_TRANSITIONS[currentStatus].includes(targetStatus);
  }

  /**
   * Calculates effort progress and flags overtime execution.
   */
  static calculateWorklogProgress(spentHours: number, estimatedHours: number): {
    percent: number;
    isOvertime: boolean;
  } {
    if (spentHours < 0 || estimatedHours < 0) {
      throw new ValueError("Time values cannot be negative");
    }
    if (estimatedHours === 0) {
      return { percent: spentHours > 0 ? 100 : 0, isOvertime: spentHours > 0 };
    }
    const rawPercent = Math.round((spentHours / estimatedHours) * 100);
    return {
      percent: rawPercent,
      isOvertime: spentHours > estimatedHours,
    };
  }

  /**
   * Enforces strict enterprise password policy (5 criteria).
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
  } {
    if (typeof password !== 'string') {
      throw new TypeError("Password must be a string");
    }

    const errors: string[] = [];
    let score = 0;

    if (password.length >= 10) {
      score += 1;
    } else {
      errors.push("Password must be at least 10 characters long");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      errors.push("Password must contain at least one numeric digit");
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      score,
      errors,
    };
  }
}

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
  }
}
