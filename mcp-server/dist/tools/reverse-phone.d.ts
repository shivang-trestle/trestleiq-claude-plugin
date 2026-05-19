import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { reversePhoneInput } from '../schemas.js';
export declare const reversePhoneTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        phone: z.ZodString;
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
            phone_number: string;
            is_valid: boolean;
            owners: {
                [x: string]: unknown;
                name?: string | undefined;
                type?: string | undefined;
            }[];
        };
    }>;
};
