import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError, NotFoundError } from '@/helpers/errors';
import { redactForLog } from '@/helpers/redact';

export class IustaCaseNotFoundError extends NotFoundError {
  constructor(public readonly externalId: string) {
    super(`No Iusta case found for externalId ${externalId}`);
  }
}

export class IustaDuplicateCaseError extends AppError {
  constructor(
    public readonly externalId: string,
    public readonly caseIds: string[]
  ) {
    super(409, `Multiple Iusta cases found for externalId ${externalId}`);
  }
}

const PASS_THROUGH_STATUSES = new Set<ContentfulStatusCode>([404, 409, 422]);

const toClientStatus = (upstreamStatus: number): ContentfulStatusCode =>
  PASS_THROUGH_STATUSES.has(upstreamStatus as ContentfulStatusCode)
    ? (upstreamStatus as ContentfulStatusCode)
    : 502;

export class IustaApiError extends AppError {
  public readonly upstreamStatus: number;
  public readonly context?: string;
  public readonly responseBodyPreview: string;
  readonly #responseBody: string;

  constructor(upstreamStatus: number, responseBody: string, context?: string) {
    const message = `${context ?? 'Iusta request failed'} (upstream status ${upstreamStatus})`;

    super(toClientStatus(upstreamStatus), message);
    this.upstreamStatus = upstreamStatus;
    this.context = context;
    this.#responseBody = responseBody;
    this.responseBodyPreview = redactForLog(responseBody);
  }

  /** Raw upstream body, for programmatic checks only. Never log it. */
  get responseBody(): string {
    return this.#responseBody;
  }

  get isDuplicateEntry(): boolean {
    return this.upstreamStatus === 422 && this.responseBody.includes('ER_DUP_ENTRY');
  }
}

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT']);

export class IustaNetworkError extends AppError {
  public readonly code?: string;
  public readonly timedOut: boolean;
  public readonly context?: string;

  constructor(code: string | undefined, context?: string) {
    const timedOut = code !== undefined && TIMEOUT_CODES.has(code);
    const reason = timedOut ? 'Iusta timed out' : `Iusta unreachable${code ? `: ${code}` : ''}`;

    super(timedOut ? 504 : 502, `${context ?? 'Iusta request failed'} (${reason})`);
    this.code = code;
    this.timedOut = timedOut;
    this.context = context;
  }
}
