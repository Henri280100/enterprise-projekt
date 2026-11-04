import path from 'node:path';
import cds from '@sap/cds';
import { describe, expect, it } from 'vitest';

// Profile "test": SQLite in-memory + BPA mock.
const { GET, POST, PATCH } = cds.test(path.resolve(__dirname, '../..'));

const alice = { auth: { username: 'alice', password: '' } };
const bpa = { auth: { username: 'bpa', password: '' } };

// Draft entities use a composite key (ID + IsActiveEntity).
const active = (id: string) => `/common/LeaveRequests(ID=${id},IsActiveEntity=true)`;
const draft = (id: string) => `/common/LeaveRequests(ID=${id},IsActiveEntity=false)`;

const validData = {
  employeeId: 'EMP001',
  employeeName: 'Nguyen Van A',
  employeeEmail: 'employee@example.com',
  managerEmail: 'manager@example.com',
  leaveType_code: 'ANNUAL',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
};

// Same steps as Fiori: create draft → fill → activate (Save).
async function createActiveRequest(data = validData) {
  const { data: created } = await POST('/common/LeaveRequests', {}, alice);
  await PATCH(draft(created.ID), data, alice);
  await POST(`${draft(created.ID)}/CommonService.draftActivate`, {}, alice);
  return created.ID as string;
}

// Outbox is asynchronous → poll.
async function waitForStatus(id: string, status: string) {
  for (let i = 0; i < 20; i++) {
    const { data } = await GET(active(id), alice);
    if (data.status_code === status) return data;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Status ${status} not reached`);
}

describe('Leave Request', () => {
  it('activates draft with status NEW and computed leave days', async () => {
    const id = await createActiveRequest();
    const { data } = await GET(active(id), alice);
    expect(data.status_code).toBe('NEW');
    expect(data.leaveDays).toBe(3);
  });

  it('rejects end date before start date', async () => {
    const { data } = await POST('/common/LeaveRequests', {}, alice);
    await PATCH(
      draft(data.ID),
      { ...validData, startDate: '2026-12-05', endDate: '2026-12-01' },
      alice,
    );
    await expect(POST(`${draft(data.ID)}/CommonService.draftActivate`, {}, alice)).rejects.toThrow(
      /400/,
    );
  });

  it('submits, starts workflow and applies approval', async () => {
    const id = await createActiveRequest();
    await POST(`${active(id)}/CommonService.submit`, {}, alice);

    const pending = await waitForStatus(id, 'PENDING_APPROVAL');
    expect(pending.bpaProcessInstanceId).toMatch(/^MOCK-/);

    await POST(
      '/workflow/updateApprovalResult',
      {
        leaveRequestId: id,
        decision: 'APPROVED',
        approverEmail: 'manager@example.com',
        comment: 'OK',
      },
      bpa,
    );

    const { data } = await GET(`${active(id)}/history`, alice);
    expect(data.value.map((h: { action: string }) => h.action)).toEqual(
      expect.arrayContaining(['SUBMITTED', 'WORKFLOW_STARTED', 'APPROVED']),
    );
  });

  it('blocks submitting twice', async () => {
    const id = await createActiveRequest();
    await POST(`${active(id)}/CommonService.submit`, {}, alice);
    await expect(POST(`${active(id)}/CommonService.submit`, {}, alice)).rejects.toThrow(/409/);
  });

  it('forbids non-approver from calling the callback', async () => {
    await expect(
      POST(
        '/workflow/updateApprovalResult',
        { leaveRequestId: cds.utils.uuid(), decision: 'APPROVED' },
        alice,
      ),
    ).rejects.toThrow(/403/);
  });
});
