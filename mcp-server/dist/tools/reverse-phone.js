import { reversePhoneInput, reversePhoneResponse } from '../schemas.js';
import { errorResult } from './phone-validation.js';
const DESCRIPTION = `Look up the owner(s) of a phone number. Returns names and entity types (Person/Business). Use when the user asks: "Who owns this number?", "Whose phone is this?", or "Is X a personal or business line?". This call is more expensive than trestle_phone_validation — don't use it just to check if a number is valid.`;
export const reversePhoneTool = {
    name: 'trestle_reverse_phone',
    description: DESCRIPTION,
    inputSchema: reversePhoneInput,
    async handler(args, client) {
        try {
            const raw = await client.get('/reverse-phone', { phone: args.phone });
            const data = reversePhoneResponse.parse(raw);
            let text;
            if (data.owners.length === 0) {
                text = `Phone: ${data.phone_number}\nNo owners on file.`;
            }
            else {
                const ownerLines = data.owners
                    .map((o, i) => `  ${i + 1}. ${o.name ?? '(unknown)'} (${o.type ?? 'unknown'})`)
                    .join('\n');
                text = `Phone: ${data.phone_number}\nOwners:\n${ownerLines}`;
            }
            return {
                content: [{ type: 'text', text }],
                structuredContent: data,
            };
        }
        catch (e) {
            return errorResult(e);
        }
    },
};
//# sourceMappingURL=reverse-phone.js.map