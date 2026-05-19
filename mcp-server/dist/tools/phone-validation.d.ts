import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { phoneValidationInput } from '../schemas.js';
export declare const phoneValidationTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        phone: z.ZodString;
        country_hint: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    handler(args: z.infer<typeof phoneValidationInput>, client: TrestleClient): Promise<{
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
            country_code?: string | undefined;
            line_type?: string | undefined;
            carrier?: string | undefined;
        };
    }>;
};
export declare function errorResult(e: unknown): {
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
};
