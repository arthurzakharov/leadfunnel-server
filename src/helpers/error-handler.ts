import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { msg, msgServerError } from '@/helpers/responses';

// Client errors (4xx) are expected outcomes (validation, not found, …): one concise line.
// Server errors (5xx) and unexpected exceptions are logged in full, with stack trace.
export const errorHandler: ErrorHandler = (e, c) => {
  if (e instanceof HTTPException) {
    if (e.status < 500) {
      const message = e.message.replace(/\s*\n\s*/g, ' ');
      console.warn(`${c.req.method} ${c.req.path} → ${e.status} ${e.name}: ${message}`);
    } else {
      console.error(e);
    }
    return e.res || msg(e.message, e.status)(c);
  }

  console.error(e);
  return msgServerError()(c);
};
