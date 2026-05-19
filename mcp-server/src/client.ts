import { TrestleError } from './errors.js';

const BASE_URL = 'https://api.trestleiq.com';

export class TrestleClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = BASE_URL,
  ) {
    if (!apiKey) {
      throw new TrestleError('auth', 'TRESTLE_API_KEY not set');
    }
  }

  async get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, 'GET');
  }

  private buildUrl(path: string, params: Record<string, string | undefined>): string {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
    return url.toString();
  }

  private async request<T>(url: string, method: 'GET' | 'POST'): Promise<T> {
    let lastErr: TrestleError | undefined;
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
          return (await res.json()) as T;
        }
        const err = this.mapHttpError(res.status, await this.safeText(res));
        if (err.kind === 'upstream' && attempt === 0) {
          lastErr = err;
          continue;
        }
        throw err;
      } catch (e) {
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

  private mapHttpError(status: number, body: string): TrestleError {
    if (status === 401 || status === 403)
      return new TrestleError('auth', body || 'Unauthorized', status);
    if (status === 429)
      return new TrestleError('rate_limit', body || 'Rate limited', status);
    if (status >= 400 && status < 500)
      return new TrestleError('invalid_input', body || 'Bad request', status);
    return new TrestleError('upstream', body || `Upstream HTTP ${status}`, status);
  }

  private async safeText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '';
    }
  }
}
