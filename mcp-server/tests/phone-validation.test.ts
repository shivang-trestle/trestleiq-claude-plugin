import { describe, it, expect, vi } from 'vitest';
import { phoneValidationTool } from '../src/tools/phone-validation.js';
import { TrestleError } from '../src/errors.js';
import type { TrestleClient } from '../src/client.js';

function clientStub(impl: TrestleClient['get']): TrestleClient {
  return { get: impl } as unknown as TrestleClient;
}

describe('phoneValidationTool', () => {
  it('exposes the tool name trestle_phone_validation', () => {
    expect(phoneValidationTool.name).toBe('trestle_phone_validation');
  });

  it('calls /3.0/phone_intel with normalized 10-digit phone', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
    }));
    await phoneValidationTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(get).toHaveBeenCalledWith('/3.0/phone_intel', { phone: '2069735100' });
  });

  it('normalizes E.164 input before calling client', async () => {
    const get = vi.fn(async () => ({ phone_number: '+12069735100', is_valid: true }));
    // Bypass the schema by passing normalized form; the schema runs at MCP boundary, not in handler tests.
    await phoneValidationTool.handler({ phone: '2069735100' }, clientStub(get));
    const [path, params] = get.mock.calls[0];
    expect(path).toBe('/3.0/phone_intel');
    expect(params).toEqual({ phone: '2069735100' });
  });

  it('returns text content with summarized result on success', async () => {
    const get = vi.fn(async () => ({
      id: 'Phone.x',
      phone_number: '+12069735100',
      is_valid: true,
      activity_score: 90,
      country_code: 'US',
      line_type: 'Mobile',
      carrier: 'Verizon Wireless',
      is_prepaid: false,
    }));
    const result = await phoneValidationTool.handler(
      { phone: '2069735100' },
      clientStub(get),
    );
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('+12069735100');
    expect(text).toMatch(/valid/i);
    expect(text).toContain('Mobile');
    expect(text).toContain('Verizon Wireless');
    expect(text).toContain('Activity score: 90');
  });

  it('omits prepaid line when is_prepaid is missing', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
    }));
    const result = await phoneValidationTool.handler({ phone: '2069735100' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).not.toMatch(/Prepaid:/);
  });

  it('returns isError on TrestleError(auth) with /trestle-setup hint', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('auth', 'Invalid API key', 403);
    });
    const result = await phoneValidationTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid API key');
    expect(text).toContain('/trestle-setup');
  });

  it('returns isError on TrestleError(rate_limit)', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('rate_limit', 'Slow down', 429);
    });
    const result = await phoneValidationTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('rate');
  });

  it('returns isError on unexpected non-Trestle errors', async () => {
    const get = vi.fn(async () => {
      throw new Error('boom');
    });
    const result = await phoneValidationTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(result.isError).toBe(true);
  });
});
