import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { msg, msgServerError } from '@/helpers/responses';

// --- Helper functions ---

// Collapse multi-line messages (e.g. z.prettifyError) into one line
const removeLinesAndTabs = (v: string) => {
  return v.replace(/\s*\n\s*/g, ' ');
};

// --- Main error handler for application ---

export const errorHandler: ErrorHandler = (error, context) => {
  // --- Intentional errors: AppError subclasses and Hono's own HTTPException ---

  if (error instanceof HTTPException) {
    const { res, name, message, status } = error;

    if (status < 500) {
      // 4xx are expected outcomes: one short line, no stack
      const { method, path } = context.req;

      console.warn(`${method} ${path} → ${status} ${name}: ${removeLinesAndTabs(message)}`);
    } else {
      // 5xx are server-side failures: log in full with stack and cause
      console.error(error);
    }

    // Ready-made res (e.g. bearerAuth) as is, otherwise standard JSON (all our AppErrors)
    return res || msg(message, status)(context);
  }

  // --- Not expected errors. Client gets only a generic error message ---

  console.error(error);
  return msgServerError()(context);
};
