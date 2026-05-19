import { TrestleError } from './errors.js';
const BASE_URL = 'https://api.trestleiq.com/1.1';
export class TrestleClient {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl = BASE_URL) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        if (!apiKey) {
            throw new TrestleError('auth', 'TRESTLE_API_KEY not set');
        }
    }
    async get(path, params) {
        const url = this.buildUrl(path, params);
        return this.request(url, 'GET');
    }
    buildUrl(path, params) {
        const url = new URL(this.baseUrl + path);
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined)
                url.searchParams.set(k, v);
        }
        return url.toString();
    }
    async request(url, method) {
        let lastErr;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        'x-api-key': this.apiKey,
                        accept: 'application/json',
                    },
                });
                if (res.ok) {
                    return (await res.json());
                }
                const err = this.mapHttpError(res.status, await this.safeText(res));
                if (err.kind === 'upstream' && attempt === 0) {
                    lastErr = err;
                    continue;
                }
                throw err;
            }
            catch (e) {
                if (e instanceof TrestleError) {
                    if (e.kind === 'upstream' && attempt === 0) {
                        lastErr = e;
                        continue;
                    }
                    throw e;
                }
                const msg = e instanceof Error ? e.message : String(e);
                throw new TrestleError('network', msg);
            }
        }
        throw lastErr ?? new TrestleError('upstream', 'unknown upstream failure');
    }
    mapHttpError(status, body) {
        if (status === 401 || status === 403)
            return new TrestleError('auth', body || 'Unauthorized', status);
        if (status === 429)
            return new TrestleError('rate_limit', body || 'Rate limited', status);
        if (status >= 400 && status < 500)
            return new TrestleError('invalid_input', body || 'Bad request', status);
        return new TrestleError('upstream', body || `Upstream HTTP ${status}`, status);
    }
    async safeText(res) {
        try {
            return await res.text();
        }
        catch {
            return '';
        }
    }
}
//# sourceMappingURL=client.js.map