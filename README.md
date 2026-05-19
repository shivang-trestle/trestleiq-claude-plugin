# TrestleIQ Claude Code Plugin

Validate phone numbers and look up owners via the TrestleIQ API, directly from Claude Code conversations.

Status: **v0.1 walking skeleton** — phone validation + reverse phone lookup only. More endpoints coming.

## Install

(local dev install steps land here in Task 11)

## Configure

Run `/trestle-setup` inside Claude Code after install. The command prompts for your API key from https://portal.trestleiq.com/account/api-keys, validates it against the API, and exports it to your shell rc.

Power users: set `TRESTLE_API_KEY` in your environment instead.

## Tools

- `trestle_phone_validation` — Is this number valid? What carrier? What line type?
- `trestle_reverse_phone` — Who owns this number?
