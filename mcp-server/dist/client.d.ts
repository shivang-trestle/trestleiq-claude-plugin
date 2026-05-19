export declare class TrestleClient {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    get<T>(path: string, params: Record<string, string | undefined>): Promise<T>;
    private buildUrl;
    private request;
    private mapHttpError;
    private safeText;
}
