import type cds from '@sap/cds';

/**
 * Business error with an HTTP status.
 * Service classes throw it without knowing CAP requests;
 * handlers translate it into req.reject()
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * - AppError -> clean 4xx with our message
 * - anything else -> rethrow, CAP returns 500 and logs the stack
 */
export function reject(req: cds.Request, error: unknown) {
  if (error instanceof AppError) return req.reject(error.status, error.message);
  throw error;
}
