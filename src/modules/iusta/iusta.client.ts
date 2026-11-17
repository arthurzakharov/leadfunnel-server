import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { createHttpClient } from '@/helpers/axios';
import { IustaApiError } from '@/modules/iusta/iusta.errors';
import type {
  IustaCaseStandardFieldKeys,
  IustaCaseStandardFields,
  IustaCustomerStandardFieldKeys,
  IustaCustomerStandardFields,
  IustaCustomField,
  IustaCustomFieldKeys,
  IustaSelected,
} from '@/modules/iusta/iusta.types';

/**
 * Thin transport layer over the Iusta REST API: one method per upstream endpoint,
 * no business rules. Domain workflows live in `IustaService`.
 */
export class IustaClient {
  private readonly http: AxiosInstance;

  constructor(apiUrl: string, apiToken: string) {
    this.http = createHttpClient(apiUrl, { authorization: apiToken });
  }

  // --- Requests helpers ---

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

  private toFieldsMap(fields: readonly string[]): Record<string, true> {
    return Object.fromEntries(fields.map((field) => [field, true]));
  }

  private buildStandardFieldsParams(standardFields: readonly string[]): Record<string, unknown> {
    return standardFields.length > 0
      ? { filter: { fields: this.toFieldsMap(standardFields) } }
      : {};
  }

  private buildCustomFieldParams(
    customFields: readonly number[] = [],
    fields: readonly string[] = []
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (customFields.length > 0) {
      filter.where = { customFieldId: { inq: customFields } };
    }

    if (fields.length > 0) {
      filter.fields = this.toFieldsMap(fields);
    }

    return Object.keys(filter).length > 0 ? { filter } : {};
  }

  // --- Custom Field Values (cross-entity) ---
  // Read methods are generic over the requested `fields`: passing ['customerId'] types the
  // result as Pick<…, 'customerId'>; passing nothing types it as the full entity.

  public async findCustomFieldValues<K extends IustaCustomFieldKeys = never>(
    where: Record<string, unknown>,
    fields: readonly K[] = [],
    errorContext = 'Error querying Iusta custom field values'
  ) {
    const filter = fields.length > 0 ? { where, fields: this.toFieldsMap(fields) } : { where };

    return this.get<IustaSelected<IustaCustomField, K>[]>(
      '/CustomFieldValues',
      { filter },
      errorContext
    );
  }

  // --- Case Read Methods ---

  public async getCaseStandardFields<K extends IustaCaseStandardFieldKeys = never>(
    caseId: string,
    caseStandardFields: readonly K[] = []
  ) {
    const url = `/Cases/${encodeURIComponent(caseId)}`;
    const params = this.buildStandardFieldsParams(caseStandardFields);
    const error = `Error fetching Iusta case standard fields for caseId: ${caseId}`;

    return this.get<IustaSelected<IustaCaseStandardFields, K>>(url, params, error);
  }

  public async getCaseCustomFields<K extends IustaCustomFieldKeys = never>(
    caseId: string,
    caseCustomFields: readonly number[] = [],
    fields: readonly K[] = []
  ) {
    const url = `/Cases/${encodeURIComponent(caseId)}/CustomFieldValues`;
    const params = this.buildCustomFieldParams(caseCustomFields, fields);
    const error = `Error fetching Iusta case custom fields for caseId: ${caseId}`;

    return this.get<IustaSelected<IustaCustomField, K>[]>(url, params, error);
  }

  // --- Customer Read Methods ---

  public async getCustomerStandardFields<K extends IustaCustomerStandardFieldKeys = never>(
    customerId: string,
    customerStandardFields: readonly K[] = []
  ) {
    const url = `/Customers/${encodeURIComponent(customerId)}`;
    const params = this.buildStandardFieldsParams(customerStandardFields);
    const error = `Error fetching Iusta customer ${customerId}`;

    return this.get<IustaSelected<IustaCustomerStandardFields, K>>(url, params, error);
  }

  public async getCustomerCustomFields<K extends IustaCustomFieldKeys = never>(
    customerId: string,
    customerCustomFields: readonly number[] = [],
    fields: readonly K[] = []
  ) {
    const url = `/Customers/${encodeURIComponent(customerId)}/CustomFieldValues`;
    const params = this.buildCustomFieldParams(customerCustomFields, fields);
    const error = `Error fetching Iusta customer ${customerId} custom field values`;

    return this.get<IustaSelected<IustaCustomField, K>[]>(url, params, error);
  }
}
