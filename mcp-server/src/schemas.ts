import * as z from 'zod/v4';

const e164 = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'phone must be E.164, e.g. +14155552671');

export const phoneValidationInput = z.object({
  phone: e164.describe('Phone number in E.164 format'),
  country_hint: z
    .string()
    .length(2)
    .optional()
    .describe('Two-letter country code hint, e.g. "US"'),
});
export type PhoneValidationInput = z.infer<typeof phoneValidationInput>;

export const reversePhoneInput = z.object({
  phone: e164.describe('Phone number in E.164 format'),
});
export type ReversePhoneInput = z.infer<typeof reversePhoneInput>;

export const phoneValidationResponse = z
  .object({
    phone_number: z.string(),
    is_valid: z.boolean(),
    country_code: z.string().optional(),
    line_type: z.string().optional(),
    carrier: z.string().optional(),
  })
  .passthrough();
export type PhoneValidationResponse = z.infer<typeof phoneValidationResponse>;

const owner = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export const reversePhoneResponse = z
  .object({
    phone_number: z.string(),
    is_valid: z.boolean(),
    owners: z.array(owner),
  })
  .passthrough();
export type ReversePhoneResponse = z.infer<typeof reversePhoneResponse>;
