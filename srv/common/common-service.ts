import cds from '@sap/cds';
import registerLeaveRequestHandlers from './handlers/leave-request/index.js';

// Bootstrap only: one register call per feature.
export default class CommonService extends cds.ApplicationService {
  async init() {
    this.on('ping', () => 'enterprise-app is running');

    await registerLeaveRequestHandlers(this);

    return super.init();
  }
}
