export type IustaFieldEntity = 'Case' | 'Customer';

// --- Case Standard Fields ---

export const IUSTA_CASE_STANDARD_FIELD_KEYS = [
  'status',
  'number',
  'name',
  'private',
  'closedAt',
  'invoicingContactId',
  'invoicingContactId2',
  'invoicingContactId3',
  'invoiceUuids',
  'comment',
  'id',
  'customerId',
  'assignedUserId',
  'closedBy',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'permissionSetId',
  'caseGroupId',
] as const;

export type IustaCaseStandardFieldKeys = (typeof IUSTA_CASE_STANDARD_FIELD_KEYS)[number];

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
  customerId: number | null;
  assignedUserId: string | null;
  closedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number;
  permissionSetId: number;
  caseGroupId: number;
}

// --- Customer Standard Fields ---

export const IUSTA_CUSTOMER_STANDARD_FIELD_KEYS = [
  'title',
  'gender',
  'entity',
  'name',
  'surname',
  'company',
  'dateOfBirth',
  'streetAddress',
  'streetNumber',
  'zipCode',
  'city',
  'addressAdditional1',
  'addressAdditional2',
  'addressAdditional3',
  'country',
  'phoneNumber',
  'mobileNumber',
  'email',
  'fax',
  'iban',
  'bic',
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'permissionSetId',
] as const;

export type IustaCustomerStandardFieldKeys = (typeof IUSTA_CUSTOMER_STANDARD_FIELD_KEYS)[number];

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

// --- Custom Fields ---

export const IUSTA_CUSTOM_FIELD_KEYS = [
  'value',
  'intValue',
  'referenceId',
  'id',
  'customFieldId',
  'referenceType',
] as const;

export type IustaCustomFieldKeys = (typeof IUSTA_CUSTOM_FIELD_KEYS)[number];

export interface IustaCustomField {
  value: string | null;
  intValue: number | null;
  referenceId: number;
  id: number;
  customFieldId: number;
  referenceType: IustaFieldEntity;
}
