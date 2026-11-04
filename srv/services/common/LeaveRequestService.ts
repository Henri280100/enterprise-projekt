import type cds from '@sap/cds';
import type { LeaveRequest } from '#cds-models/enterprise/common';
import { DECISIONS, ENTITIES, STATUS, STEP } from '../../shared/constants/leave.js';
import { AppError } from '../../shared/errors/AppError.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Payload of WorkflowService.updateApprovalResult.
export type DecisionInput = {
  leaveRequestId: string;
  decision: string;
  approverEmail?: string | null;
  comment?: string | null;
  processStep?: string | null;
};

/**
 * Leave Request business rules. Queries run in the current CAP
 * transaction, so they commit/roll back with the incoming request.
 */
export class LeaveRequestService {
  // bpaQueue: outboxed BPA service, only needed by submit()
  constructor(private readonly bpaQueue?: cds.Service) {}

  // Inclusive calendar days, e.g. 01 -> 03 = 3
  calculateLeaveDays(startDate?: string | null, endDate?: string | null): number {
    if (!startDate || !endDate) throw new AppError(400, 'Start date and end date are required.');

    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) throw new AppError(400, 'Invalid date.');
    if (end < start) throw new AppError(400, 'End date must not be earlier than start date.');

    return Math.floor((end - start) / DAY_MS) + 1;
  }

  // NEW → SUBMITTED; BPA start is queued in the same transaction.
  async submit(id: string): Promise<LeaveRequest> {
    const request = await this.get(id);

    if (request.status_code !== STATUS.NEW) {
      throw new AppError(
        409,
        `Only NEW requests can be submitted. Current status: ${request.status_code}.`,
      );
    }

    const leaveDays = this.calculateLeaveDays(request.startDate, request.endDate);
    const correlationId = `LEAVE-${id}`;

    await UPDATE(ENTITIES.LEAVE_REQUESTS)
      .set({
        status_code: STATUS.SUBMITTED,
        leaveDays,
        correlationId,
        errorMessage: null,
      })
      .where({ ID: id });

    await this.addHistory(
      id,
      STATUS.SUBMITTED,
      request.employeeEmail,
      'Leave request submitted.',
      STEP.SUBMISSION,
    );

    // Queued only; delivered after commit, retried on failure.
    await this.bpaQueue?.send('startApproval', {
      ...request,
      leaveDays,
      correlationId,
    });

    return this.get(id);
  }

  // Idempotent: WHERE SUBMITTED turns an outbox retry into a no-op.
  async markWorkflowStarted(id: string, instanceId: string, definitionId?: string) {
    const affected = await UPDATE(ENTITIES.LEAVE_REQUESTS)
      .set({
        status_code: STATUS.PENDING_APPROVAL,
        bpaProcessInstanceId: instanceId,
        errorMessage: null,
      })
      .where({ ID: id, status_code: STATUS.SUBMITTED });

    if (affected) {
      await this.addHistory(
        id,
        'WORKFLOW_STARTED',
        'system',
        `BPA ${definitionId ?? ''}`.trim(),
        STEP.PROCESS_START,
      );
    }
  }

  // PENDING_APPROVAL → APPROVED | REJECTED. Same decision twice = success.
  async applyDecision(input: DecisionInput): Promise<string> {
    const decision = input.decision?.trim().toUpperCase();
    if (!DECISIONS.has(decision)) throw new AppError(400, 'Decision must be APPROVED or REJECTED.');

    const request = await this.get(input.leaveRequestId);

    if (request.status_code === decision) return decision;
    if (request.status_code !== STATUS.PENDING_APPROVAL) {
      throw new AppError(409, `Decision cannot be applied from status ${request.status_code}.`);
    }

    await UPDATE(ENTITIES.LEAVE_REQUESTS)
      .set({
        status_code: decision,
        approverEmail: input.approverEmail ?? null,
        approverComment: input.comment ?? null,
        decisionDate: new Date().toISOString(),
      })
      .where({ ID: input.leaveRequestId });

    await this.addHistory(
      input.leaveRequestId,
      decision,
      input.approverEmail,
      input.comment,
      input.processStep ?? STEP.MANAGER_APPROVAL,
    );

    return decision;
  }

  // Active record or 404.
  async get(id: string): Promise<LeaveRequest> {
    const row = (await SELECT.one.from(ENTITIES.LEAVE_REQUESTS).where({ ID: id })) as
      | LeaveRequest
      | undefined;
    if (!row) throw new AppError(404, `Leave request ${id} not found.`);
    return row;
  }

  private addHistory(
    id: string,
    action: string,
    actor?: string | null,
    comment?: string | null,
    step?: string | null,
  ) {
    return INSERT.into(ENTITIES.APPROVAL_HISTORY).entries({
      request_ID: id,
      action,
      actor: actor ?? null,
      comment: comment ?? null,
      processStep: step ?? null,
      actionDate: new Date().toISOString(),
    });
  }
}
