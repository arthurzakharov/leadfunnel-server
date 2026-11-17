import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { Hono } from 'hono';
import { errorHandler } from '@/helpers/error-handler';
import { BadGatewayError, BadRequestError, NotFoundError } from '@/helpers/errors';

const appThrowing = (error: Error) => {
  const app = new Hono();
  app.get('/boom', () => {
    throw error;
  });
  app.onError(errorHandler);
  return app;
};

let warn: ReturnType<typeof spyOn<Console, 'warn'>>;
let error: ReturnType<typeof spyOn<Console, 'error'>>;

beforeEach(() => {
  warn = spyOn(console, 'warn').mockImplementation(() => {});
  error = spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  error.mockRestore();
});

describe('errorHandler', () => {
  test('4xx: one concise warning line, no stack trace', async () => {
    const res = await appThrowing(new NotFoundError('No case')).request('/boom');

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 404, status: 'Not Found', message: 'No case' });
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]).toEqual(['GET /boom → 404 NotFoundError: No case']);
  });

  test('4xx: multi-line messages (e.g. Zod) are flattened to one line', async () => {
    await appThrowing(new BadRequestError('✖ bad id\n  → at caseId')).request('/boom');

    expect(warn.mock.calls[0]).toEqual(['GET /boom → 400 BadRequestError: ✖ bad id → at caseId']);
  });

  test('5xx HTTPException: logged in full, message returned', async () => {
    const thrown = new BadGatewayError('Iusta down');
    const res = await appThrowing(thrown).request('/boom');

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ message: 'Iusta down' });
    expect(error).toHaveBeenCalledWith(thrown);
    expect(warn).not.toHaveBeenCalled();
  });

  test('unexpected errors: logged in full, generic 500 for the client', async () => {
    const thrown = new Error('connect ECONNREFUSED 10.0.0.5:443');
    const res = await appThrowing(thrown).request('/boom');

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      code: 500,
      status: 'Internal Server Error',
      message: 'Internal Server Error',
    });
    expect(error).toHaveBeenCalledWith(thrown);
  });
});
