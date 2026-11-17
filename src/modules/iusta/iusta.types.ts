export type IustaFieldEntity = 'Case' | 'Customer';
export type IustaFieldType = 'standard' | 'custom';

export interface IustaFieldDescriptor {
  readonly id: number | string;
  readonly entity: IustaFieldEntity;
  readonly type: IustaFieldType;
}

export interface FindCaseIdByExternalId {
  caseId: string;
}

export interface IustaCaseLookupItem {
  value: string;
  intValue: number | string;
  referenceId: number | string;
  id: number | string;
  customFieldId: number | string;
  referenceType: string;
}

export interface IustaCaseStandardFields extends Record<string, unknown> {
  id?: number | string;
  number?: string;
  customerId?: number | string;
  status?: string;
  name?: string;
}

export interface IustaCustomerStandardFields extends Record<string, unknown> {
  id?: number | string;
  title?: string;
  gender?: string;
  name?: string;
  surname?: string;
  company?: string;
  dateOfBirth?: string;
  streetAddress?: string;
  streetNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
}

export interface IustaCustomFieldValueItem {
  id?: number | string;
  customFieldId: number;
  value: string | null;
  referenceId?: number | string;
  referenceType?: IustaFieldEntity;
}

export interface IustaResolvedIds {
  caseId: number | string;
  customerId: number | string | null;
}

export class IustaRequestError extends Error {
  public readonly status: number;
  public readonly responseBody: string;

  constructor(status: number, responseBody: string, context?: string) {
    const prefix = context ? `${context}: ` : '';
    super(`${prefix}Request error: ${status} - ${responseBody}`);
    this.name = 'IustaRequestError';
    this.status = status;
    this.responseBody = responseBody;
  }
}
