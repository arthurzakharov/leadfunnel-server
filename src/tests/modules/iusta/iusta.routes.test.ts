import { beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaApiError, IustaCaseNotFoundError } from '@/modules/iusta/iusta.errors';
import { createIustaRoutes } from '@/modules/iusta/iusta.routes';
import { IustaService } from '@/modules/iusta/iusta.service';

// Routes are tested in isolation with a stubbed service: this covers HTTP concerns only
// (validation, status codes, wiring of params/query into service calls).
const service = new IustaService(new IustaClient('http://iusta.invalid', 'x'));
const routes = createIustaRoutes(service);

const spies = {
  resolveIdsByExternalId: spyOn(service, 'resolveIdsByExternalId'),
  getCaseStandardFields: spyOn(service, 'getCaseStandardFields'),
  getCaseCustomFields: spyOn(service, 'getCaseCustomFields'),
  getCustomerStandardFields: spyOn(service, 'getCustomerStandardFields'),
  getCustomerCustomFields: spyOn(service, 'getCustomerCustomFields'),
};

beforeEach(() => {
  for (const spy of Object.values(spies)) {
    spy.mockReset();
  }
});

describe('GET /cases/by-external-id/:externalId', () => {
  test('returns resolved ids', async () => {
    spies.resolveIdsByExternalId.mockResolvedValue({ caseId: '42', customerId: null });

    const res = await routes.request('/cases/by-external-id/ext-1');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ caseId: '42', customerId: null });
    expect(spies.resolveIdsByExternalId).toHaveBeenCalledWith('ext-1');
  });

  test('propagates domain errors with their status', async () => {
    spies.resolveIdsByExternalId.mockRejectedValue(new IustaCaseNotFoundError('ext-1'));

    const res = await routes.request('/cases/by-external-id/ext-1');

    expect(res.status).toBe(404);
  });
});

describe('standard fields routes', () => {
  test('passes parsed fields to the service', async () => {
    spies.getCaseStandardFields.mockResolvedValue({ id: 1 });

    const res = await routes.request('/cases/123/standard-fields?fields=id,customerId');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1 });
    expect(spies.getCaseStandardFields).toHaveBeenCalledWith('123', ['id', 'customerId']);
  });

  test('customer route uses customer fields', async () => {
    spies.getCustomerStandardFields.mockResolvedValue({ email: 'a@b.c' });

    const res = await routes.request('/customers/7/standard-fields?fields=email');

    expect(res.status).toBe(200);
    expect(spies.getCustomerStandardFields).toHaveBeenCalledWith('7', ['email']);
  });

  test('rejects fields that do not belong to the entity', async () => {
    const res = await routes.request('/cases/123/standard-fields?fields=iban');

    expect(res.status).toBe(400);
    expect(spies.getCaseStandardFields).not.toHaveBeenCalled();
  });

  test('maps upstream auth failures to 502', async () => {
    spies.getCaseStandardFields.mockRejectedValue(new IustaApiError(401, 'bad token'));

    const res = await routes.request('/cases/123/standard-fields');

    expect(res.status).toBe(502);
  });
});

describe('custom fields routes', () => {
  test('passes parsed ids and fields to the service', async () => {
    spies.getCaseCustomFields.mockResolvedValue([]);
    spies.getCustomerCustomFields.mockResolvedValue([]);

    await routes.request('/cases/1/custom-fields?ids=3,1,3&fields=value');
    await routes.request('/customers/7/custom-fields');

    expect(spies.getCaseCustomFields).toHaveBeenCalledWith('1', [3, 1], ['value']);
    expect(spies.getCustomerCustomFields).toHaveBeenCalledWith('7', [], []);
  });

  test('rejects non-numeric ids', async () => {
    const res = await routes.request('/cases/1/custom-fields?ids=abc');

    expect(res.status).toBe(400);
    expect(spies.getCaseCustomFields).not.toHaveBeenCalled();
  });
});

describe('path param validation', () => {
  test.each([
    '/cases/abc/standard-fields',
    '/cases/-1/custom-fields',
    '/cases/1%3Ffilter=x/standard-fields',
    '/cases/%2E%2E%2FUsers/standard-fields',
    '/customers/1%2F..%2FUsers/custom-fields',
  ])('rejects %p before reaching the service', async (path) => {
    const res = await routes.request(path);

    expect(res.status).toBe(400);
    for (const spy of Object.values(spies)) {
      expect(spy).not.toHaveBeenCalled();
    }
  });
});
