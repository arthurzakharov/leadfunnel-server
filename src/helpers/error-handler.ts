import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { msg, msgServerError } from '@/helpers/responses';

const removeLinesAndTabs = (v: string) => {
  return v.replace(/\s*\n\s*/g, ' ');
};

export const errorHandler: ErrorHandler = (e, c) => {
  // --- Errors we thrown intentionally. Must be instancied from HTTPException ---

  if (e instanceof HTTPException) {
    const { res, name, message, status } = e;

    if (status < 500) {
      // 4xx are expected outcomes we can log in detailed
      const method = c.req.method;
      const path = c.req.path;

      console.warn(`${method} ${path} → ${status} ${name}: ${removeLinesAndTabs(message)}`);
    } else {
      // 5xx are unexpected failures we must log in full
      console.error(e);
    }

    // Our 4xx always handled with msg, 5xx and not our 4xx are handled by res
    return res || msg(message, status)(c);
  }

  // --- Not expected errors. Client gets only a generic error message ---

  console.error(e);
  return msgServerError()(c);
};
