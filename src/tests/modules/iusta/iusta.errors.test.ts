import { describe, expect, test } from 'bun:test';
import { IustaApiError } from '@/modules/iusta/iusta.errors';

describe('IustaApiError', () => {
  test.each([404, 409, 422])('passes through upstream %i', (upstream) => {
    expect(new IustaApiError(upstream, '').status as number).toBe(upstream);
  });

  test.each([400, 401, 403, 429, 500, 502, 503])('maps upstream %i to 502', (upstream) => {
    const error = new IustaApiError(upstream, '');
    expect(error.status).toBe(502);
    expect(error.upstreamStatus).toBe(upstream);
  });

  test('never exposes the upstream body in the client-facing message', () => {
    const body = '{"error":"ER_DUP_ENTRY: duplicate key for jane@example.com"}';
    const error = new IustaApiError(422, body, 'Error fetching case 1');

    expect(error.message).toBe('Error fetching case 1 (upstream status 422)');
    expect(error.message).not.toContain('ER_DUP_ENTRY');
    expect(error.responseBody).toBe(body);
    expect(error.context).toBe('Error fetching case 1');
  });

  test('uses a generic message without context', () => {
    expect(new IustaApiError(500, 'boom').message).toBe(
      'Iusta request failed (upstream status 500)'
    );
  });

  test('isDuplicateEntry requires a 422 with ER_DUP_ENTRY', () => {
    expect(new IustaApiError(422, 'ER_DUP_ENTRY').isDuplicateEntry).toBe(true);
    expect(new IustaApiError(422, 'other').isDuplicateEntry).toBe(false);
    expect(new IustaApiError(500, 'ER_DUP_ENTRY').isDuplicateEntry).toBe(false);
  });
});
