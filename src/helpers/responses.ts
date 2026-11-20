import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

// --- Types ---

type MessageInput = string | ((c: Context) => string);

// --- Base factory ---

// Create a response with a message and status.
export const msg =
  (text: MessageInput = '', code: ContentfulStatusCode = StatusCodes.OK) =>
  (c: Context) => {
    const message = typeof text === 'function' ? text(c) : text;
    const status = getReasonPhrase(code);
    return c.json({ code, status, message: message || status }, code);
  };

// --- Shortcuts ---

// Create a response with a message and status of 200.
export const msgOk = (message: MessageInput = 'OK') => {
  return msg(message, StatusCodes.OK);
};

// Create a response with a message about method/path not matched and status of 404.
export const msg404 = (
  message: MessageInput = (c) => `${c.req.method} ${c.req.path} does not exist`
) => {
  return msg(message, StatusCodes.NOT_FOUND);
};

// Create a response with a message about server error and status of 500.
export const msgServerError = (message: MessageInput = 'Internal Server Error') => {
  return msg(message, StatusCodes.INTERNAL_SERVER_ERROR);
};
