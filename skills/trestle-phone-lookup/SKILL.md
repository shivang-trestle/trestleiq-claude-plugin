---
name: trestle-phone-lookup
description: Use when the user asks to validate a phone number, identify its carrier or line type, or look up the owner of a phone number. Invokes the trestleiq MCP server's phone tools.
---

# Trestle phone lookup

This plugin exposes two MCP tools backed by TrestleIQ's API. Pick the right one based on what the user actually asked for.

## Tool selection

| If the user asks... | Use this tool |
|---|---|
| "Is +X a valid number?" | `trestle_phone_validation` |
| "What carrier is +X on?" | `trestle_phone_validation` |
| "Is +X a mobile or landline?" | `trestle_phone_validation` |
| "Who owns +X?" | `trestle_reverse_phone` |
| "Whose phone is +X?" | `trestle_reverse_phone` |
| "Is +X a business line?" | `trestle_reverse_phone` (`type` field on owner) |

**Cost awareness:** `trestle_reverse_phone` consumes more Trestle credits than `trestle_phone_validation`. Do not call reverse-phone just to confirm validity — call phone-validation first if validity is the only question.

## Input handling

- Always pass phone numbers in **E.164** format (e.g. `+14155552671`).
- If the user gives a US 10-digit number like `415 555 2671`, normalize to `+14155552671` before calling — don't ask the user to do it.
- If the number is genuinely ambiguous (no country code, not 10 digits), ask once for the country.

## Output handling

- Do not dump raw JSON at the user. Summarize: validity, line type, carrier, owners.
- If the response includes fields you don't recognize, mention them only if the user asked for that specific information.
- Quote owner names verbatim — never paraphrase a name.

## Error handling

- If the tool returns `isError` with text mentioning `/trestle-setup`, tell the user to run that command and stop — do not retry.
- If the tool returns a rate-limit error, do not auto-retry. Tell the user, suggest they wait a minute.
- If the tool returns an invalid_input error, re-examine the phone number with the user.

## What this plugin does NOT do (yet)

- Reverse address lookup (`/reverse-address`) — coming in v0.2.
- Caller ID-style top-owner lookup (`/caller-identification`) — coming in v0.2.
- Identity-cross-check (`/real-contact`) — coming in v0.2.

If the user asks for one of these, say "not yet supported in this version, expected in v0.2" rather than misusing the tools you do have.
