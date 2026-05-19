# TrestleIQ Claude Code Plugin

Validate phone numbers and look up owners via the TrestleIQ API, directly from Claude Code conversations.

Status: **v0.1 walking skeleton** — phone validation + reverse phone lookup only. More endpoints coming.

## Install

Works the same in every Claude Code surface (CLI, desktop app, web at claude.ai/code, VS Code / JetBrains extensions). No `git clone`, no `npm install` — the plugin ships pre-built.

In a Claude Code session, run:

```
/plugin marketplace add shivang-trestle/trestleiq-claude-plugin
/plugin install trestleiq@trestleiq-claude-plugin
```

Then restart Claude Code so the MCP server loads.

### Verify the install

In a fresh session, run `/plugin` — you should see `trestleiq` v0.1.0 in the list. Then try:

> *"Is +14155552671 a valid phone number?"*

Claude should call the `trestle_phone_validation` tool and answer in prose.

## Configure your API key

After install, run `/trestle-setup` inside Claude Code. You'll be prompted for your TrestleIQ API key — grab it from https://portal.trestleiq.com in either of these places:

- the **API Keys** tab of your profile drawer, **or**
- any product's **details page** (the key is shown alongside the product info).

The script validates the key against the live API, then writes `export TRESTLE_API_KEY="..."` to your shell rc (`~/.zshrc`, `~/.bashrc`, fish config, or `~/.profile` depending on `$SHELL`). Restart your terminal and Claude Code to activate.

### Already manage secrets your own way?

If you use direnv, 1Password CLI, vault, or any other tool to inject env vars, just set `TRESTLE_API_KEY` in your environment before launching Claude Code. The MCP server reads it directly and skips the rc-file flow.

## Tools

| Tool | What it answers |
|---|---|
| `trestle_phone_validation` | Is this number valid? What carrier? What line type (Mobile/Landline/VOIP)? |
| `trestle_reverse_phone` | Who owns this number? (Person or Business, with name) |

## Uninstall

```
/plugin uninstall trestleiq@trestleiq-claude-plugin
/plugin marketplace remove trestleiq-claude-plugin
```

To clear the key from your shell rc, edit the file and remove the line tagged `# trestleiq-claude-plugin`.

## Status & roadmap

- **v0.1 (current)** — phone validation, reverse phone, setup command, workflow skill.
- **v0.2** — caller identification, smart CNAM, real contact verification.
- **v0.3** — reverse address, phone feedback.

## License

MIT.
