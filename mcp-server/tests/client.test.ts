import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrestleClient } from '../src/client.js';

function mockFetch(impl: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    return impl(input.toString(), init);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('TrestleClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends API key in x-api-key header on GET', async () => {
    const fetchFn = mockFetch(() =>
      new Response(JSON.stringify({ is_valid: true, phone_number: '+12069735100' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = new TrestleClient('test-key-123');
    await client.get('/3.0/phone_intel', { phone: '2069735100' });

    const init = fetchFn.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-key-123');
  });

  it('builds query string from params and hits the right versioned path', async () => {
    const fetchFn = mockFetch(() =>
      new Response('{"is_valid":true,"phone_number":"+12069735100"}', { status: 200 }),
    );

    const client = new TrestleClient('k');
    await client.get('/3.0/phone_intel', { phone: '2069735100' });

    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('phone=2069735100');
    expect(url).toMatch(/^https:\/\/api\.trestleiq\.com\/3\.0\/phone_intel\?/);
  });

  it('maps 401 to TrestleError(auth)', async () => {
    mockFetch(() => new Response('{"error":"unauthorized"}', { status: 401 }));
    const client = new TrestleClient('bad-key');
    await expect(client.get('/3.0/phone_intel', { phone: '2069735100' })).rejects.toMatchObject({
      kind: 'auth',
      http_status: 401,
    });
  });

  it('maps 429 to TrestleError(rate_limit)', async () => {
    mockFetch(() => new Response('', { status: 429 }));
    const client = new TrestleClient('k');
    await expect(client.get('/3.0/phone_intel', { phone: '2069735100' })).rejects.toMatchObject({
      kind: 'rate_limit',
      http_status: 429,
    });
  });

  it('maps 4xx (not 401/429) to invalid_input', async () => {
    mockFetch(() => new Response('{"error":"bad phone"}', { status: 400 }));
    const client = new TrestleClient('k');
    await expect(client.get('/3.0/phone_intel', { phone: '2069735100' })).rejects.toMatchObject({
      kind: 'invalid_input',
      http_status: 400,
    });
  });

  it('retries once on 5xx then succeeds', async () => {
    let attempts = 0;
    const fetchFn = mockFetch(() => {
      attempts++;
      if (attempts === 1) return new Response('', { status: 503 });
      return new Response('{"is_valid":true,"phone_number":"+14155552671"}', { status: 200 });
    });

    const client = new TrestleClient('k');
    const result = await client.get<{ is_valid: boolean }>('/3.0/phone_intel', {
      phone: '2069735100',
    });
    expect(result).toMatchObject({ is_valid: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws upstream after second 5xx', async () => {
    mockFetch(() => new Response('', { status: 502 }));
    const client = new TrestleClient('k');
    await expect(client.get('/3.0/phone_intel', { phone: '2069735100' })).rejects.toMatchObject({
      kind: 'upstream',
      http_status: 502,
    });
  });

  it('maps fetch network failure to network kind', async () => {
    mockFetch(() => {
      throw new TypeError('fetch failed');
    });
    const client = new TrestleClient('k');
    await expect(client.get('/3.0/phone_intel', { phone: '2069735100' })).rejects.toMatchObject({
      kind: 'network',
    });
  });
});
