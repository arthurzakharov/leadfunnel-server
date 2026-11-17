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

export interface IustaCaseStandardFields {
  status: number;
  number: string | null;
  name: string | null;
  private: boolean;
  closedAt: string | null;
  invoicingContactId: string | null;
  invoicingContactId2: string | null;
  invoicingContactId3: string | null;
  invoiceUuids: string | null;
  comment: string | null;
  id: number;
  customerId: number;
  assignedUserId: string | null;
  closedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number;
  permissionSetId: number;
  caseGroupId: number;
}

export type IustaCaseStandardFieldKeys = keyof IustaCaseStandardFields;

export interface IustaCustomerStandardFields {
  title: string | null;
  gender: string | null;
  entity: string | null;
  name: string | null;
  surname: string | null;
  company: string | null;
  dateOfBirth: string | null;
  streetAddress: string | null;
  streetNumber: string | null;
  zipCode: string | null;
  city: string | null;
  addressAdditional1: string | null;
  addressAdditional2: string | null;
  addressAdditional3: string | null;
  country: string | null;
  phoneNumber: string | null;
  mobileNumber: string | null;
  email: string | null;
  fax: string | null;
  iban: string | null;
  bic: string | null;
  id: number;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number;
  permissionSetId: number;
}

export type IustaCustomerStandardFieldKeys = keyof IustaCustomerStandardFields;

export interface IustaCustomField {
  value: string | null;
  intValue: number | null;
  referenceId: number;
  id: number;
  customFieldId: number;
  referenceType: IustaFieldEntity;
}

export type IustaCustomFieldKeys = keyof IustaCustomField;
