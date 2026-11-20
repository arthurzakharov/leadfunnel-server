import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { createHttpClient } from '@/helpers/axios';
import {
  IustaApiError,
  IustaNetworkError,
  IustaResponseValidationError,
} from '@/modules/iusta/iusta.errors';
import { serializeLoopbackParams } from '@/modules/iusta/iusta.helpers';
import {
  type IustaCaseStandardFieldKeys,
  type IustaCaseStandardFields,
  type IustaCustomerStandardFieldKeys,
  type IustaCustomerStandardFields,
  type IustaCustomField,
  type IustaCustomFieldKeys,
  type IustaSelected,
  iustaCaseStandardFieldsSchema,
  iustaCustomerStandardFieldsSchema,
  iustaCustomFieldSchema,
} from '@/modules/iusta/iusta.types';

export interface IustaClientOptions {
  retries?: number;
  retryBaseDelayMs?: number;
  timeoutMs?: number;
  responseValidation?: 'warn' | 'strict' | 'off';
}

interface RequestOptions {
  context?: string;
  schema?: z.ZodType;
}

interface GetOptions extends RequestOptions {
  params?: Record<string, unknown>;
}

export class IustaClient {
  private readonly http: AxiosInstance;
  private readonly retries: number;
  private readonly retryBaseDelayMs: number;
  private readonly responseValidation: NonNullable<IustaClientOptions['responseValidation']>;

  constructor(apiUrl: string, apiToken: string, options: IustaClientOptions = {}) {
    const {
      retries = 2,
      retryBaseDelayMs = 200,
      timeoutMs = 15_000,
      responseValidation = 'warn',
    } = options;
    const headers = { authorization: apiToken };
    const configs = {
      paramsSerializer: { serialize: serializeLoopbackParams },
    };

    this.http = createHttpClient(apiUrl, headers, timeoutMs, configs);
    this.retries = retries;
    this.retryBaseDelayMs = retryBaseDelayMs;
    this.responseValidation = responseValidation;
  }

  // --- Requests helpers ---

  private async request<T = unknown>(
    config: AxiosRequestConfig,
    { context, schema }: RequestOptions = {}
  ): Promise<T> {
    const maxAttempts = config.method === 'GET' ? this.retries + 1 : 1;

    for (let attempt = 1; ; attempt++) {
      try {
        const response = await this.http.request<T>(config);
        this.validateResponse(response.data, schema, config, context);
        return response.data;
      } catch (error) {
        if (error instanceof IustaResponseValidationError) {
          throw error;
        }
        const mapped = this.toIustaError(error, context);

        if (attempt >= maxAttempts || !this.isRetryable(mapped)) {
          throw mapped;
        }

        const delay = this.retryBaseDelayMs * 2 ** (attempt - 1);
        console.warn(
          `Iusta ${config.method} ${config.url} failed (${mapped.message}), ` +
            `retry ${attempt}/${maxAttempts - 1} in ${delay}ms`
        );
        await Bun.sleep(delay);
      }
    }
  }

  private validateResponse(
    data: unknown,
    schema: z.ZodType | undefined,
    config: AxiosRequestConfig,
    context?: string
  ): void {
    if (!schema || this.responseValidation === 'off') {
      return;
    }

    const result = schema.safeParse(data);
    if (result.success) {
      return;
    }

    const details = z.prettifyError(result.error);

    if (this.responseValidation === 'strict') {
      throw new IustaResponseValidationError(details, context);
    }

    console.warn(
      `Iusta ${config.method} ${config.url} returned an unexpected response format: ` +
        details.replace(/\s*\n\s*/g, ' ')
    );
  }

  private toIustaError(error: unknown, errorContext?: string): unknown {
    if (!axios.isAxiosError(error)) {
      return error;
    }
    if (error.response) {
      const body =
        typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data);
      return new IustaApiError(error.response.status, body, errorContext);
    }
    return new IustaNetworkError(error.code, errorContext);
  }

  private isRetryable(error: unknown): error is IustaApiError | IustaNetworkError {
    if (error instanceof IustaApiError) {
      return error.upstreamStatus >= 500;
    }
    if (error instanceof IustaNetworkError) {
      return !error.timedOut;
    }
    return false;
  }

  private async get<T = unknown>(url: string, { params, ...options }: GetOptions = {}) {
    return this.request<T>({ method: 'GET', url, params }, options);
  }

  private async post<T = unknown>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>({ method: 'POST', url, data }, options);
  }

  private async put<T = unknown>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>({ method: 'PUT', url, data }, options);
  }

  private selectSchema(schema: z.ZodObject, fields: readonly string[]): z.ZodObject {
    return fields.length > 0 ? schema.pick(this.toFieldsMap(fields) as never) : schema;
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

  public async findCustomFieldValues<K extends IustaCustomFieldKeys = never>(
    where: Record<string, unknown>,
    fields: readonly K[] = [],
    context = 'Error querying Iusta custom field values'
  ) {
    const filter = fields.length > 0 ? { where, fields: this.toFieldsMap(fields) } : { where };

    return this.get<IustaSelected<IustaCustomField, K>[]>('/CustomFieldValues', {
      params: { filter },
      context,
      schema: z.array(this.selectSchema(iustaCustomFieldSchema, fields)),
    });
  }

  // --- Case Read Methods ---

  public async getCaseStandardFields<K extends IustaCaseStandardFieldKeys = never>(
    caseId: string,
    caseStandardFields: readonly K[] = []
  ) {
    const url = `/Cases/${encodeURIComponent(caseId)}`;

    return this.get<IustaSelected<IustaCaseStandardFields, K>>(url, {
      params: this.buildStandardFieldsParams(caseStandardFields),
      context: `Error fetching Iusta case standard fields for caseId: ${caseId}`,
      schema: this.selectSchema(iustaCaseStandardFieldsSchema, caseStandardFields),
    });
  }

  public async getCaseCustomFields<K extends IustaCustomFieldKeys = never>(
    caseId: string,
    caseCustomFields: readonly number[] = [],
    fields: readonly K[] = []
  ) {
    const url = `/Cases/${encodeURIComponent(caseId)}/CustomFieldValues`;

    return this.get<IustaSelected<IustaCustomField, K>[]>(url, {
      params: this.buildCustomFieldParams(caseCustomFields, fields),
      context: `Error fetching Iusta case custom fields for caseId: ${caseId}`,
      schema: z.array(this.selectSchema(iustaCustomFieldSchema, fields)),
    });
  }

  // --- Customer Read Methods ---

  public async getCustomerStandardFields<K extends IustaCustomerStandardFieldKeys = never>(
    customerId: string,
    customerStandardFields: readonly K[] = []
  ) {
    const url = `/Customers/${encodeURIComponent(customerId)}`;

    return this.get<IustaSelected<IustaCustomerStandardFields, K>>(url, {
      params: this.buildStandardFieldsParams(customerStandardFields),
      context: `Error fetching Iusta customer ${customerId}`,
      schema: this.selectSchema(iustaCustomerStandardFieldsSchema, customerStandardFields),
    });
  }

  public async getCustomerCustomFields<K extends IustaCustomFieldKeys = never>(
    customerId: string,
    customerCustomFields: readonly number[] = [],
    fields: readonly K[] = []
  ) {
    const url = `/Customers/${encodeURIComponent(customerId)}/CustomFieldValues`;

    return this.get<IustaSelected<IustaCustomField, K>[]>(url, {
      params: this.buildCustomFieldParams(customerCustomFields, fields),
      context: `Error fetching Iusta customer ${customerId} custom field values`,
      schema: z.array(this.selectSchema(iustaCustomFieldSchema, fields)),
    });
  }
}
