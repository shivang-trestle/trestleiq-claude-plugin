# Plan: TrestleIQ Claude Code Plugin

## Context

The user wants TrestleIQ customers to call their REST APIs (`api.trestleiq.com`) directly from inside a Claude Code conversation. The natural delivery vehicle is a Claude Code **plugin** distributed via the public marketplace.

Trestle currently exposes seven endpoints (all API-key auth, GET-only except `phone-feedback`):

1. Phone Validation
2. Real Contact
3. Reverse Phone
4. Caller Identification
5. Smart CNAM
6. Reverse Address
7. Phone Feedback (POST)

The user asked whether to use `plugin-dev:create-plugin` or `skill-creator:skill-creator`. That framing is the wrong axis: a plugin is a *container* that can hold skills, slash commands, agents, and MCP servers. For a 7-endpoint REST API targeting public distribution, the right answer is a **plugin whose load-bearing component is an MCP server**, with skills and a setup command alongside it. `plugin-dev:create-plugin` is the umbrella workflow; `skill-creator:skill-creator` (standalone-skill flow) is not used here.

## Decisions captured from brainstorming

| Question | Decision |
|---|---|
| API scope (eventual) | All 7 Trestle endpoints |
| Invocation model | Hybrid: MCP server + skills + setup command |
| Distribution | Public Claude Code marketplace |
| Language | TypeScript |
| API-key UX | `/trestle-setup` slash command prompts for key, validates against Trestle, writes export to `~/.zshrc` or `~/.bashrc` with a marker comment; MCP server reads `TRESTLE_API_KEY` env var |
| HTTP client | Hand-rolled with native `fetch` + `zod` (no Trestle SDK exists) |
| Build path | **B — Walking skeleton.** v0.1 ships 2 endpoints end-to-end; expand to 7 in v0.2–v1.0 |

## Architecture

```
trestleiq-claude-plugin/                  ← repo root
├── .claude-plugin/
│   └── plugin.json                       ← manifest (name, version, mcpServers, commands, skills)
├── commands/
│   └── trestle-setup.md                  ← slash command spec (calls setup script)
├── skills/
│   └── trestle-phone-lookup/
│       └── SKILL.md                      ← when/how to use phone tools
├── mcp-server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                      ← MCP server entrypoint (stdio transport)
│   │   ├── client.ts                     ← Trestle HTTP client (fetch + auth header + retries)
│   │   ├── schemas.ts                    ← Zod request/response schemas per endpoint
│   │   └── tools/
│   │       ├── phone-validation.ts       ← tool registration + handler (v0.1)
│   │       └── reverse-phone.ts          ← tool registration + handler (v0.1)
│   └── tests/
│       ├── client.test.ts                ← mocked-fetch unit tests
│       └── live-smoke.test.ts            ← real-API smoke test (gated on TRESTLE_API_KEY)
├── scripts/
│   └── setup.ts                          ← invoked by /trestle-setup; prompts, validates, writes rc
├── README.md
├── LICENSE
└── package.json                          ← workspace root
```

### Why this layout

- **`.claude-plugin/plugin.json`** is the canonical Claude Code plugin manifest path — discoverable by both Claude Code CLI and marketplace tooling.
- **`mcp-server/` is a workspace package** so it can ship its own `package.json`, get type-checked independently, and be referenced by the plugin manifest as `command: "node"`, `args: ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.js"]`.
- **One file per tool under `tools/`** keeps each endpoint's input schema + handler + description colocated and reviewable in isolation. When v0.2 adds 5 more endpoints, the pattern is "add a file, register in `index.ts`."
- **`scripts/setup.ts`** is plain Node, not part of the MCP server runtime; it's only invoked by the slash command.

## MCP tool surface (v0.1)

Two tools registered at server startup:

| Tool name | Endpoint | Required params | Optional params | Returns |
|---|---|---|---|---|
| `trestle_phone_validation` | `GET /phone-validation` | `phone` (E.164) | `country_hint` | `{ is_valid, line_type, carrier, country_code, ... }` |
| `trestle_reverse_phone` | `GET /reverse-phone` | `phone` (E.164) | none | `{ owners: [...], metadata: {...} }` |

Each tool description (the LLM-facing prompt that controls when Claude calls it) must explicitly say *what the tool answers* and *when not to use it* — e.g. "Use for ownership lookup of a known phone number. Do NOT use for caller-ID-style top-owner queries — use `trestle_caller_identification` instead (deferred to v0.2)."

Errors map to MCP `isError: true` with a structured `content[0].text` payload: `{ kind: "auth" | "rate_limit" | "invalid_input" | "upstream", message, http_status }`.

## Skill design (v0.1)

`skills/trestle-phone-lookup/SKILL.md` — one workflow skill that teaches Claude **when to reach for which tool** and **how to compose results**.

YAML frontmatter pattern (in-plugin variant):

```yaml
---
name: trestle-phone-lookup
description: Use when the user asks to validate, identify the owner of, or look up metadata about a phone number. Invokes Trestle MCP tools.
---
```

Body covers: tool selection table, common query phrasings → tool mapping, how to present results (don't dump JSON; summarize), credit-cost awareness (reverse-phone is more expensive than phone-validation), and error-handling guidance ("if 401, tell the user to run `/trestle-setup`").

## Slash command UX

`/trestle-setup` — the markdown command file in `commands/` instructs Claude to run `node ${CLAUDE_PLUGIN_ROOT}/scripts/setup.ts` via Bash. The script itself does the work — idempotent:

1. Detect existing `TRESTLE_API_KEY` (env var or rc file marker). If valid, exit with "already configured" message.
2. Prompt user for API key (with link to `portal.trestleiq.com/account/api-keys`).
3. Validate key by hitting `GET /phone-validation?phone=+15555551234` and checking for 200/401.
4. On success: append `export TRESTLE_API_KEY="<key>" # trestleiq-claude-plugin` to detected shell rc (`$SHELL` → rc file mapping for zsh/bash/fish).
5. Print "Restart Claude Code or `source ~/.zshrc` to activate."

## Auth & secrets

- Plugin **never logs the key**, never sends it anywhere except `api.trestleiq.com`, never writes it outside the shell rc.
- MCP server reads `process.env.TRESTLE_API_KEY` at startup; if missing, registers tools that return a friendly `isError` with instructions to run `/trestle-setup`.
- README documents the env var so users who manage secrets via direnv / 1Password / vault can opt out of the rc-write flow.

## Build sequence

**v0.1 — Walking skeleton (this plan's scope)**

1. Scaffold plugin via `plugin-dev:create-plugin` skill.
2. Build MCP server skeleton via `mcp-server-dev:build-mcp-server` skill (TS, stdio transport, `@modelcontextprotocol/sdk`).
3. Implement `client.ts` (fetch + bearer auth + 1 retry on 5xx) and `schemas.ts` (Zod for the two endpoints).
4. Implement the two tool handlers, register in `index.ts`.
5. Implement `/trestle-setup` command + `scripts/setup.ts`.
6. Author `trestle-phone-lookup` skill via `plugin-dev:skill-development` skill.
7. Write mocked tests (vitest) and a gated live smoke test.
8. Local install + manual end-to-end test in Claude Code.
9. Run `plugin-dev:plugin-validator` agent for final structural check.

**v0.2** — add `caller_identification`, `smart_cnam`, `real_contact`.
**v0.3** — add `reverse_address`, `phone_feedback` (POST), expand skill coverage.
**v1.0** — marketplace submission with full README, screenshots, example transcripts.

## Skills/agents invoked during this build (so you know what to call)

| Tool | When |
|---|---|
| `plugin-dev:create-plugin` (skill) | Step 1 — generates `plugin.json`, directory layout, manifest validation |
| `mcp-server-dev:build-mcp-server` (skill) | Step 2 — TS server scaffold with stdio + SDK boilerplate |
| `plugin-dev:skill-development` (skill) | Step 6 — author the in-plugin skill |
| `plugin-dev:command-development` (skill) | Step 5 — `/trestle-setup` markdown spec |
| `plugin-dev:plugin-validator` (agent) | Step 9 — final structural validation |
| `superpowers:test-driven-development` (skill) | Step 3, 4 — write tests before each tool handler |
| `superpowers:writing-plans` (skill) | After this plan is approved — break v0.1 into an executable task list |
| `context7` MCP | While coding — fetch current `@modelcontextprotocol/sdk` and `zod` docs |

**Not used:** `skill-creator:skill-creator` (standalone-skill flow, wrong target), `firecrawl:skill-gen` (option C, deferred — could revisit for auto-drafting v0.2+ skills).

## Critical files to create

All paths relative to repo root, all new (greenfield):

- `.claude-plugin/plugin.json`
- `mcp-server/src/index.ts`
- `mcp-server/src/client.ts`
- `mcp-server/src/schemas.ts`
- `mcp-server/src/tools/phone-validation.ts`
- `mcp-server/src/tools/reverse-phone.ts`
- `mcp-server/tests/client.test.ts`
- `mcp-server/tests/live-smoke.test.ts`
- `commands/trestle-setup.md`
- `skills/trestle-phone-lookup/SKILL.md`
- `scripts/setup.ts`
- `README.md`
- `package.json`, `tsconfig.json`, `vitest.config.ts`

## Verification

End-to-end test once v0.1 is implemented:

1. `cd trestleiq-claude-plugin && npm install && npm run build`
2. Install locally per current Claude Code plugin docs (typically symlink the repo into `~/.claude/plugins/` or use the marketplace `/plugin` command for local paths — verify exact flow with `plugin-dev:plugin-structure` skill at execution time).
3. In a fresh Claude Code session, run `/trestle-setup` — confirm it prompts, validates against real API, writes shell rc.
4. Reload shell. Run `claude` again.
5. Ask conversationally: *"Is +14155552671 a valid phone number?"* — confirm Claude calls `trestle_phone_validation` (visible in tool-call inspector) and returns parsed metadata, not raw JSON.
6. Ask: *"Who owns +14155552671?"* — confirm Claude calls `trestle_reverse_phone`.
7. Run `npm test` — mocked unit tests pass.
8. Run `TRESTLE_API_KEY=... npm run test:live` — real API smoke test passes.
9. Run `plugin-dev:plugin-validator` agent against repo — no errors.
10. Unset `TRESTLE_API_KEY`, restart Claude Code, ask a phone question — confirm graceful error pointing user back to `/trestle-setup`.

## Open risks (worth flagging now)

- **Marketplace approval flow** — Anthropic's plugin marketplace acceptance criteria may evolve; build to current published guidelines and budget for one round of revisions.
- **API-key in shell rc** — security-conscious users will object. The README must document the env-var-only path clearly as a first-class alternative.
- **Tool description quality** — Claude's decision to call the right tool depends entirely on the description prompt. Plan one focused review pass on those strings after v0.1 works mechanically.
- **Rate limits unknown** — docs don't specify. Client should expose a hook for retry-after handling once limits are observed in practice.
