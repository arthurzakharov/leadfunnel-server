import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { msg, msgServerError } from '@/helpers/responses';

// --- Helper functions ---

// Clean tabs and new lines in pretify messages, replacing them with space symbols
const removeLinesAndTabs = (v: string) => {
  return v.replace(/\s*\n\s*/g, ' ');
};

// --- Main error handler for application ---

export const errorHandler: ErrorHandler = (error, context) => {
  // --- Errors we thrown intentionally. Must be instancied from HTTPException ---

  if (error instanceof HTTPException) {
    const { res, name, message, status } = error;

    if (status < 500) {
      // 4xx are expected outcomes we can log in detailed
      const { method, path } = context.req;

      console.warn(`${method} ${path} → ${status} ${name}: ${removeLinesAndTabs(message)}`);
    } else {
      // 5xx are unexpected failures we must log in full
      console.error(error);
    }

    // Our 4xx always handled with msg, 5xx and not our 4xx are handled by res
    return res || msg(message, status)(context);
  }

  // --- Not expected errors. Client gets only a generic error message ---

  console.error(error);
  return msgServerError()(context);
};
