import { describe, expect, test } from 'bun:test';
import {
  caseIdParam,
  caseStandardFieldsQuery,
  customerIdParam,
  customerStandardFieldsQuery,
  customFieldsQuery,
  externalIdParam,
} from '@/modules/iusta/iusta.schemas';

describe('path params', () => {
  test.each(['1', '123', '000123', '123456789012345678'])('accepts numeric id %p', (id) => {
    expect(caseIdParam.safeParse({ caseId: id }).success).toBe(true);
    expect(customerIdParam.safeParse({ customerId: id }).success).toBe(true);
  });

  test.each([
    'abc',
    '-1',
    '1.5',
    '1e3',
    '',
    ' 1',
    '1?filter=x',
    '../Users',
    '1/../Users',
    '1234567890123456789',
  ])('rejects %p', (id) => {
    const result = caseIdParam.safeParse({ caseId: id });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('caseId must be a positive integer');
  });

  test('externalId is trimmed and length-limited', () => {
    expect(externalIdParam.parse({ externalId: '  abc-123  ' })).toEqual({ externalId: 'abc-123' });
    expect(externalIdParam.safeParse({ externalId: '   ' }).success).toBe(false);
    expect(externalIdParam.safeParse({ externalId: 'x'.repeat(256) }).success).toBe(false);
    expect(externalIdParam.safeParse({ externalId: 'x'.repeat(255) }).success).toBe(true);
  });
});

describe('fields query (CSV enum)', () => {
  test('missing or empty means "all fields"', () => {
    expect(caseStandardFieldsQuery.parse({})).toEqual({ fields: [] });
    expect(caseStandardFieldsQuery.parse({ fields: '' })).toEqual({ fields: [] });
  });

  test('splits, trims and drops empty entries', () => {
    expect(caseStandardFieldsQuery.parse({ fields: ' id , customerId,, ' })).toEqual({
      fields: ['id', 'customerId'],
    });
  });

  test('only allows fields of the matching entity', () => {
    expect(customerStandardFieldsQuery.safeParse({ fields: 'iban' }).success).toBe(true);
    expect(caseStandardFieldsQuery.safeParse({ fields: 'iban' }).success).toBe(false);
    expect(caseStandardFieldsQuery.safeParse({ fields: 'id,unknown' }).success).toBe(false);
  });
});

describe('custom fields query', () => {
  test('parses ids to numbers and removes duplicates', () => {
    expect(customFieldsQuery.parse({ ids: ' 3 ,1,,3,2', fields: 'value' })).toEqual({
      ids: [3, 1, 2],
      fields: ['value'],
    });
  });

  test('missing ids means no id filter', () => {
    expect(customFieldsQuery.parse({})).toEqual({ ids: [], fields: [] });
  });

  test.each(['abc', '1,-2', '1e3', '0x10', '1.5', '1234567890123456'])('rejects ids=%p', (ids) => {
    const result = customFieldsQuery.safeParse({ ids });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('each id must be a positive integer');
  });

  test('limits the number of ids to 100', () => {
    const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(',');
    expect(customFieldsQuery.safeParse({ ids: ids(100) }).success).toBe(true);

    const tooMany = customFieldsQuery.safeParse({ ids: ids(101) });
    expect(tooMany.success).toBe(false);
    expect(tooMany.error?.issues[0]?.message).toBe('at most 100 ids are allowed');
  });
});
