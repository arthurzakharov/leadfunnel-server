import type { IustaFieldDescriptor } from '@/modules/iusta/iusta.types';

const caseCustom = (id: number): IustaFieldDescriptor => ({
  id,
  entity: 'Case',
  type: 'custom',
});

const customerCustom = (id: number): IustaFieldDescriptor => ({
  id,
  entity: 'Customer',
  type: 'custom',
});

const caseStandard = (id: string): IustaFieldDescriptor => ({
  id,
  entity: 'Case',
  type: 'standard',
});

const customerStandard = (id: string): IustaFieldDescriptor => ({
  id,
  entity: 'Customer',
  type: 'standard',
});

export const IUSTA_FIELDS = {
  EXTERNAL_ID: caseCustom(18943),
  CASE_ID: caseStandard('id'),
  CASE_NUMBER: caseStandard('number'),
  CASE_CUSTOMER_ID: caseStandard('customerId'),
  CUSTOMER_ID: customerStandard('id'),
} as const satisfies Record<string, IustaFieldDescriptor>;

export type IustaFieldName = keyof typeof IUSTA_FIELDS;
