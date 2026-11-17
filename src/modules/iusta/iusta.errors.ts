import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError, NotFoundError } from '@/helpers/errors';

export class IustaCaseNotFoundError extends NotFoundError {
  constructor(public readonly externalId: string) {
    super(`No Iusta case found for externalId ${externalId}`);
  }
}

export class IustaApiError extends AppError {
  public readonly upstreamStatus: number;
  public readonly responseBody: string;

  constructor(upstreamStatus: number, responseBody: string, context?: string) {
    const prefix = context ? `${context}: ` : '';
    const message = `${prefix}Request error: ${upstreamStatus} - ${responseBody}`;
    const httpStatus: ContentfulStatusCode =
      upstreamStatus >= 400 && upstreamStatus < 500
        ? (upstreamStatus as ContentfulStatusCode)
        : 502;

    super(httpStatus, message);
    this.upstreamStatus = upstreamStatus;
    this.responseBody = responseBody;
  }

  get isDuplicateEntry(): boolean {
    return this.upstreamStatus === 422 && this.responseBody.includes('ER_DUP_ENTRY');
  }
}
