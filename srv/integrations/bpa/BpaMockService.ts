import cds from '@sap/cds';
import type { LeaveRequest } from '#cds-models/enterprise/common';
import { LeaveRequestService } from '../../services/common/LeaveRequestService.js';

// development/test: simulates BPA accepting the trigger.
export default class BpaMockService extends cds.Service {
  async init() {
    const leave = new LeaveRequestService();

    this.on('startApproval', async (req) => {
      const request = req.data as LeaveRequest;
      if (!request.ID) throw new Error('startApproval message has no request ID.');

      await leave.markWorkflowStarted(request.ID, `MOCK-${cds.utils.uuid()}`, 'mock');
    });

    return super.init();
  }
}
