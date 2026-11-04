/**
 * Single source of truth for names and codes.
 * Typos like "leaveRquestId" or "PENDING_MANAGER_APPROVAL"
 * broke the old project; keeping them here avoids that.
 */

// Fully-qualified DB entity names for cds.ql.
export const ENTITIES = Object.freeze({
  LEAVE_REQUESTS: 'enterprise.common.LeaveRequests',
  APPROVAL_HISTORY: 'enterprise.common.ApprovalHistory',
} as const);

// Must match db/data/enterprise.common-Statuses.csv.
export const STATUS = Object.freeze({
  NEW: 'NEW',
  SUBMITTED: 'SUBMITTED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
} as const);

// Decisions BPA may send back.
export const DECISIONS = new Set<string>(['APPROVED', 'REJECTED']);

// Values for ApprovalHistory.processStep.
export const STEP = Object.freeze({
  SUBMISSION: 'SUBMISSION',
  PROCESS_START: 'PROCESS_START',
  MANAGER_APPROVAL: 'MANAGER_APPROVAL',
} as const);

// BTP destination names.
export const DESTINATIONS = Object.freeze({
  BPA: 'SAP_BUILD_PROCESS_AUTOMATION',
} as const);
