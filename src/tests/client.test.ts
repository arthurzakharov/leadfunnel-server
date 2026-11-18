import { describe, expect, test } from 'bun:test';
import { createApp } from '@/app';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaService } from '@/modules/iusta/iusta.service';
import { createClient, type InferResponseType } from '../../client/src';

const { app } = createApp(
  { corsOrigins: [], internalApiKeys: [] },
  { iustaService: new IustaService(new IustaClient('http://iusta.invalid', 'x')) }
);

const sentRequests: Request[] = [];

const appFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const request = new Request(input, init);
  sentRequests.push(request);
  return app.fetch(request);
};

describe('createClient', () => {
  test('calls public routes with typed responses', async () => {
    const client = createClient('http://server.test', { fetch: appFetch });

    const res = await client.api.v1.ovm.$get();
    const body: InferResponseType<typeof client.api.v1.ovm.$get> = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ code: 200, status: 'OK', message: 'ovm' });
    expect(sentRequests.at(-1)?.url).toBe('http://server.test/api/v1/ovm');
  });

  test('adds the session token as a bearer header', async () => {
    const client = createClient('http://server.test', {
      fetch: appFetch,
      headers: { 'X-Trace': 'abc' },
      getSessionToken: async () => 'session-token',
    });

    await client.api.v1.leadfunnel.$get();

    expect(sentRequests.at(-1)?.headers.get('Authorization')).toBe('Bearer session-token');
    expect(sentRequests.at(-1)?.headers.get('X-Trace')).toBe('abc');
  });

  test('sends no Authorization header without a token', async () => {
    const client = createClient('http://server.test', {
      fetch: appFetch,
      getSessionToken: () => null,
    });

    await client.api.v1.leadfunnel.$get();

    expect(sentRequests.at(-1)?.headers.get('Authorization')).toBeNull();
  });

  test('does not expose internal routes in its type', () => {
    const client = createClient('http://server.test', { fetch: appFetch });

    // @ts-expect-error iusta is internal and must not be part of the public client
    expect(client.api.v1.iusta).toBeDefined();
  });
});
