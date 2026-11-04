using {enterprise.common as db} from '../../db/schema';

@path    : '/common'
@requires: 'authenticated-user'
service CommonService {

    // Code lists for value helps.
    @readonly
    entity Statuses        as projection on db.Statuses;

    @readonly
    entity LeaveTypes      as projection on db.LeaveTypes;

    // Draft-enabled → Fiori shows Create / Edit / Save out of the box.
    @odata.draft.enabled
    entity LeaveRequests   as projection on db.LeaveRequests
        actions {

            // Bound action: CAP passes the record key in req.params,
            // so no "leaveRequestId" parameter is needed.

            // Enabled only on the saved record with status NEW.
            // "in" = the current LeaveRequest (binding parameter).
            @Core.OperationAvailable: {$edmJson: {$And: [
                {$Eq: [
                    {$Path: 'in/status_code'},
                    'NEW'
                ]},
                {$Path: 'in/IsActiveEntity'}
            ]}}

            // Fiori reloads these after the action → no manual refresh.
            @Common.SideEffects     : {
                TargetProperties: [
                    'in/status_code',
                    'in/leaveDays',
                    'in/correlationId'
                ],
                TargetEntities  : ['in/history']
            }
            action submit() returns LeaveRequests;
        };

    @readonly
    entity ApprovalHistory as projection on db.ApprovalHistory;

    // Health check from Phase 1.
    function ping() returns String;
}

/**
 * Not editable by the user. @readonly on an element only blocks client writes;
 * backend code can still update these fields.
 */
annotate CommonService.LeaveRequests with {
    status_code          @readonly;
    leaveDays            @readonly;
    correlationId        @readonly;
    errorMessage         @readonly;
    bpaProcessInstanceId @readonly;
    approverEmail        @readonly;
    approverComment      @readonly;
    decisionDate         @readonly;
};
