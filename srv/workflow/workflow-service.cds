/**
 * Separate endpoint for BPA → CAP callbacks.
 * Only tokens with the "Approver" scope can call it,
 * so users cannot approve their own requests via the API.
 */
@path    : '/workflow'
@requires: 'Approver'
service WorkflowService {
    action updateApprovalResult(leaveRequestId: UUID,
                                decision: String, // APPROVED | REJECTED
                                approverEmail: String,
                                comment: String,
                                processStep: String) returns String;
}
