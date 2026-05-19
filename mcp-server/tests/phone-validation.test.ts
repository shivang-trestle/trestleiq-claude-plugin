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

  it('calls /phone-validation with required + optional params', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
    }));
    await phoneValidationTool.handler(
      { phone: '+14155552671', country_hint: 'US' },
      clientStub(get),
    );
    expect(get).toHaveBeenCalledWith('/phone-validation', {
      phone: '+14155552671',
      country_hint: 'US',
    });
  });

  it('returns text content with summarized result on success', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
      carrier: 'Verizon',
    }));
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toMatchObject({ type: 'text' });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('+14155552671');
    expect(text).toMatch(/valid/i);
    expect(text).toContain('Mobile');
    expect(text).toContain('Verizon');
  });

  it('returns isError on TrestleError(auth)', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('auth', 'Invalid API key', 401);
    });
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid API key');
    expect(text).toContain('/trestle-setup');
  });

  it('returns isError on TrestleError(rate_limit)', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('rate_limit', 'Slow down', 429);
    });
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('rate');
  });

  it('returns isError on unexpected non-Trestle errors', async () => {
    const get = vi.fn(async () => {
      throw new Error('boom');
    });
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBe(true);
  });
});
