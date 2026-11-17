import { beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaCaseNotFoundError, IustaDuplicateCaseError } from '@/modules/iusta/iusta.errors';
import { IUSTA_CUSTOM_FIELD_IDS } from '@/modules/iusta/iusta.fields';
import { IustaService } from '@/modules/iusta/iusta.service';

// The client is real but never reaches the network: every method used is stubbed.
const client = new IustaClient('http://iusta.invalid', 'x');
const service = new IustaService(client);

const findCustomFieldValues = spyOn(client, 'findCustomFieldValues');
const getCaseStandardFields = spyOn(client, 'getCaseStandardFields');

const caseRows = (...ids: number[]) => ids.map((referenceId) => ({ referenceId })) as never;

beforeEach(() => {
  findCustomFieldValues.mockReset();
  getCaseStandardFields.mockReset();
  getCaseStandardFields.mockResolvedValue({ customerId: 7 } as never);
});

describe('resolveIdsByExternalId', () => {
  test('looks up the case by the external-id custom field, then its customer', async () => {
    findCustomFieldValues.mockResolvedValue(caseRows(42));

    expect(await service.resolveIdsByExternalId('ext-1')).toEqual({
      caseId: '42',
      customerId: '7',
    });

    expect(findCustomFieldValues).toHaveBeenCalledWith(
      {
        customFieldId: IUSTA_CUSTOM_FIELD_IDS.CASE_EXTERNAL_ID,
        value: 'ext-1',
        referenceType: 'Case',
      },
      ['referenceId'],
      expect.any(String)
    );
    expect(getCaseStandardFields).toHaveBeenCalledWith('42', ['customerId']);
  });

  test('throws IustaCaseNotFoundError when nothing matches', async () => {
    findCustomFieldValues.mockResolvedValue(caseRows());

    const error = await service.resolveIdsByExternalId('missing').catch((e) => e);

    expect(error).toBeInstanceOf(IustaCaseNotFoundError);
    expect(error.status).toBe(404);
    expect(getCaseStandardFields).not.toHaveBeenCalled();
  });

  test('treats the same case listed twice as a single match', async () => {
    findCustomFieldValues.mockResolvedValue(caseRows(42, 42));

    expect(await service.resolveIdsByExternalId('ext-1')).toEqual({
      caseId: '42',
      customerId: '7',
    });
  });

  test('throws IustaDuplicateCaseError when several cases share the external id', async () => {
    findCustomFieldValues.mockResolvedValue(caseRows(42, 43));

    const error = await service.resolveIdsByExternalId('ext-1').catch((e) => e);

    expect(error).toBeInstanceOf(IustaDuplicateCaseError);
    expect(error.status).toBe(409);
    expect(error.caseIds).toEqual(['42', '43']);
    expect(getCaseStandardFields).not.toHaveBeenCalled();
  });

  test('returns customerId null when the case has no customer', async () => {
    findCustomFieldValues.mockResolvedValue(caseRows(42));
    getCaseStandardFields.mockResolvedValue({ customerId: null } as never);

    expect(await service.resolveIdsByExternalId('ext-1')).toEqual({
      caseId: '42',
      customerId: null,
    });
  });
});

describe('read methods', () => {
  test('delegate to the client with ids and fields unchanged', async () => {
    const getCustomerCustomFields = spyOn(client, 'getCustomerCustomFields').mockResolvedValue(
      [] as never
    );

    await service.getCustomerCustomFields('7', [1, 2], ['value']);

    expect(getCustomerCustomFields).toHaveBeenCalledWith('7', [1, 2], ['value']);
  });
});
