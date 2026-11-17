import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends HTTPException {
  constructor(
    status: ContentfulStatusCode,
    message: string,
    options?: { cause?: unknown; res?: Response }
  ) {
    super(status, { message, ...options });
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', cause?: unknown) {
    super(404, message, { cause });
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', cause?: unknown) {
    super(400, message, { cause });
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Upstream service error', cause?: unknown) {
    super(502, message, { cause });
  }
}
