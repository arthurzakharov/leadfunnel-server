import { z } from 'zod';
import {
  IUSTA_CASE_STANDARD_FIELD_KEYS,
  IUSTA_CUSTOM_FIELD_KEYS,
  IUSTA_CUSTOMER_STANDARD_FIELD_KEYS,
} from '@/modules/iusta/iusta.types';

const createCsvEnumSchema = <const T extends readonly [string, ...string[]]>(allowedValues: T) =>
  z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    )
    .pipe(z.array(z.enum(allowedValues)));

const csvIdsSchema = z
  .string()
  .optional()
  .transform((val) =>
    val
      ? val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((id) => (/^\d+$/.test(id) ? Number(id) : id))
      : []
  );

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
  fields: createCsvEnumSchema(IUSTA_CASE_STANDARD_FIELD_KEYS),
});

export const customerStandardFieldsQuery = z.object({
  fields: createCsvEnumSchema(IUSTA_CUSTOMER_STANDARD_FIELD_KEYS),
});

export const customFieldsQuery = z.object({
  ids: csvIdsSchema,
  fields: createCsvEnumSchema(IUSTA_CUSTOM_FIELD_KEYS),
});
