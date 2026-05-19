# TrestleIQ Hosted MCP Server — v1.0 Design

> **Status:** Design — supersedes the stdio-only architecture from v0.1 for desktop-app users. v0.1 stdio path remains supported as a fallback for self-hosted / air-gapped users.

## Context & motivation

v0.1 ships a stdio MCP server (`mcp-server/dist/index.js`) invoked via `command: "node"` in the plugin manifest. That requires Node ≥20 on the end user's system.

The TrestleIQ customer base includes **Claude Code desktop app users** who may not have system Node installed. The desktop app does not expose its bundled Node to spawned MCP servers — `command: "node"` resolves against the user's `$PATH`, and `node: command not found` is the failure mode.

The architecturally correct fix is **a remote MCP server hosted at a TrestleIQ-controlled HTTPS endpoint** (working name: `mcp.trestleiq.com`). The plugin then becomes a thin client config plus skills — same model as the official Notion plugin (`https://mcp.notion.com/mcp`). Zero local runtime dependency, works identically in CLI, desktop, web, and IDE Claude UIs.

## High-level architecture

```
┌─────────────────────────┐                        ┌──────────────────────────────────┐
│  Claude Code (any UI)   │   HTTPS + Bearer       │  mcp.trestleiq.com               │
│  reads plugin .mcp.json │  ────────────────────► │  Vercel Fluid Compute function   │
│  opens MCP session      │  (Streamable HTTP)     │  webStandardStreamableHttp        │
│                         │                        │  transport + MCP tools           │
└─────────────────────────┘                        └──────────────────┬───────────────┘
                                                                      │
                                                                      │ same TrestleClient
                                                                      │ as v0.1 stdio server
                                                                      ▼
                                                          ┌──────────────────────┐
                                                          │  api.trestleiq.com   │
                                                          │  (existing REST)     │
                                                          └──────────────────────┘
```

### Plugin-side delta

`.claude-plugin/plugin.json` `mcpServers` field changes from:

```json
"mcpServers": {
  "trestleiq": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.js"]
  }
}
```

to:

```json
"mcpServers": {
  "trestleiq": {
    "type": "http",
    "url": "https://mcp.trestleiq.com/mcp"
  }
}
```

The `mcp-server/` workspace is **kept in the repo** as the self-hosted / dev fallback, but the default install path no longer requires it.

### Server-side architecture

New workspace `server/` (Vercel Fluid Compute deployment):

```
server/
├── package.json                 # @trestleiq/hosted-mcp
├── tsconfig.json
├── vercel.ts                    # Vercel config (TypeScript)
├── api/
│   └── mcp.ts                   # single HTTP handler → webStandardStreamableHTTPServerTransport
└── src/                         # tools/client/schemas/errors (shared with stdio server)
```

The handler at `api/mcp.ts`:

1. Reads `Authorization: Bearer <key>` header per request.
2. Constructs a fresh `McpServer` + `webStandardStreamableHTTPServerTransport` per request (stateless mode; Fluid Compute keeps instances warm).
3. Registers the same two tools (`trestle_phone_validation`, `trestle_reverse_phone`) — wired to a `TrestleClient` constructed with the request's API key.
4. Returns the streamable HTTP response.

## Auth design

Three viable patterns. **Recommended: pattern A** for v1.0, with a roadmap to pattern C.

### A. Bearer token from user's plugin config (Recommended)

User runs `/trestle-setup`. The script no longer writes to shell rc. Instead, it stores the API key in **Claude Code's per-plugin secret store** (mechanism TBD — research item below). The plugin's HTTP MCP client reads it on each request and adds `Authorization: Bearer <key>`.

The hosted MCP server validates the bearer token against `api.trestleiq.com` on the first request of each MCP session and short-circuits with `401 → MCP isError` if rejected.

**Pros:** Familiar API-key UX from v0.1, no new identity infra. Trestle bills exactly as today.
**Cons:** API key crosses the wire on every request (mitigated by HTTPS).

### B. OAuth 2.0 (RFC 6749 + RFC 8693)

TrestleIQ stands up an OAuth authorization server (or uses an IdP). Claude Code natively handles OAuth for HTTP MCP servers — user clicks "Sign in", browser opens, consent, redirected back. Server gets a per-user access token.

**Pros:** No API key handling. Per-user scoping, revocation, rotation. Best long-term posture.
**Cons:** OAuth-server engineering. Identity mapping (Trestle API key ↔ Trestle OAuth user) required.

### C. mTLS / signed per-customer JWTs

Trestle issues per-customer client certs or signed JWTs. Used for B2B-only.
**Cons:** Overkill for v1.0; ship B if/when needed.

### Decision points for the Trestle product team

1. **Visibility of API key**: comfortable with user pasting the key into Claude Code plugin config, with key in transit on every MCP request? (Yes → A. No → B.)
2. **Billing granularity**: per-key (as today) or per-end-user (requires user identity → B)?
3. **Revocation UX**: who revokes a leaked key — the customer admin (today) or self-serve from the same UI as Claude install (preferred → B)?

## Deployment plan (TrestleIQ infra)

1. **DNS**: `mcp.trestleiq.com` → Vercel.
2. **Vercel project**: connect this repo, set deploy root = `server/`.
3. **Env vars**: none at deploy time (key flows per-request). Optional: `TRESTLE_API_BASE` if redirecting to staging.
4. **Region**: `iad1` (US East — closest to `api.trestleiq.com`'s primary region; minimizes downstream latency).
5. **Runtime**: Node 24 LTS (default).
6. **Compute**: Fluid Compute (default since 2025). Reuse across concurrent requests reduces cold start.
7. **Observability**: Vercel built-in logs; add Sentry for error tracking pre-GA.

## Migration plan

1. **v0.1.x continues to ship** as the stdio plugin. No breaking changes.
2. **v1.0 release** publishes the hosted endpoint and ships a new plugin version whose `plugin.json` references `type: "http"`. End users running `/plugin update trestleiq` get switched.
3. **Cutover window**: keep `mcp-server/dist/` (stdio) in the repo and document `claude-plugin/plugin.local.json` opt-in for self-hosters.
4. **Deprecate stdio**: after 3–6 months of v1.x traction. Even then, leave the workspace in the repo for forkability.

## Open research items (handled before code-complete)

- **Claude Code per-plugin secret store API**: what's the actual mechanism for `/trestle-setup` to stash a header that the HTTP transport then attaches? Plugin manifest static `Authorization` header? `secrets` field? OAuth-only? Verify against Claude Code docs at execution time.
- **Streamable HTTP session model**: stateless per-request vs sticky session — Vercel Fluid Compute handles both, but stateless is simpler. Default to stateless unless we add session-scoped state later (e.g. result caching).
- **Rate limiting at the edge**: Vercel has built-in DDoS protection; do we add per-key rate limits on top via Vercel KV / Upstash? Defer to v1.1.

## What this design does NOT change

- The TrestleClient HTTP wrapper, Zod schemas, tool descriptions, and `TrestleError` mapping all stay identical — they're transport-agnostic. The hosted server imports the same files.
- The workflow skill (`trestle-phone-lookup`) is unchanged; tool names and behaviors are preserved.
- Public marketplace listing is unchanged (same `marketplace.json`).
