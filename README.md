# TrestleIQ Claude Code Plugin

Validate phone numbers and look up owners via the TrestleIQ API, directly from Claude Code conversations.

Status: **v0.1 walking skeleton** — phone validation + reverse phone lookup only. More endpoints coming.

## Install

### From source (local development)

```bash
git clone https://github.com/shivang-trestle/trestleiq-claude-plugin.git
cd trestleiq-claude-plugin
npm install
npm run build
```

Then, inside Claude Code:

```
/plugin marketplace add /absolute/path/to/trestleiq-claude-plugin
/plugin install trestleiq@trestleiq-claude-plugin
```

Restart Claude Code so the MCP server is picked up.

### Verify the install

In a fresh Claude Code session:

```
/plugin
```

You should see `trestleiq` v0.1.0 listed.

Then ask: *"Is +14155552671 a valid phone number?"* — Claude should call the `trestle_phone_validation` tool.

## Configure

Run `/trestle-setup` inside Claude Code after install. The command prompts for your API key from https://portal.trestleiq.com/account/api-keys, validates it against the API, and exports it to your shell rc.

Power users: set `TRESTLE_API_KEY` in your environment instead.

## Tools

- `trestle_phone_validation` — Is this number valid? What carrier? What line type?
- `trestle_reverse_phone` — Who owns this number?
