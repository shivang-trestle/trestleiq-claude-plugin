export type TrestleErrorKind = 'auth' | 'rate_limit' | 'invalid_input' | 'upstream' | 'network';
export declare class TrestleError extends Error {
    readonly kind: TrestleErrorKind;
    readonly http_status?: number | undefined;
    constructor(kind: TrestleErrorKind, message: string, http_status?: number | undefined);
    toContent(): {
        kind: TrestleErrorKind;
        message: string;
        http_status: number | undefined;
    };
}
