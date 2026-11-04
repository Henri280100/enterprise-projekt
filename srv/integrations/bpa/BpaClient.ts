import { assertHttpDestination, getDestination } from '@sap-cloud-sdk/connectivity';
import { executeHttpRequest } from '@sap-cloud-sdk/http-client';
import type { LeaveRequest } from '#cds-models/enterprise/common';
import { DESTINATIONS } from '../../shared/constants/leave.js';

type BpaConfig = { triggerPath: string; apiKey: string; definitionId: string };

export type BpaStartResult = { instanceId: string; definitionId: string };

// Thin HTTP client for the BPA API Trigger; no business rules.
export class BpaClient {
  async startLeaveApproval(request: LeaveRequest): Promise<BpaStartResult> {
    const destination = await getDestination({
      destinationName: DESTINATIONS.BPA,
      useCache: false,
    });

    if (!destination) throw new Error(`Destination ${DESTINATIONS.BPA} not found.`);

    // Narrows Destination -> HttpDestination (url: string).
    // Throws if the destination has no URL, so the outbox retries
    // instead of sending a request to an undefined address
    assertHttpDestination(destination);

    const config = this.readConfig(destination.originalProperties ?? {});

    const response = await executeHttpRequest(destination, {
      method: 'POST',
      url: config.triggerPath,
      headers: { 'api-key': config.apiKey, 'Content-Type': 'application/json' },
      data: {
        definitionId: config.definitionId,
        // Must match BPA data type LeaveRequestContext
        context: {
          leaveRequest: {
            leaveRequestId: request.ID,
            correlationId: request.correlationId,
            employeeId: request.employeeId,
            employeeName: request.employeeName,
            employeeEmail: request.employeeEmail,
            managerEmail: request.managerEmail,
            seniorManagerEmail: request.seniorManagerEmail ?? '',
            leaveType: request.leaveType_code,
            startDate: request.startDate,
            endDate: request.endDate,
            leaveDays: Number(request.leaveDays),
            reason: request.reason ?? '',
          },
        },
      },
    });
    const instanceId = response.data?.id;
    // Throwing lets the outbox retry instead of saving an empty id.
    if (!instanceId) throw new Error('BPA response does not contain a process instance id.');

    return { instanceId, definitionId: config.definitionId };
  }
  // Custom props are nested under destinationConfiguration.
  private readConfig(original: Record<string, unknown>): BpaConfig {
    const props = (original.destinationConfiguration ?? original) as Record<
      string,
      string | undefined
    >;

    const apiKey = props.bpaApiKey;
    const definitionId = props.bpaDefinitionId;
    if (!apiKey || !definitionId)
      throw new Error('BPA destination is missing bpaApiKey or bpaDefinitionId.');

    return {
      triggerPath: props.bpaTriggerPath ?? '/workflow/rest/v1/workflow-instances',
      apiKey,
      definitionId,
    };
  }
}
