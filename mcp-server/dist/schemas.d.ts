import * as z from 'zod/v4';
export declare const phoneValidationInput: z.ZodObject<{
    phone: z.ZodString;
    country_hint: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PhoneValidationInput = z.infer<typeof phoneValidationInput>;
export declare const reversePhoneInput: z.ZodObject<{
    phone: z.ZodString;
}, z.core.$strip>;
export type ReversePhoneInput = z.infer<typeof reversePhoneInput>;
export declare const phoneValidationResponse: z.ZodObject<{
    phone_number: z.ZodString;
    is_valid: z.ZodBoolean;
    country_code: z.ZodOptional<z.ZodString>;
    line_type: z.ZodOptional<z.ZodString>;
    carrier: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export type PhoneValidationResponse = z.infer<typeof phoneValidationResponse>;
export declare const reversePhoneResponse: z.ZodObject<{
    phone_number: z.ZodString;
    is_valid: z.ZodBoolean;
    owners: z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export type ReversePhoneResponse = z.infer<typeof reversePhoneResponse>;
