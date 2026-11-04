import cds from '@sap/cds';
import { type DecisionInput, LeaveRequestService } from '../services/common/LeaveRequestService.js';
import { reject } from '../shared/errors/AppError.js';

// BPA callback; authorization via @requires: 'Approver'
export default class WorkflowService extends cds.ApplicationService {
  async init() {
    const leave = new LeaveRequestService();

    this.on('updateApprovalResult', async (req) => {
      try {
        return await leave.applyDecision(req.data as DecisionInput);
      } catch (error) {
        return reject(req, error);
      }
    });
    return super.init();
  }
}
