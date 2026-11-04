namespace enterprise.common;

using {
    cuid,
    managed
} from '@sap/cds/common';
using {enterprise.common.LeaveTypes} from './code-lists';
using {
    enterprise.common.WorkflowEnabled,
    enterprise.common.BusinessObject
} from './aspects';


entity LeaveRequests : BusinessObject, WorkflowEnabled {
    employeeId         : String(30)  @mandatory;
    employeeName       : String(100) @mandatory;
    employeeEmail      : String(255) @mandatory;
    managerEmail       : String(255) @mandatory;
    seniorManagerEmail : String(255);
    leaveType_code     : String(20)  @mandatory;
    leaveType          : Association to LeaveTypes
                             on leaveType.code = leaveType_code;
    startDate          : Date        @mandatory;
    endDate            : Date        @mandatory;
    leaveDays          : Integer;
    reason             : String(500);
    history            : Association to many ApprovalHistory
                             on history.request = $self;
}

entity ApprovalHistory : cuid, managed {
    request     : Association to LeaveRequests;
    action      : String(30);
    actor       : String(255);
    comment     : String(500);
    processStep : String(50);
    actionDate  : Timestamp;
}
