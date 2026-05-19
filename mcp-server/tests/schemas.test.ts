import { describe, it, expect } from 'vitest';
import {
  phoneValidationInput,
  reversePhoneInput,
  phoneValidationResponse,
  reversePhoneResponse,
} from '../src/schemas.js';

describe('phoneValidationInput', () => {
  it('normalizes 10-digit input', () => {
    const out = phoneValidationInput.parse({ phone: '2069735100' });
    expect(out.phone).toBe('2069735100');
  });

  it('normalizes E.164 input by stripping +1', () => {
    const out = phoneValidationInput.parse({ phone: '+12069735100' });
    expect(out.phone).toBe('2069735100');
  });

  it('normalizes formatted input', () => {
    const out = phoneValidationInput.parse({ phone: '(206) 973-5100' });
    expect(out.phone).toBe('2069735100');
  });

  it('rejects short input', () => {
    expect(phoneValidationInput.safeParse({ phone: '12345' }).success).toBe(false);
  });

  it('rejects non-US 11-digit (no leading 1)', () => {
    expect(phoneValidationInput.safeParse({ phone: '99999999999' }).success).toBe(false);
  });

  it('rejects missing phone', () => {
    expect(phoneValidationInput.safeParse({}).success).toBe(false);
  });
});

describe('reversePhoneInput', () => {
  it('normalizes the same way as phoneValidationInput', () => {
    expect(reversePhoneInput.parse({ phone: '+12069735100' }).phone).toBe('2069735100');
  });
});

describe('phoneValidationResponse', () => {
  it('parses a realistic v3.0 phone_intel response', () => {
    const ok = phoneValidationResponse.safeParse({
      id: 'Phone.abc-def',
      phone_number: '+12069735100',
      is_valid: true,
      activity_score: 90,
      country_calling_code: '1',
      country_code: 'US',
      country_name: 'United States',
      line_type: 'Mobile',
      carrier: 'Verizon Wireless',
      is_prepaid: false,
    });
    expect(ok.success).toBe(true);
  });

  it('allows extra fields and nulls', () => {
    const ok = phoneValidationResponse.safeParse({
      phone_number: null,
      is_valid: null,
      activity_score: null,
      something_new: 'extra',
    });
    expect(ok.success).toBe(true);
  });

  it('parses is_litigator_risk when add-on enabled', () => {
    const ok = phoneValidationResponse.safeParse({
      phone_number: '+12069735100',
      is_valid: true,
      is_litigator_risk: false,
    });
    expect(ok.success).toBe(true);
  });
});

describe('reversePhoneResponse', () => {
  it('parses a realistic v3.2 phone response with owners', () => {
    const ok = reversePhoneResponse.safeParse({
      id: 'Phone.abc',
      phone_number: '+12069735100',
      is_valid: true,
      country_calling_code: '1',
      line_type: 'Landline',
      carrier: 'CenturyLink',
      is_prepaid: false,
      is_commercial: false,
      owners: [
        {
          id: 'Person.xyz',
          firstname: 'Jane',
          middlename: 'A',
          lastname: 'Doe',
          type: 'Person',
          age_range: '40-49',
          gender: 'Female',
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('parses an empty owners array', () => {
    const ok = reversePhoneResponse.safeParse({
      phone_number: '+12069735100',
      is_valid: true,
      owners: [],
    });
    expect(ok.success).toBe(true);
  });

  it('defaults owners to [] when missing', () => {
    const parsed = reversePhoneResponse.parse({
      phone_number: '+12069735100',
      is_valid: true,
    });
    expect(parsed.owners).toEqual([]);
  });
});
