import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { TrestleError } from '../errors.js';
import { phoneValidationInput, phoneValidationResponse } from '../schemas.js';

const DESCRIPTION = `Validate a phone number. Returns validity, carrier, line type (Mobile/Landline/VoIP), activity score, and country info. Calls TrestleIQ Phone Validation API v3.0 (/3.0/phone_intel). Use when the user asks: "Is this number valid?", "What carrier is X?", "Is X a mobile number?", or "Is X disconnected?". Do NOT use this for ownership lookup — use trestle_reverse_phone instead.`;

export const phoneValidationTool = {
  name: 'trestle_phone_validation',
  description: DESCRIPTION,
  inputSchema: phoneValidationInput,

  async handler(
    args: z.infer<typeof phoneValidationInput>,
    client: TrestleClient,
  ) {
    try {
      const raw = await client.get('/3.0/phone_intel', { phone: args.phone });
      const data = phoneValidationResponse.parse(raw);
      const lines: string[] = [];
      if (data.phone_number) lines.push(`Phone: ${data.phone_number}`);
      lines.push(`Valid: ${data.is_valid ? 'yes' : 'no'}`);
      if (data.country_code) lines.push(`Country: ${data.country_code}`);
      if (data.line_type) lines.push(`Line type: ${data.line_type}`);
      if (data.carrier) lines.push(`Carrier: ${data.carrier}`);
      if (typeof data.is_prepaid === 'boolean') lines.push(`Prepaid: ${data.is_prepaid ? 'yes' : 'no'}`);
      if (typeof data.activity_score === 'number') lines.push(`Activity score: ${data.activity_score}`);
      if (data.is_litigator_risk === true) lines.push(`Litigator risk: yes`);
      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
        structuredContent: data,
      };
    } catch (e) {
      return errorResult(e);
    }
  },
};

export function errorResult(e: unknown) {
  if (e instanceof TrestleError) {
    const hint =
      e.kind === 'auth'
        ? ' — run /trestle-setup to configure your TRESTLE_API_KEY.'
        : e.kind === 'rate_limit'
        ? ' — you are being rate limited; wait and try again.'
        : '';
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `${e.message}${hint}` }],
      structuredContent: e.toContent(),
    };
  }
  const msg = e instanceof Error ? e.message : String(e);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: `Unexpected error: ${msg}` }],
  };
}
