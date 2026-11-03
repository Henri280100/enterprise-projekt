namespace enterprise.common;

using {
    cuid,
    managed
} from '@sap/cds/common';

aspect BusinessObject : cuid, managed {
    status        : String(30) default 'NEW';
    correlationId : String(100);
    errorMessage  : String(100)
}

aspect WorkflowEnabled {
    bpaProcessInstanceId : String(100);
    approverEmail        : String(255);
    approverComment      : String(500);
    decisionDate         : Timestamp
}
