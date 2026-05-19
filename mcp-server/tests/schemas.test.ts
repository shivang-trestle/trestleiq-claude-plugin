import { describe, it, expect } from 'vitest';
import {
  phoneValidationInput,
  reversePhoneInput,
  phoneValidationResponse,
  reversePhoneResponse,
} from '../src/schemas.js';

describe('phoneValidationInput', () => {
  it('requires E.164 phone string', () => {
    expect(phoneValidationInput.safeParse({ phone: '+14155552671' }).success).toBe(true);
    expect(phoneValidationInput.safeParse({ phone: 'not-a-phone' }).success).toBe(false);
    expect(phoneValidationInput.safeParse({}).success).toBe(false);
  });

  it('accepts optional country_hint', () => {
    const parsed = phoneValidationInput.parse({ phone: '+14155552671', country_hint: 'US' });
    expect(parsed.country_hint).toBe('US');
  });
});

describe('reversePhoneInput', () => {
  it('requires E.164 phone string only', () => {
    expect(reversePhoneInput.safeParse({ phone: '+14155552671' }).success).toBe(true);
    expect(reversePhoneInput.safeParse({}).success).toBe(false);
  });
});

describe('phoneValidationResponse', () => {
  it('parses a minimal valid response', () => {
    const ok = phoneValidationResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
    });
    expect(ok.success).toBe(true);
  });

  it('allows extra fields without error', () => {
    const ok = phoneValidationResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
      carrier: 'Verizon',
      something_new: 'extra',
    });
    expect(ok.success).toBe(true);
  });
});

describe('reversePhoneResponse', () => {
  it('parses a response with owners array', () => {
    const ok = reversePhoneResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [{ name: 'Jane Doe', type: 'Person' }],
    });
    expect(ok.success).toBe(true);
  });

  it('parses an empty owners array', () => {
    const ok = reversePhoneResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [],
    });
    expect(ok.success).toBe(true);
  });
});
