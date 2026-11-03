import cds from '@sap/cds';

export default class CommonService extends cds.ApplicationService {
  async init() {
    this.on('ping', () => 'enterprise-app is running');
    return super.init();
  }
}
