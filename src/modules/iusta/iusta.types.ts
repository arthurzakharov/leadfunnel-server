import { z } from 'zod';

// Each Iusta entity is described once as a Zod schema; its TS type and its list of
// selectable field keys are derived from it, so they can never drift apart.

export const iustaFieldEntitySchema = z.enum(['Case', 'Customer']);

export type IustaFieldEntity = z.infer<typeof iustaFieldEntitySchema>;

// --- Case Standard Fields ---

export const iustaCaseStandardFieldsSchema = z.object({
  status: z.number(),
  number: z.string().nullable(),
  name: z.string().nullable(),
  private: z.boolean(),
  closedAt: z.string().nullable(),
  invoicingContactId: z.string().nullable(),
  invoicingContactId2: z.string().nullable(),
  invoicingContactId3: z.string().nullable(),
  invoiceUuids: z.string().nullable(),
  comment: z.string().nullable(),
  id: z.number(),
  customerId: z.number().nullable(),
  assignedUserId: z.string().nullable(),
  closedBy: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  createdBy: z.number(),
  updatedBy: z.number(),
  permissionSetId: z.number(),
  caseGroupId: z.number(),
});

export type IustaCaseStandardFields = z.infer<typeof iustaCaseStandardFieldsSchema>;
export const iustaCaseStandardFieldKeySchema = iustaCaseStandardFieldsSchema.keyof();
export type IustaCaseStandardFieldKeys = keyof IustaCaseStandardFields;

// --- Customer Standard Fields ---

export const iustaCustomerStandardFieldsSchema = z.object({
  title: z.string().nullable(),
  gender: z.string().nullable(),
  entity: z.string().nullable(),
  name: z.string().nullable(),
  surname: z.string().nullable(),
  company: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  streetAddress: z.string().nullable(),
  streetNumber: z.string().nullable(),
  zipCode: z.string().nullable(),
  city: z.string().nullable(),
  addressAdditional1: z.string().nullable(),
  addressAdditional2: z.string().nullable(),
  addressAdditional3: z.string().nullable(),
  country: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  mobileNumber: z.string().nullable(),
  email: z.string().nullable(),
  fax: z.string().nullable(),
  iban: z.string().nullable(),
  bic: z.string().nullable(),
  id: z.number(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  createdBy: z.number(),
  updatedBy: z.number(),
  permissionSetId: z.number(),
});

export type IustaCustomerStandardFields = z.infer<typeof iustaCustomerStandardFieldsSchema>;
export const iustaCustomerStandardFieldKeySchema = iustaCustomerStandardFieldsSchema.keyof();
export type IustaCustomerStandardFieldKeys = keyof IustaCustomerStandardFields;

// --- Custom Fields ---

export const iustaCustomFieldSchema = z.object({
  value: z.string().nullable(),
  intValue: z.number().nullable(),
  referenceId: z.number(),
  id: z.number(),
  customFieldId: z.number(),
  referenceType: iustaFieldEntitySchema,
});

export type IustaCustomField = z.infer<typeof iustaCustomFieldSchema>;
export const iustaCustomFieldKeySchema = iustaCustomFieldSchema.keyof();
export type IustaCustomFieldKeys = keyof IustaCustomField;

// --- Field selection helpers ---

/**
 * Shape returned by Iusta when only `K` fields are requested via `filter.fields`.
 * No fields requested (`K = never`) means Iusta returns the full entity.
 */
export type IustaSelected<T, K extends keyof T> = [K] extends [never] ? T : Pick<T, K>;
