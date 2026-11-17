import type { ValidationTargets } from 'hono';
import { validator } from 'hono/validator';
import { type ZodType, z } from 'zod';
import { BadRequestError } from '@/helpers/errors';

export const zodValidator = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema
) =>
  validator(target, (value): z.infer<Schema> => {
    const parsed = schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestError(z.prettifyError(parsed.error));
    }

    return parsed.data;
  });
