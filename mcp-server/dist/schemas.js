import * as z from 'zod/v4';
const phoneInput = z
    .string()
    .min(7, 'phone too short')
    .transform((s, ctx) => {
    const digits = s.replace(/\D/g, '');
    const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (ten.length !== 10) {
        ctx.addIssue({
            code: 'custom',
            message: 'phone must be a 10-digit US number (e.g. 2069735100 or +12069735100)',
        });
        return z.NEVER;
    }
    return ten;
});
export const phoneValidationInput = z.object({
    phone: phoneInput.describe('US phone number. Accepts 10-digit (2069735100), E.164 (+12069735100), or formatted (415-555-2671). Normalized to 10 digits before sending.'),
});
export const reversePhoneInput = z.object({
    phone: phoneInput.describe('US phone number. Accepts 10-digit, E.164, or formatted. Normalized to 10 digits before sending.'),
});
// Responses use .passthrough() — Trestle adds fields freely.
export const phoneValidationResponse = z
    .object({
    id: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    is_valid: z.boolean().nullable().optional(),
    activity_score: z.number().nullable().optional(),
    country_calling_code: z.string().nullable().optional(),
    country_code: z.string().nullable().optional(),
    country_name: z.string().nullable().optional(),
    line_type: z.string().nullable().optional(),
    carrier: z.string().nullable().optional(),
    is_prepaid: z.boolean().nullable().optional(),
    is_litigator_risk: z.boolean().nullable().optional(),
})
    .passthrough();
const owner = z
    .object({
    id: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    firstname: z.string().nullable().optional(),
    middlename: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    age_range: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
})
    .passthrough();
export const reversePhoneResponse = z
    .object({
    id: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    is_valid: z.boolean().nullable().optional(),
    country_calling_code: z.string().nullable().optional(),
    line_type: z.string().nullable().optional(),
    carrier: z.string().nullable().optional(),
    is_prepaid: z.boolean().nullable().optional(),
    is_commercial: z.boolean().nullable().optional(),
    owners: z.array(owner).default([]),
})
    .passthrough();
//# sourceMappingURL=schemas.js.map