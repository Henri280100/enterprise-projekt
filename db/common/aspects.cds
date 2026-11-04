namespace enterprise.common;

using {
    cuid,
    managed
} from '@sap/cds/common';
using {enterprise.common.Statuses} from './code-lists';

aspect BusinessObject : cuid, managed {
    status_code   : String(30) default 'NEW';
    status        : Association to Statuses
                        on status.code = status_code;
    correlationId : String(100);
    errorMessage  : String(100)
}

aspect WorkflowEnabled {
    bpaProcessInstanceId : String(100);
    approverEmail        : String(255);
    approverComment      : String(500);
    decisionDate         : Timestamp
}
