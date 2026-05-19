import * as z from 'zod/v4';
export declare const phoneValidationInput: z.ZodObject<{
    phone: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export type PhoneValidationInput = z.infer<typeof phoneValidationInput>;
export declare const reversePhoneInput: z.ZodObject<{
    phone: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export type ReversePhoneInput = z.infer<typeof reversePhoneInput>;
export declare const phoneValidationResponse: z.ZodObject<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_valid: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    activity_score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    country_calling_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    line_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    carrier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_prepaid: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    is_litigator_risk: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$loose>;
export type PhoneValidationResponse = z.infer<typeof phoneValidationResponse>;
export declare const reversePhoneResponse: z.ZodObject<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_valid: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    country_calling_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    line_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    carrier: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_prepaid: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    is_commercial: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    owners: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        firstname: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        middlename: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        lastname: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        age_range: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        gender: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$loose>>>;
}, z.core.$loose>;
export type ReversePhoneResponse = z.infer<typeof reversePhoneResponse>;
