import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

type MessageInput = string | ((c: Context) => string);

export const msg =
  (text: MessageInput = 'No message', code: ContentfulStatusCode = StatusCodes.OK) =>
  (c: Context) => {
    const resolvedMessage = typeof text === 'function' ? text(c) : text;
    const status = getReasonPhrase(code);
    return c.json(
      {
        code,
        status,
        message: resolvedMessage || status,
      },
      code
    );
  };

export const msgOk = (message: MessageInput) => msg(message, StatusCodes.OK);

export const msg404 = (message: MessageInput) => msg(message, StatusCodes.NOT_FOUND);

export const msgServerError = (message: MessageInput = 'Internal Server Error') =>
  msg(message, StatusCodes.INTERNAL_SERVER_ERROR);
