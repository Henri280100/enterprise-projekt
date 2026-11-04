import cds from '@sap/cds';
import { LeaveRequestService } from '../../../services/common/LeaveRequestService.js';
import { reject } from '../../../shared/errors/AppError.js';

// Draft entities give an object key; others a plain string.
type Key = { ID: string; IsActiveEntity?: boolean } | string;

// This handlers: extract input -> call service -> map errors.
export default async function registerLeaveRequestHandlers(srv: cds.ApplicationService) {
  const { LeaveRequests } = srv.entities;

  // Persistent outbox: send() stores, delivery happens after commit.
  // If typecheck complains, use cds.outboxed.
  const bpaQueue = cds.queued(await cds.connect.to('bpa'));
  const leave = new LeaveRequestService(bpaQueue);

  // SAVE = draft activation: validate dates, store leave days
  srv.before('SAVE', LeaveRequests, (req) => {
    try {
      req.data.leaveDays = leave.calculateLeaveDays(req.data.startDate, req.data.endDate);
    } catch (error) {
      return reject(req, error);
    }
  });

  // Bound action from the Object Page header.
  srv.on('submit', LeaveRequests, async (req) => {
    const key = req.params[0] as Key;
    const id = typeof key === 'string' ? key : key.ID;

    if (typeof key === 'object' && key.IsActiveEntity === false) {
      return req.reject(409, 'Save the draft before submitting.');
    }

    try {
      return await leave.submit(id);
    } catch (error) {
      return reject(req, error);
    }
  });
}
