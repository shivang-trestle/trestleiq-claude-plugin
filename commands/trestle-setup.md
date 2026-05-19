---
description: Configure your TrestleIQ API key for the trestleiq plugin.
---

# /trestle-setup

The user wants to install or refresh their TrestleIQ API key for this plugin.

Run the setup helper script using Bash:

```
node ${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/setup.js
```

The script will:

1. Detect if `TRESTLE_API_KEY` is already set in the environment — exit early if so.
2. Detect if a key is already configured in the user's shell rc file — exit early if so.
3. Prompt the user to paste a key. The key is available at https://portal.trestleiq.com — in the **API Keys** tab of the profile drawer, or on any product's details page.
4. Validate the key by hitting `GET /phone-validation` against `api.trestleiq.com`.
5. On success, append `export TRESTLE_API_KEY="<key>" # trestleiq-claude-plugin` to the appropriate shell rc.
6. Tell the user to `source` the rc file (or restart their terminal) and then restart Claude Code so the MCP server picks up the env var.

After the script completes, remind the user to restart Claude Code if it printed instructions to do so. Do not echo the API key back to the user.
