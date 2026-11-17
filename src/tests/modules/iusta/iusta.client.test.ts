import { afterAll, afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { IustaClient } from '@/modules/iusta/iusta.client';
import {
  IustaApiError,
  IustaNetworkError,
  IustaResponseValidationError,
} from '@/modules/iusta/iusta.errors';

// A real local HTTP server stands in for Iusta, so these tests cover the whole transport:
// URL building, filter serialisation, headers and error mapping.

interface RecordedRequest {
  method: string;
  path: string;
  filter: unknown;
  authorization: string | null;
}

let requests: RecordedRequest[] = [];
let nextResponse: () => Response = () => Response.json({});

const upstream = Bun.serve({
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter');
    requests.push({
      method: req.method,
      path: url.pathname,
      filter: filter ? JSON.parse(filter) : undefined,
      authorization: req.headers.get('authorization'),
    });
    return nextResponse();
  },
});

// No backoff delay in tests; retry behaviour itself is covered below.
const client = new IustaClient(upstream.url.origin, 'test-token', {
  retryBaseDelayMs: 0,
  responseValidation: 'off',
});

/** Responds with each given response in turn, repeating the last one. */
const respondInSequence = (...responses: (() => Response)[]) => {
  let call = 0;
  nextResponse = () => (responses[Math.min(call++, responses.length - 1)] as () => Response)();
};

/** URL of a port that nothing listens on, to simulate Iusta being unreachable. */
const deadUrl = () => {
  const dead = Bun.serve({ port: 0, fetch: () => new Response() });
  const url = dead.url.origin;
  dead.stop(true);
  return url;
};

let warn: ReturnType<typeof spyOn<Console, 'warn'>>;

beforeEach(() => {
  requests = [];
  nextResponse = () => Response.json({});
  warn = spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

afterAll(() => upstream.stop(true));

describe('request building', () => {
  test('sends the API token as authorization header', async () => {
    await client.getCaseStandardFields('1');
    expect(requests[0]?.authorization).toBe('test-token');
  });

  test('getCaseStandardFields without fields sends no filter', async () => {
    nextResponse = () => Response.json({ id: 1, customerId: 7 });

    expect(await client.getCaseStandardFields('1')).toEqual({ id: 1, customerId: 7 } as never);
    expect(requests).toEqual([
      { method: 'GET', path: '/Cases/1', filter: undefined, authorization: 'test-token' },
    ]);
  });

  test('getCaseStandardFields with fields sends a fields filter', async () => {
    await client.getCaseStandardFields('1', ['id', 'customerId']);
    expect(requests[0]?.filter).toEqual({ fields: { id: true, customerId: true } });
  });

  test('getCustomerStandardFields hits /Customers/:id', async () => {
    await client.getCustomerStandardFields('7', ['email']);
    expect(requests[0]).toMatchObject({
      path: '/Customers/7',
      filter: { fields: { email: true } },
    });
  });

  test('custom field reads combine id and field filters', async () => {
    nextResponse = () => Response.json([]);

    await client.getCaseCustomFields('1', [10, 20], ['value']);
    await client.getCustomerCustomFields('7', [30]);
    await client.getCaseCustomFields('1');

    expect(requests.map(({ path, filter }) => ({ path, filter }))).toEqual([
      {
        path: '/Cases/1/CustomFieldValues',
        filter: { where: { customFieldId: { inq: [10, 20] } }, fields: { value: true } },
      },
      {
        path: '/Customers/7/CustomFieldValues',
        filter: { where: { customFieldId: { inq: [30] } } },
      },
      { path: '/Cases/1/CustomFieldValues', filter: undefined },
    ]);
  });

  test('findCustomFieldValues queries the cross-entity endpoint', async () => {
    nextResponse = () => Response.json([{ referenceId: 42 }]);

    const result = await client.findCustomFieldValues({ customFieldId: 1, value: 'x' }, [
      'referenceId',
    ]);

    expect(result).toEqual([{ referenceId: 42 }]);
    expect(requests[0]).toMatchObject({
      path: '/CustomFieldValues',
      filter: { where: { customFieldId: 1, value: 'x' }, fields: { referenceId: true } },
    });
  });

  test('encodes path segments as a second line of defence', async () => {
    await client.getCaseStandardFields('1/../Users');
    expect(requests[0]?.path).toBe('/Cases/1%2F..%2FUsers');
  });
});

describe('error handling', () => {
  test('wraps upstream errors in IustaApiError with context', async () => {
    nextResponse = () => Response.json({ error: 'nope' }, { status: 404 });

    const error = await client.getCaseStandardFields('99').catch((e) => e);

    expect(error).toBeInstanceOf(IustaApiError);
    expect(error.status).toBe(404);
    expect(error.upstreamStatus).toBe(404);
    expect(error.responseBody).toBe('{"error":"nope"}');
    expect(error.message).toBe(
      'Error fetching Iusta case standard fields for caseId: 99 (upstream status 404)'
    );
  });

  test('keeps plain-text upstream bodies as-is', async () => {
    nextResponse = () => new Response('Internal failure', { status: 500 });

    const error = await client.getCustomerStandardFields('1').catch((e) => e);

    expect(error).toBeInstanceOf(IustaApiError);
    expect(error.status).toBe(502);
    expect(error.responseBody).toBe('Internal failure');
  });

  test('wraps network errors in IustaNetworkError (502) without leaking details', async () => {
    const error = await new IustaClient(deadUrl(), 'secret-token', { retries: 0 })
      .getCaseStandardFields('1')
      .catch((e) => e);

    expect(error).toBeInstanceOf(IustaNetworkError);
    expect(error.status).toBe(502);
    expect(error.code).toBe('ECONNREFUSED');
    expect(error.timedOut).toBe(false);
    expect(error.message).toBe(
      'Error fetching Iusta case standard fields for caseId: 1 (Iusta unreachable: ECONNREFUSED)'
    );
    expect(error.cause).toBeUndefined();
    expect(Bun.inspect(error)).not.toContain('secret-token');
    expect(error.message).not.toContain('127.0.0.1');
  });

  test('maps timeouts to IustaNetworkError (504)', async () => {
    const slow = Bun.serve({
      port: 0,
      fetch: async () => {
        await Bun.sleep(200);
        return Response.json({});
      },
    });
    const slowClient = new IustaClient(slow.url.origin, 'x', { timeoutMs: 20 });

    const error = await slowClient.getCaseStandardFields('1').catch((e) => e);
    slow.stop(true);

    expect(error).toBeInstanceOf(IustaNetworkError);
    expect(error.status).toBe(504);
    expect(error.timedOut).toBe(true);
    expect(error.message).toContain('(Iusta timed out)');
  });
});

describe('retries', () => {
  test('retries a GET after a 5xx and returns the later success', async () => {
    respondInSequence(
      () => new Response('down', { status: 503 }),
      () => Response.json({ id: 1 })
    );

    expect(await client.getCaseStandardFields('1')).toEqual({ id: 1 } as never);
    expect(requests).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('gives up after 2 retries (3 attempts) and throws the last error', async () => {
    nextResponse = () => new Response('still down', { status: 500 });

    const error = await client.getCaseStandardFields('1').catch((e) => e);

    expect(error).toBeInstanceOf(IustaApiError);
    expect(error.status).toBe(502);
    expect(requests).toHaveLength(3);
  });

  test.each([400, 401, 404, 422])('does not retry a %i', async (status) => {
    nextResponse = () => new Response('', { status });

    await client.getCaseStandardFields('1').catch(() => {});

    expect(requests).toHaveLength(1);
  });

  test('retries network errors, then throws IustaNetworkError', async () => {
    const unreachable = new IustaClient(deadUrl(), 'x', { retryBaseDelayMs: 0 });

    const error = await unreachable.getCaseStandardFields('1').catch((e) => e);

    expect(error).toBeInstanceOf(IustaNetworkError);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  test('does not retry timeouts (each attempt already waited the full timeout)', async () => {
    let calls = 0;
    const slow = Bun.serve({
      port: 0,
      fetch: async () => {
        calls++;
        await Bun.sleep(200);
        return Response.json({});
      },
    });
    const slowClient = new IustaClient(slow.url.origin, 'x', { timeoutMs: 20 });

    await slowClient.getCaseStandardFields('1').catch(() => {});
    slow.stop(true);

    expect(calls).toBe(1);
  });

  test('never retries non-idempotent requests (POST/PUT)', async () => {
    nextResponse = () => new Response('down', { status: 503 });

    // post/put are private (no write endpoints yet); TS only allows bracket access to them.
    // biome-ignore lint/complexity/useLiteralKeys: dot access to a private member fails tsc
    await client['post']('/Cases', {}).catch(() => {});
    // biome-ignore lint/complexity/useLiteralKeys: dot access to a private member fails tsc
    await client['put']('/Cases/1', {}).catch(() => {});

    expect(requests.map((r) => r.method)).toEqual(['POST', 'PUT']);
  });

  test('backs off exponentially between attempts', async () => {
    const sleep = spyOn(Bun, 'sleep');
    const backoffClient = new IustaClient(upstream.url.origin, 'x', { retryBaseDelayMs: 1 });
    nextResponse = () => new Response('down', { status: 500 });

    await backoffClient.getCaseStandardFields('1').catch(() => {});

    expect(sleep.mock.calls).toEqual([[1], [2]]);
    sleep.mockRestore();
  });
});

describe('response validation', () => {
  const validCase = {
    status: 1,
    number: 'A-1',
    name: null,
    private: false,
    closedAt: null,
    invoicingContactId: null,
    invoicingContactId2: null,
    invoicingContactId3: null,
    invoiceUuids: null,
    comment: null,
    id: 1,
    customerId: 7,
    assignedUserId: null,
    closedBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    createdBy: 1,
    updatedBy: 1,
    permissionSetId: 1,
    caseGroupId: 1,
  };

  const clientWith = (responseValidation: 'warn' | 'strict' | 'off') =>
    new IustaClient(upstream.url.origin, 'x', { retryBaseDelayMs: 0, responseValidation });

  test('a valid full entity passes silently', async () => {
    nextResponse = () => Response.json(validCase);

    expect(await clientWith('strict').getCaseStandardFields('1')).toEqual(validCase);
    expect(warn).not.toHaveBeenCalled();
  });

  test('only the requested fields are expected', async () => {
    nextResponse = () => Response.json({ customerId: null });

    await clientWith('strict').getCaseStandardFields('1', ['customerId']);

    expect(warn).not.toHaveBeenCalled();
  });

  test('custom field arrays are validated per item', async () => {
    nextResponse = () => Response.json([{ referenceId: 1 }, { referenceId: '2' }]);

    const error = await clientWith('strict')
      .findCustomFieldValues({}, ['referenceId'])
      .catch((e) => e);

    expect(error).toBeInstanceOf(IustaResponseValidationError);
    expect(error.details).toContain('[1].referenceId');
  });

  test("'warn': logs the mismatch once and returns the data unchanged", async () => {
    const body = { ...validCase, createdBy: null, extra: 'kept' };
    nextResponse = () => Response.json(body);

    expect(await clientWith('warn').getCaseStandardFields('1')).toEqual(body as never);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      'Iusta GET /Cases/1 returned an unexpected response format: ' +
        '✖ Invalid input: expected number, received null → at createdBy'
    );
  });

  test("'strict': throws IustaResponseValidationError (502), no retry", async () => {
    nextResponse = () => Response.json({ email: 12345 });

    const error = await clientWith('strict')
      .getCustomerStandardFields('7', ['email'])
      .catch((e) => e);

    expect(error).toBeInstanceOf(IustaResponseValidationError);
    expect(error.status).toBe(502);
    expect(error.message).toBe(
      'Error fetching Iusta customer 7 (unexpected Iusta response format)'
    );
    expect(error.details).toContain('→ at email');
    expect(requests).toHaveLength(1);
  });

  test("'off': skips validation entirely", async () => {
    nextResponse = () => Response.json({ id: 'not-a-number' });

    expect(await clientWith('off').getCaseStandardFields('1')).toEqual({
      id: 'not-a-number',
    } as never);
    expect(warn).not.toHaveBeenCalled();
  });

  test('never logs the actual (possibly personal) values', async () => {
    const email = ['jane', 'example.com'].join('@');
    nextResponse = () => Response.json({ email: 1, name: email });

    await clientWith('warn').getCustomerStandardFields('7', ['email', 'name']);
    const error = await clientWith('strict')
      .getCustomerStandardFields('7', ['email', 'name'])
      .catch((e) => e);

    expect(warn.mock.calls[0]?.[0]).toContain('→ at email');
    expect(warn.mock.calls[0]?.[0]).not.toContain(email);
    expect(Bun.inspect(error)).not.toContain(email);
  });
});
