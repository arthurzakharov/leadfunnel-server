import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { createHttpClient } from '@/helpers/axios';
import { IustaApiError, IustaCaseNotFoundError } from '@/modules/iusta/iusta.errors';
import { IUSTA_FIELDS } from '@/modules/iusta/iusta.fields';
import type {
  FindCaseIdByExternalId,
  IustaCaseLookupItem,
  IustaCaseStandardFields,
  IustaCustomerStandardFields,
  IustaCustomFieldValueItem,
  IustaResolvedIds,
} from '@/modules/iusta/iusta.types';

export class IustaClient {
  private readonly http: AxiosInstance;

  constructor(apiUrl: string, apiToken: string) {
    this.http = createHttpClient(apiUrl, { authorization: apiToken });
  }

  private async request<T = unknown>(
    config: AxiosRequestConfig,
    errorContext?: string
  ): Promise<T> {
    try {
      const response = await this.http.request<T>(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const body =
          typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
        throw new IustaApiError(error.response.status, body, errorContext);
      }
      throw error;
    }
  }

  private async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    errorContext?: string
  ): Promise<T> {
    return this.request<T>({ method: 'GET', url, params }, errorContext);
  }

  private async post<T = unknown>(url: string, data?: unknown, errorContext?: string): Promise<T> {
    return this.request<T>({ method: 'POST', url, data }, errorContext);
  }

  private async put<T = unknown>(url: string, data?: unknown, errorContext?: string): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data }, errorContext);
  }

  private buildFieldsProjectionParams(fields: string[]): Record<string, unknown> {
    if (fields.length === 0) {
      return {};
    }
    const projection = Object.fromEntries(fields.map((field) => [field, true]));
    return { filter: { fields: projection } };
  }

  private buildCustomFieldValuesParams(
    customFieldIds: Array<number | string> = [],
    fields: string[] = []
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (customFieldIds.length > 0) {
      filter.where = { customFieldId: { inq: customFieldIds } };
    }
    if (fields.length > 0) {
      filter.fields = Object.fromEntries(fields.map((field) => [field, true]));
    }

    return Object.keys(filter).length > 0 ? { filter } : {};
  }

  // --- Case Read Methods ---

  async findCaseIdByExternalId(externalId: string): Promise<FindCaseIdByExternalId> {
    const result = await this.get<IustaCaseLookupItem[]>(
      '/CustomFieldValues',
      {
        filter: {
          where: {
            customFieldId: IUSTA_FIELDS.EXTERNAL_ID.id,
            value: externalId,
          },
        },
      },
      `Error finding Iusta case by externalId ${externalId}`
    );

    if (!result || result.length === 0) {
      throw new IustaCaseNotFoundError(externalId);
    }

    return {
      caseId: result
        .slice(0, 1)
        .map((c) => c.referenceId)
        .join(),
    };
  }

  async getCaseStandardFieldValues(
    caseId: number | string,
    fields: string[] = []
  ): Promise<IustaCaseStandardFields> {
    return this.get<IustaCaseStandardFields>(
      `/Cases/${caseId}`,
      this.buildFieldsProjectionParams(fields),
      `Error fetching Iusta case ${caseId}`
    );
  }

  async getCaseCustomFieldValues(
    caseId: number | string,
    customFieldIds: Array<number | string> = [],
    fields: string[] = []
  ): Promise<IustaCustomFieldValueItem[]> {
    return this.get<IustaCustomFieldValueItem[]>(
      `/Cases/${caseId}/CustomFieldValues`,
      this.buildCustomFieldValuesParams(customFieldIds, fields),
      `Error fetching Iusta case ${caseId} custom field values`
    );
  }

  // --- Customer Read Methods ---

  async getCustomerStandardFieldValues(
    customerId: number | string,
    fields: string[] = []
  ): Promise<IustaCustomerStandardFields> {
    return this.get<IustaCustomerStandardFields>(
      `/Customers/${customerId}`,
      this.buildFieldsProjectionParams(fields),
      `Error fetching Iusta customer ${customerId}`
    );
  }

  async getCustomerCustomFieldValues(
    customerId: number | string,
    customFieldIds: Array<number | string> = [],
    fields: string[] = []
  ): Promise<IustaCustomFieldValueItem[]> {
    return this.get<IustaCustomFieldValueItem[]>(
      `/Customers/${customerId}/CustomFieldValues`,
      this.buildCustomFieldValuesParams(customFieldIds, fields),
      `Error fetching Iusta customer ${customerId} custom field values`
    );
  }

  async getCustomerCustomFieldValue(
    customerId: number | string,
    fk: number | string
  ): Promise<IustaCustomFieldValueItem> {
    return this.get<IustaCustomFieldValueItem>(
      `/Customers/${customerId}/CustomFieldValues/${fk}`,
      undefined,
      `Error fetching Iusta customer ${customerId} custom field value ${fk}`
    );
  }

  // --- Helpers ---

  async resolveIdsByExternalId(externalId: string): Promise<IustaResolvedIds> {
    const { caseId } = await this.findCaseIdByExternalId(externalId);

    if (caseId === undefined || caseId === null) {
      throw new IustaCaseNotFoundError(externalId);
    }

    const caseData = await this.getCaseStandardFieldValues(caseId, ['customerId']);

    return {
      caseId,
      customerId: caseData.customerId ?? null,
    };
  }
}

export const iustaClient = new IustaClient(env.IUSTA_URL, env.IUSTA_TOKEN);
