import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { reversePhoneInput, reversePhoneResponse } from '../schemas.js';
import { errorResult } from './phone-validation.js';

const DESCRIPTION = `Look up the owner(s) of a phone number. Returns all linked identity records — names, types (Person/Business), age ranges, and more. Calls TrestleIQ Reverse Phone API v3.2 (/3.2/phone). Use when the user asks: "Who owns this number?", "Whose phone is this?", or "Is X a business line?". This call is more expensive than trestle_phone_validation — don't use it just to check validity.`;

function ownerDisplayName(o: {
  name?: string | null;
  firstname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
}): string {
  if (o.name && o.name.trim()) return o.name.trim();
  const parts = [o.firstname, o.middlename, o.lastname].filter(Boolean) as string[];
  return parts.length ? parts.join(' ') : '(unknown)';
}

export const reversePhoneTool = {
  name: 'trestle_reverse_phone',
  description: DESCRIPTION,
  inputSchema: reversePhoneInput,

  async handler(
    args: z.infer<typeof reversePhoneInput>,
    client: TrestleClient,
  ) {
    try {
      const raw = await client.get('/3.2/phone', { phone: args.phone });
      const data = reversePhoneResponse.parse(raw);

      const header: string[] = [];
      if (data.phone_number) header.push(`Phone: ${data.phone_number}`);
      if (data.line_type) header.push(`Line type: ${data.line_type}`);
      if (data.carrier) header.push(`Carrier: ${data.carrier}`);

      let text: string;
      if (data.owners.length === 0) {
        text = `${header.join('\n')}\nNo owners on file.`;
      } else {
        const ownerLines = data.owners
          .map((o, i) => {
            const name = ownerDisplayName(o);
            const type = o.type ? ` (${o.type})` : '';
            const age = o.age_range ? ` [age ${o.age_range}]` : '';
            return `  ${i + 1}. ${name}${type}${age}`;
          })
          .join('\n');
        text = `${header.join('\n')}\nOwners:\n${ownerLines}`;
      }

      return {
        content: [{ type: 'text' as const, text }],
        structuredContent: data,
      };
    } catch (e) {
      return errorResult(e);
    }
  },
};
