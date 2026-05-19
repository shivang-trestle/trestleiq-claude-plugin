import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { TrestleError } from '../errors.js';
import { phoneValidationInput, phoneValidationResponse } from '../schemas.js';

const DESCRIPTION = `Validate a phone number. Returns validity, carrier, line type (Mobile/Landline/VOIP), and country code. Use when the user asks: "Is this number valid?", "What carrier is X?", or "Is X a mobile number?". Do NOT use this for ownership lookup — use trestle_reverse_phone instead.`;

export const phoneValidationTool = {
  name: 'trestle_phone_validation',
  description: DESCRIPTION,
  inputSchema: phoneValidationInput,

  async handler(
    args: z.infer<typeof phoneValidationInput>,
    client: TrestleClient,
  ) {
    try {
      const raw = await client.get('/phone-validation', {
        phone: args.phone,
        country_hint: args.country_hint,
      });
      const data = phoneValidationResponse.parse(raw);
      const lines: string[] = [
        `Phone: ${data.phone_number}`,
        `Valid: ${data.is_valid ? 'yes' : 'no'}`,
      ];
      if (data.country_code) lines.push(`Country: ${data.country_code}`);
      if (data.line_type) lines.push(`Line type: ${data.line_type}`);
      if (data.carrier) lines.push(`Carrier: ${data.carrier}`);
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
