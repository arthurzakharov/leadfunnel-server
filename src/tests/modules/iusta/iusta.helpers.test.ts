import { describe, expect, test } from 'bun:test';
import { serializeLoopbackParams } from '@/modules/iusta/iusta.helpers';

describe('serializeLoopbackParams', () => {
  test('empty params give an empty query', () => {
    expect(serializeLoopbackParams({})).toBe('');
  });

  test('primitives are stringified', () => {
    expect(serializeLoopbackParams({ a: 'x', b: 1, c: true, d: null })).toBe(
      'a=x&b=1&c=true&d=null'
    );
  });

  test('undefined values are skipped', () => {
    expect(serializeLoopbackParams({ a: undefined, b: 'x' })).toBe('b=x');
  });

  test('objects and arrays are sent as JSON, not bracket notation', () => {
    const filter = { where: { customFieldId: { inq: [10, 20] } }, fields: { value: true } };
    const query = new URLSearchParams(serializeLoopbackParams({ filter, ids: [1, 2] }));

    expect([...query.keys()]).toEqual(['filter', 'ids']);
    expect(JSON.parse(query.get('filter') ?? '')).toEqual(filter);
    expect(JSON.parse(query.get('ids') ?? '')).toEqual([1, 2]);
  });

  test('special characters are URL-encoded', () => {
    expect(serializeLoopbackParams({ q: 'a&b=c d' })).toBe('q=a%26b%3Dc+d');
  });
});
