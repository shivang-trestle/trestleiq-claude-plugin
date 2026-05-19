import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { reversePhoneInput } from '../schemas.js';
export declare const reversePhoneTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        phone: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    }, z.core.$strip>;
    handler(args: z.infer<typeof reversePhoneInput>, client: TrestleClient): Promise<{
        isError: boolean;
        content: {
            type: "text";
            text: string;
        }[];
        structuredContent: {
            kind: import("../errors.js").TrestleErrorKind;
            message: string;
            http_status: number | undefined;
        };
    } | {
        isError: boolean;
        content: {
            type: "text";
            text: string;
        }[];
        structuredContent?: undefined;
    } | {
        content: {
            type: "text";
            text: string;
        }[];
        structuredContent: {
            [x: string]: unknown;
            owners: {
                [x: string]: unknown;
                id?: string | null | undefined;
                name?: string | null | undefined;
                firstname?: string | null | undefined;
                middlename?: string | null | undefined;
                lastname?: string | null | undefined;
                type?: string | null | undefined;
                age_range?: string | null | undefined;
                gender?: string | null | undefined;
            }[];
            id?: string | null | undefined;
            phone_number?: string | null | undefined;
            is_valid?: boolean | null | undefined;
            country_calling_code?: string | null | undefined;
            line_type?: string | null | undefined;
            carrier?: string | null | undefined;
            is_prepaid?: boolean | null | undefined;
            is_commercial?: boolean | null | undefined;
        };
    }>;
};
