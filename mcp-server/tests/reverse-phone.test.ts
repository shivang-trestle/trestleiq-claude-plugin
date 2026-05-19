import { describe, it, expect, vi } from 'vitest';
import { reversePhoneTool } from '../src/tools/reverse-phone.js';
import { TrestleError } from '../src/errors.js';
import type { TrestleClient } from '../src/client.js';

function clientStub(impl: TrestleClient['get']): TrestleClient {
  return { get: impl } as unknown as TrestleClient;
}

describe('reversePhoneTool', () => {
  it('uses the name trestle_reverse_phone', () => {
    expect(reversePhoneTool.name).toBe('trestle_reverse_phone');
  });

  it('calls /reverse-phone with phone', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [{ name: 'Jane Doe', type: 'Person' }],
    }));
    await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    expect(get).toHaveBeenCalledWith('/reverse-phone', { phone: '+14155552671' });
  });

  it('summarizes one owner', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [{ name: 'Jane Doe', type: 'Person' }],
    }));
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Person');
  });

  it('summarizes multiple owners', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [
        { name: 'Jane Doe', type: 'Person' },
        { name: 'Acme Corp', type: 'Business' },
      ],
    }));
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Acme Corp');
  });

  it('handles zero owners gracefully', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [],
    }));
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text.toLowerCase()).toContain('no owner');
  });

  it('returns isError on auth failure with /trestle-setup hint', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('auth', 'Invalid key', 401);
    });
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('/trestle-setup');
  });
});
