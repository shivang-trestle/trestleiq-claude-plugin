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

  it('calls /3.2/phone with normalized 10-digit phone', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
      owners: [],
    }));
    await reversePhoneTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(get).toHaveBeenCalledWith('/3.2/phone', { phone: '2069735100' });
  });

  it('summarizes one owner using firstname/middlename/lastname', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
      line_type: 'Mobile',
      carrier: 'Verizon Wireless',
      owners: [
        {
          firstname: 'Jane',
          middlename: 'A',
          lastname: 'Doe',
          type: 'Person',
          age_range: '40-49',
        },
      ],
    }));
    const result = await reversePhoneTool.handler({ phone: '2069735100' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Jane A Doe');
    expect(text).toContain('Person');
    expect(text).toContain('40-49');
  });

  it('prefers full "name" field when present', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
      owners: [{ name: 'Acme Corp', firstname: 'Should', lastname: 'Ignore', type: 'Business' }],
    }));
    const result = await reversePhoneTool.handler({ phone: '2069735100' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Acme Corp');
    expect(text).not.toContain('Should Ignore');
  });

  it('summarizes multiple owners', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
      owners: [
        { firstname: 'Jane', lastname: 'Doe', type: 'Person' },
        { name: 'Acme Corp', type: 'Business' },
      ],
    }));
    const result = await reversePhoneTool.handler({ phone: '2069735100' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Acme Corp');
  });

  it('handles zero owners gracefully', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+12069735100',
      is_valid: true,
      owners: [],
    }));
    const result = await reversePhoneTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text.toLowerCase()).toContain('no owner');
  });

  it('returns isError on auth failure with /trestle-setup hint', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('auth', 'Invalid key', 403);
    });
    const result = await reversePhoneTool.handler({ phone: '2069735100' }, clientStub(get));
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('/trestle-setup');
  });
});
