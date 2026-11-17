import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaApiError } from '@/modules/iusta/iusta.errors';

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

const client = new IustaClient(upstream.url.origin, 'test-token');

beforeEach(() => {
  requests = [];
  nextResponse = () => Response.json({});
});

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

  test('rethrows network errors unchanged (no upstream response)', async () => {
    const dead = Bun.serve({ port: 0, fetch: () => new Response() });
    const deadUrl = dead.url.origin;
    dead.stop(true);

    const error = await new IustaClient(deadUrl, 'x').getCaseStandardFields('1').catch((e) => e);

    expect(error).not.toBeInstanceOf(IustaApiError);
    expect(error).toBeInstanceOf(Error);
  });
});
