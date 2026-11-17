import { z } from 'zod';
import {
  iustaCaseStandardFieldKeySchema,
  iustaCustomerStandardFieldKeySchema,
  iustaCustomFieldKeySchema,
} from '@/modules/iusta/iusta.types';

const MAX_CSV_IDS = 100;

const splitCsv = (val?: string) =>
  val
    ? val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const createCsvEnumSchema = <E extends z.ZodEnum<Record<string, string>>>(allowedValues: E) =>
  z.string().optional().transform(splitCsv).pipe(z.array(allowedValues));

const csvIdsSchema = z
  .string()
  .optional()
  .transform(splitCsv)
  .pipe(
    z
      .array(
        z
          .string()
          .regex(/^\d{1,15}$/, { error: 'each id must be a positive integer' })
          .transform(Number)
      )
      .max(MAX_CSV_IDS, { error: `at most ${MAX_CSV_IDS} ids are allowed` })
  )
  .transform((ids) => [...new Set(ids)]);

const numericIdSchema = (name: string) =>
  z.string().regex(/^\d{1,18}$/, { error: `${name} must be a positive integer` });

export const externalIdParam = z.object({
  externalId: z.string().trim().min(1).max(255),
});

export const caseIdParam = z.object({
  caseId: numericIdSchema('caseId'),
});

export const customerIdParam = z.object({
  customerId: numericIdSchema('customerId'),
});

export const caseStandardFieldsQuery = z.object({
  fields: createCsvEnumSchema(iustaCaseStandardFieldKeySchema),
});

export const customerStandardFieldsQuery = z.object({
  fields: createCsvEnumSchema(iustaCustomerStandardFieldKeySchema),
});

export const customFieldsQuery = z.object({
  ids: csvIdsSchema,
  fields: createCsvEnumSchema(iustaCustomFieldKeySchema),
});
