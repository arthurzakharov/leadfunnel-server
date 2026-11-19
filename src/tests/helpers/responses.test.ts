import { describe, expect, test } from 'bun:test';
import type { Handler } from 'hono';
import { Hono } from 'hono';
import { msg, msg404, msgOk, msgServerError } from '@/helpers/responses';

const respond = async (handler: Handler, path = '/test', method = 'GET') => {
  const app = new Hono();
  app.on(method, path, handler);
  const res = await app.request(path, { method });
  return { status: res.status, body: await res.json() };
};

describe('msg', () => {
  test('returns { code, status, message } with the given status code', async () => {
    const res = await respond(msg('Gone for good', 410));

    expect(res.status).toBe(410);
    expect(res.body).toEqual({ code: 410, status: 'Gone', message: 'Gone for good' });
  });

  test('defaults to 200 and falls back to the reason phrase without a message', async () => {
    const res = await respond(msg());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: 200, status: 'OK', message: 'OK' });
  });

  test('empty message falls back to the reason phrase', async () => {
    const res = await respond(msg('', 400));

    expect(res.body).toEqual({ code: 400, status: 'Bad Request', message: 'Bad Request' });
  });

  test('message builder receives the request context', async () => {
    const res = await respond(
      msg((c) => `Hello from ${c.req.path}`),
      '/greet'
    );

    expect(res.body.message).toBe('Hello from /greet');
  });

  test('message builder returning empty string falls back to the reason phrase', async () => {
    const res = await respond(msg(() => '', 503));

    expect(res.body.message).toBe('Service Unavailable');
  });
});

describe('shortcuts', () => {
  test('msgOk: 200 with default and custom message', async () => {
    expect((await respond(msgOk())).body).toEqual({ code: 200, status: 'OK', message: 'OK' });
    expect((await respond(msgOk('Server is up'))).body.message).toBe('Server is up');
  });

  test('msg404: default message names method and path', async () => {
    const res = await respond(msg404(), '/missing', 'POST');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 404,
      status: 'Not Found',
      message: 'POST /missing does not exist',
    });
  });

  test('msg404: custom message', async () => {
    expect((await respond(msg404('No case'))).body.message).toBe('No case');
  });

  test('msgServerError: 500 with default and custom message', async () => {
    const res = await respond(msgServerError());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: 500,
      status: 'Internal Server Error',
      message: 'Internal Server Error',
    });
    expect((await respond(msgServerError('Oops'))).body.message).toBe('Oops');
  });
});
