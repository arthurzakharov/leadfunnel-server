import type { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaCaseNotFoundError, IustaDuplicateCaseError } from '@/modules/iusta/iusta.errors';
import { IUSTA_CUSTOM_FIELD_IDS } from '@/modules/iusta/iusta.fields';
import type {
  IustaCaseStandardFieldKeys,
  IustaCaseStandardFields,
  IustaCustomerStandardFieldKeys,
  IustaCustomerStandardFields,
  IustaCustomField,
  IustaCustomFieldKeys,
} from '@/modules/iusta/iusta.types';

export interface IustaResolvedIds {
  caseId: string;
  customerId: string | null;
}

/**
 * Domain layer for Iusta: orchestrates client calls and owns business rules
 * (which custom field holds the external ID, what "not found" means, etc.).
 */
export class IustaService {
  constructor(private readonly client: IustaClient) {}

  // --- Main entry point to deal with Iusta ---

  private async findCaseIdByExternalId(externalId: string) {
    const result = await this.client.findCustomFieldValues(
      {
        customFieldId: IUSTA_CUSTOM_FIELD_IDS.CASE_EXTERNAL_ID,
        value: externalId,
        referenceType: 'Case',
      },
      ['referenceId'],
      `Error finding Iusta case by externalId ${externalId}`
    );

    if (!result || result.length === 0) {
      throw new IustaCaseNotFoundError(externalId);
    }

    const caseIds = [...new Set(result.map(({ referenceId }) => String(referenceId)))];

    if (caseIds.length > 1) {
      throw new IustaDuplicateCaseError(externalId, caseIds);
    }

    return { caseId: caseIds[0] };
  }

  public async resolveIdsByExternalId(externalId: string): Promise<IustaResolvedIds> {
    const { caseId } = await this.findCaseIdByExternalId(externalId);

    const { customerId } = await this.client.getCaseStandardFields(caseId, ['customerId']);

    return {
      caseId,
      customerId: customerId != null ? String(customerId) : null,
    };
  }

  // The methods below expose field selection chosen at request time (`?fields=`), so the
  // compile-time type can only promise a subset of the entity: hence `Partial<…>`.

  // --- Case ---

  public getCaseStandardFields(
    caseId: string,
    fields: IustaCaseStandardFieldKeys[] = []
  ): Promise<Partial<IustaCaseStandardFields>> {
    return this.client.getCaseStandardFields(caseId, fields);
  }

  public getCaseCustomFields(
    caseId: string,
    ids: number[] = [],
    fields: IustaCustomFieldKeys[] = []
  ): Promise<Partial<IustaCustomField>[]> {
    return this.client.getCaseCustomFields(caseId, ids, fields);
  }

  // --- Customer ---

  public getCustomerStandardFields(
    customerId: string,
    fields: IustaCustomerStandardFieldKeys[] = []
  ): Promise<Partial<IustaCustomerStandardFields>> {
    return this.client.getCustomerStandardFields(customerId, fields);
  }

  public getCustomerCustomFields(
    customerId: string,
    ids: number[] = [],
    fields: IustaCustomFieldKeys[] = []
  ): Promise<Partial<IustaCustomField>[]> {
    return this.client.getCustomerCustomFields(customerId, ids, fields);
  }
}
