import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { createHttpClient } from '@/helpers/axios';
import { IustaApiError, IustaCaseNotFoundError } from '@/modules/iusta/iusta.errors';
import { IUSTA_FIELDS } from '@/modules/iusta/iusta.fields';
import type {
  FindCaseIdByExternalId,
  IustaCaseStandardFieldKeys,
  IustaCaseStandardFields,
  IustaCustomerStandardFieldKeys,
  IustaCustomerStandardFields,
  IustaCustomField,
  IustaCustomFieldKeys,
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

  private buildStandardFieldsParams(
    standardFields: IustaCaseStandardFieldKeys[] | IustaCustomerStandardFieldKeys[]
  ): Record<string, unknown> {
    return standardFields.length >= 1
      ? {
          filter: {
            fields: Object.fromEntries(standardFields.map((field) => [field, true])),
          },
        }
      : {};
  }

  private buildCustomFieldParams(
    customFields: Array<number | string> = [],
    fields: string[] = []
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (customFields.length > 0) {
      filter.where = { customFieldId: { inq: customFields } };
    }

    if (fields.length > 0) {
      filter.fields = Object.fromEntries(fields.map((field) => [field, true]));
    }

    return Object.keys(filter).length > 0 ? { filter } : {};
  }

  // --- Main entry point to deal with Iusta ---

  private async resolveIdsByExternalId(externalId: string) {
    const { caseId } = await this.findCaseIdByExternalId(externalId);

    const { customerId } = await this.getCaseStandardFields(caseId, ['caseGroupId']);

    return {
      caseId,
      customerId: customerId.toString(),
    };
  }

  private async findCaseIdByExternalId(externalId: string): Promise<FindCaseIdByExternalId> {
    const result = await this.get<IustaCustomField[]>(
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

  // --- Case Read Methods ---

  public async getCaseStandardFields(
    caseId: string,
    caseStandardFields: IustaCaseStandardFieldKeys[] = []
  ) {
    const url = `/Cases/${caseId}`;
    const params = this.buildStandardFieldsParams(caseStandardFields);
    const error = `Error fetching Iusta case standard fields for caseId: ${caseId}`;

    return this.get<IustaCaseStandardFields>(url, params, error);
  }

  public async getCaseCustomFields(
    caseId: string,
    caseCustomFields: Array<number | string> = [],
    fields: IustaCustomFieldKeys[] = []
  ) {
    const url = `/Cases/${caseId}/CustomFieldValues`;
    const params = this.buildCustomFieldParams(caseCustomFields, fields);
    const error = `Error fetching Iusta case custom fields for caseId: ${caseId}`;

    return this.get<IustaCustomField[]>(url, params, error);
  }

  // --- Customer Read Methods ---

  public async getCustomerStandardFields(
    customerId: string,
    customerStandardFields: IustaCustomerStandardFieldKeys[] = []
  ) {
    const url = `/Customers/${customerId}`;
    const params = this.buildStandardFieldsParams(customerStandardFields);
    const error = `Error fetching Iusta customer ${customerId}`;

    return this.get<IustaCustomerStandardFields>(url, params, error);
  }

  public async getCustomerCustomFields(
    customerId: string,
    customerCustomFields: Array<number | string> = [],
    fields: IustaCustomFieldKeys[] = []
  ) {
    const url = `/Customers/${customerId}/CustomFieldValues`;
    const params = this.buildCustomFieldParams(customerCustomFields, fields);
    const error = `Error fetching Iusta customer ${customerId} custom field values`;

    return this.get<IustaCustomField[]>(url, params, error);
  }
}

export const iustaClient = new IustaClient(env.IUSTA_URL, env.IUSTA_TOKEN);
