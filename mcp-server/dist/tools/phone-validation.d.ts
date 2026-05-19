import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { phoneValidationInput } from '../schemas.js';
export declare const phoneValidationTool: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        phone: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
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
            id?: string | null | undefined;
            phone_number?: string | null | undefined;
            is_valid?: boolean | null | undefined;
            activity_score?: number | null | undefined;
            country_calling_code?: string | null | undefined;
            country_code?: string | null | undefined;
            country_name?: string | null | undefined;
            line_type?: string | null | undefined;
            carrier?: string | null | undefined;
            is_prepaid?: boolean | null | undefined;
            is_litigator_risk?: boolean | null | undefined;
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
