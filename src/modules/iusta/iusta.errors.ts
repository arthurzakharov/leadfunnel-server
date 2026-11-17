import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError, NotFoundError } from '@/helpers/errors';

export class IustaCaseNotFoundError extends NotFoundError {
  constructor(public readonly externalId: string) {
    super(`No Iusta case found for externalId ${externalId}`);
  }
}

const PASS_THROUGH_STATUSES = new Set<ContentfulStatusCode>([404, 409, 422]);

const toClientStatus = (upstreamStatus: number): ContentfulStatusCode =>
  PASS_THROUGH_STATUSES.has(upstreamStatus as ContentfulStatusCode)
    ? (upstreamStatus as ContentfulStatusCode)
    : 502;

export class IustaApiError extends AppError {
  public readonly upstreamStatus: number;
  public readonly responseBody: string;
  public readonly context?: string;

  constructor(upstreamStatus: number, responseBody: string, context?: string) {
    const message = `${context ?? 'Iusta request failed'} (upstream status ${upstreamStatus})`;

    super(toClientStatus(upstreamStatus), message);
    this.upstreamStatus = upstreamStatus;
    this.responseBody = responseBody;
    this.context = context;
  }

  get isDuplicateEntry(): boolean {
    return this.upstreamStatus === 422 && this.responseBody.includes('ER_DUP_ENTRY');
  }
}
