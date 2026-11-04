import cds from '@sap/cds';
import type { LeaveRequest } from '#cds-models/enterprise/common';
import { LeaveRequestService } from '../../services/common/LeaveRequestService.js';
import { BpaClient } from './BpaClient.js';

export default class BpaService extends cds.Service {
  async init() {
    const client = new BpaClient();
    const leave = new LeaveRequestService();

    this.on('startApproval', async (req) => {
      const request = req.data as LeaveRequest;
      if (!request.ID) throw new Error('startApproval message has no request ID.');

      const { instanceId, definitionId } = await client.startLeaveApproval(request);
      await leave.markWorkflowStarted(request.ID, instanceId, definitionId);
    });
    return super.init();
  }
}
