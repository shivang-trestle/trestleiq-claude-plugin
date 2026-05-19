import { describe, it, expect } from 'vitest';
import { TrestleClient } from '../src/client.js';
import { phoneValidationTool } from '../src/tools/phone-validation.js';
import { reversePhoneTool } from '../src/tools/reverse-phone.js';

const key = process.env.TRESTLE_API_KEY;
const run = key ? describe : describe.skip;

run('live API smoke (requires TRESTLE_API_KEY)', () => {
  it('phone-validation returns a parseable response', async () => {
    const client = new TrestleClient(key!);
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      client,
    );
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Phone:');
  }, 15_000);

  it('reverse-phone returns a parseable response', async () => {
    const client = new TrestleClient(key!);
    const result = await reversePhoneTool.handler(
      { phone: '+14155552671' },
      client,
    );
    expect(result.isError).toBeFalsy();
  }, 15_000);

  it('returns isError(auth) with a bad key', async () => {
    const client = new TrestleClient('definitely-not-a-valid-key-xxxxx');
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      client,
    );
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text.toLowerCase()).toContain('/trestle-setup');
  }, 15_000);
});
