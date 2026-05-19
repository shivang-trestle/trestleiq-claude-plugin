# TrestleIQ Claude Code Plugin v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a walking-skeleton Claude Code plugin (`trestleiq`) that exposes two TrestleIQ REST endpoints (`/phone-validation`, `/reverse-phone`) as native MCP tools, ships one workflow skill and one `/trestle-setup` slash command, and installs locally in a development environment.

**Architecture:** Plugin repo at cwd root. MCP server is a workspace TS package at `mcp-server/` using `@modelcontextprotocol/server` with stdio transport; tool handlers delegate to a shared `TrestleClient` (hand-rolled `fetch` + Zod + retry). Skills and commands are markdown loaded by Claude Code's plugin loader.

**Tech Stack:** TypeScript 5.x, Node.js ≥20, `@modelcontextprotocol/server`, `zod` v4, `vitest`, `@modelcontextprotocol/inspector` (manual MCP smoke), npm workspaces.

---

## File Structure

```
trestleiq-skills/                          ← cwd, becomes plugin repo root
├── .claude-plugin/
│   └── plugin.json                        ← plugin manifest
├── .gitignore
├── README.md
├── LICENSE
├── package.json                           ← npm workspaces root
├── commands/
│   └── trestle-setup.md                   ← slash command spec
├── skills/
│   └── trestle-phone-lookup/
│       └── SKILL.md
├── scripts/
│   └── setup.ts                           ← invoked by /trestle-setup
├── mcp-server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts                       ← MCP server entrypoint
│   │   ├── client.ts                      ← TrestleClient (fetch + auth + retry)
│   │   ├── errors.ts                      ← typed Trestle error class
│   │   ├── schemas.ts                     ← Zod input/output schemas
│   │   └── tools/
│   │       ├── phone-validation.ts
│   │       └── reverse-phone.ts
│   └── tests/
│       ├── client.test.ts
│       ├── phone-validation.test.ts
│       ├── reverse-phone.test.ts
│       └── live-smoke.test.ts             ← gated on TRESTLE_API_KEY
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-05-19-trestleiq-plugin-design.md   ← copy of approved plan
        └── plans/
            └── 2026-05-19-trestleiq-plugin-v0.1.md     ← this file
```

### Responsibilities

- `client.ts` — single source of HTTP truth. Owns auth header, base URL, retry policy, error mapping. Returns parsed JSON; throws typed `TrestleError`.
- `errors.ts` — `TrestleError` class with `kind: "auth" | "rate_limit" | "invalid_input" | "upstream" | "network"`.
- `schemas.ts` — Zod schemas, one pair (request + response) per endpoint. Exported for tests and tool handlers.
- `tools/*.ts` — one file per MCP tool. Each exports a `{ name, description, inputSchema, handler }` object. Pure: takes `(args, client)`, returns `CallToolResult`.
- `index.ts` — wires `TrestleClient` (from env) + tool array into `McpServer`, connects stdio transport. Logs to stderr only.
- `scripts/setup.ts` — standalone CLI script: prompts for key, validates via `client.ts`, writes shell rc.

---

## Task 0: Repo Scaffold and Manifest

**Files:**
- Create: `package.json`, `.gitignore`, `LICENSE`, `README.md`, `.claude-plugin/plugin.json`
- Create: `docs/superpowers/specs/2026-05-19-trestleiq-plugin-design.md` (copy of approved design plan)

- [ ] **Step 1: Initialize git and write `.gitignore`**

```bash
cd /Users/shivang/dev/trestleiq-skills
git init
```

`.gitignore`:
```
node_modules/
dist/
*.log
.env
.env.local
coverage/
.DS_Store
```

- [ ] **Step 2: Write workspace root `package.json`**

```json
{
  "name": "trestleiq-claude-plugin",
  "version": "0.1.0",
  "description": "Claude Code plugin for TrestleIQ identity and phone APIs",
  "private": true,
  "workspaces": ["mcp-server"],
  "scripts": {
    "build": "npm run build --workspace=mcp-server",
    "test": "npm run test --workspace=mcp-server",
    "test:live": "npm run test:live --workspace=mcp-server",
    "setup": "node --import tsx scripts/setup.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0"
  },
  "engines": {
    "node": ">=20"
  },
  "license": "MIT"
}
```

- [ ] **Step 3: Write `.claude-plugin/plugin.json`**

```json
{
  "name": "trestleiq",
  "version": "0.1.0",
  "description": "Validate phone numbers and look up owners via TrestleIQ APIs.",
  "author": "TrestleIQ",
  "homepage": "https://trestleiq.com",
  "mcpServers": {
    "trestleiq": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.js"]
    }
  }
}
```

- [ ] **Step 4: Copy approved design into specs folder**

```bash
mkdir -p docs/superpowers/specs
cp /Users/shivang/.claude/plans/what-skills-to-use-gleaming-boole.md \
   docs/superpowers/specs/2026-05-19-trestleiq-plugin-design.md
```

- [ ] **Step 5: Write minimal placeholder `README.md`**

```markdown
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
```

- [ ] **Step 6: Write `LICENSE` (MIT)** — standard MIT text with copyright holder "TrestleIQ".

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json .claude-plugin/ README.md LICENSE docs/
git commit -m "chore: scaffold trestleiq plugin repo

- workspace root package.json
- .claude-plugin/plugin.json manifest with MCP server entry
- README placeholder
- approved design copied to docs/superpowers/specs/"
```

---

## Task 1: MCP Server Workspace Scaffold

**Files:**
- Create: `mcp-server/package.json`, `mcp-server/tsconfig.json`, `mcp-server/vitest.config.ts`, `mcp-server/src/index.ts`

- [ ] **Step 1: Write `mcp-server/package.json`**

```json
{
  "name": "@trestleiq/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "trestleiq-mcp": "dist/index.js"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:live": "vitest run tests/live-smoke.test.ts",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/server": "^1.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `mcp-server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Write `mcp-server/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/live-smoke.test.ts', 'node_modules/**'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Write placeholder `mcp-server/src/index.ts` so tsc/vitest can resolve the workspace**

```ts
// Replaced fully in Task 6.
console.error('trestleiq MCP server placeholder');
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/shivang/dev/trestleiq-skills
npm install
```

Expected: clean install, no peer-dep warnings other than from vitest (acceptable).

- [ ] **Step 6: Verify clean type-check**

```bash
npm run build --workspace=mcp-server
```

Expected: builds `mcp-server/dist/index.js` with no errors.

- [ ] **Step 7: Commit**

```bash
git add mcp-server/ package-lock.json
git commit -m "chore(mcp-server): scaffold TS workspace package

- package.json with MCP SDK + zod + vitest
- tsconfig targeting Node 20 ESM
- vitest config excluding live-smoke by default"
```

---

## Task 2: TrestleError Typed Error Class (TDD)

**Files:**
- Create: `mcp-server/src/errors.ts`
- Test: `mcp-server/tests/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// mcp-server/tests/errors.test.ts
import { describe, it, expect } from 'vitest';
import { TrestleError } from '../src/errors.js';

describe('TrestleError', () => {
  it('carries kind, message, and http_status', () => {
    const err = new TrestleError('auth', 'Invalid API key', 401);
    expect(err.kind).toBe('auth');
    expect(err.message).toBe('Invalid API key');
    expect(err.http_status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });

  it('http_status is undefined for network errors', () => {
    const err = new TrestleError('network', 'ECONNREFUSED');
    expect(err.http_status).toBeUndefined();
  });

  it('toContent returns MCP-shaped error content', () => {
    const err = new TrestleError('rate_limit', 'Slow down', 429);
    expect(err.toContent()).toEqual({
      kind: 'rate_limit',
      message: 'Slow down',
      http_status: 429,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=mcp-server`
Expected: FAIL — `Cannot find module '../src/errors.js'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// mcp-server/src/errors.ts
export type TrestleErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'invalid_input'
  | 'upstream'
  | 'network';

export class TrestleError extends Error {
  constructor(
    public readonly kind: TrestleErrorKind,
    message: string,
    public readonly http_status?: number,
  ) {
    super(message);
    this.name = 'TrestleError';
  }

  toContent() {
    return {
      kind: this.kind,
      message: this.message,
      http_status: this.http_status,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=mcp-server -- errors`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/errors.ts mcp-server/tests/errors.test.ts
git commit -m "feat(mcp-server): add TrestleError typed error class

- kind discriminator for downstream error mapping
- toContent() helper for MCP isError responses"
```

---

## Task 3: Zod Schemas for Phone Validation + Reverse Phone (TDD)

**Files:**
- Create: `mcp-server/src/schemas.ts`
- Test: `mcp-server/tests/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// mcp-server/tests/schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  phoneValidationInput,
  reversePhoneInput,
  phoneValidationResponse,
  reversePhoneResponse,
} from '../src/schemas.js';

describe('phoneValidationInput', () => {
  it('requires E.164 phone string', () => {
    expect(phoneValidationInput.safeParse({ phone: '+14155552671' }).success).toBe(true);
    expect(phoneValidationInput.safeParse({ phone: 'not-a-phone' }).success).toBe(false);
    expect(phoneValidationInput.safeParse({}).success).toBe(false);
  });

  it('accepts optional country_hint', () => {
    const parsed = phoneValidationInput.parse({ phone: '+14155552671', country_hint: 'US' });
    expect(parsed.country_hint).toBe('US');
  });
});

describe('reversePhoneInput', () => {
  it('requires E.164 phone string only', () => {
    expect(reversePhoneInput.safeParse({ phone: '+14155552671' }).success).toBe(true);
    expect(reversePhoneInput.safeParse({}).success).toBe(false);
  });
});

describe('phoneValidationResponse', () => {
  it('parses a minimal valid response', () => {
    const ok = phoneValidationResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
    });
    expect(ok.success).toBe(true);
  });

  it('allows extra fields without error', () => {
    const ok = phoneValidationResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
      carrier: 'Verizon',
      something_new: 'extra',
    });
    expect(ok.success).toBe(true);
  });
});

describe('reversePhoneResponse', () => {
  it('parses a response with owners array', () => {
    const ok = reversePhoneResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [{ name: 'Jane Doe', type: 'Person' }],
    });
    expect(ok.success).toBe(true);
  });

  it('parses an empty owners array', () => {
    const ok = reversePhoneResponse.safeParse({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [],
    });
    expect(ok.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=mcp-server -- schemas`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// mcp-server/src/schemas.ts
import * as z from 'zod/v4';

const e164 = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'phone must be E.164, e.g. +14155552671');

export const phoneValidationInput = z.object({
  phone: e164.describe('Phone number in E.164 format'),
  country_hint: z
    .string()
    .length(2)
    .optional()
    .describe('Two-letter country code hint, e.g. "US"'),
});
export type PhoneValidationInput = z.infer<typeof phoneValidationInput>;

export const reversePhoneInput = z.object({
  phone: e164.describe('Phone number in E.164 format'),
});
export type ReversePhoneInput = z.infer<typeof reversePhoneInput>;

// Responses use .passthrough() — Trestle can add fields without breaking us.
export const phoneValidationResponse = z
  .object({
    phone_number: z.string(),
    is_valid: z.boolean(),
    country_code: z.string().optional(),
    line_type: z.string().optional(),
    carrier: z.string().optional(),
  })
  .passthrough();
export type PhoneValidationResponse = z.infer<typeof phoneValidationResponse>;

const owner = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export const reversePhoneResponse = z
  .object({
    phone_number: z.string(),
    is_valid: z.boolean(),
    owners: z.array(owner),
  })
  .passthrough();
export type ReversePhoneResponse = z.infer<typeof reversePhoneResponse>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=mcp-server -- schemas`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/schemas.ts mcp-server/tests/schemas.test.ts
git commit -m "feat(mcp-server): add Zod schemas for v0.1 endpoints

- E.164 input validation shared between tools
- passthrough() responses so new Trestle fields don't break parsing
- exported TS types for handler signatures"
```

---

## Task 4: TrestleClient HTTP Wrapper (TDD)

**Files:**
- Create: `mcp-server/src/client.ts`
- Test: `mcp-server/tests/client.test.ts`

The client owns: auth header, base URL, query string assembly, retry on 5xx (once), error mapping to `TrestleError`.

- [ ] **Step 1: Write the failing test**

```ts
// mcp-server/tests/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrestleClient } from '../src/client.js';
import { TrestleError } from '../src/errors.js';

function mockFetch(impl: (req: Request) => Response | Promise<Response>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input as any, init);
    return impl(req);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('TrestleClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends API key in header on GET', async () => {
    const fetchFn = mockFetch(() =>
      new Response(JSON.stringify({ is_valid: true, phone_number: '+14155552671' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = new TrestleClient('test-key-123');
    await client.get('/phone-validation', { phone: '+14155552671' });

    const req = fetchFn.mock.calls[0][0] as RequestInfo;
    const headers = new Request(req as any, fetchFn.mock.calls[0][1]).headers;
    expect(headers.get('x-api-key')).toBe('test-key-123');
  });

  it('builds query string from params', async () => {
    const fetchFn = mockFetch(() =>
      new Response('{"is_valid":true,"phone_number":"+14155552671"}', { status: 200 }),
    );

    const client = new TrestleClient('k');
    await client.get('/phone-validation', { phone: '+14155552671', country_hint: 'US' });

    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('phone=%2B14155552671');
    expect(url).toContain('country_hint=US');
    expect(url).toMatch(/^https:\/\/api\.trestleiq\.com\/1\.1\/phone-validation\?/);
  });

  it('maps 401 to TrestleError(auth)', async () => {
    mockFetch(() => new Response('{"error":"unauthorized"}', { status: 401 }));
    const client = new TrestleClient('bad-key');
    await expect(client.get('/phone-validation', { phone: '+14155552671' })).rejects.toMatchObject({
      kind: 'auth',
      http_status: 401,
    });
  });

  it('maps 429 to TrestleError(rate_limit)', async () => {
    mockFetch(() => new Response('', { status: 429 }));
    const client = new TrestleClient('k');
    await expect(client.get('/phone-validation', { phone: '+14155552671' })).rejects.toMatchObject({
      kind: 'rate_limit',
      http_status: 429,
    });
  });

  it('maps 4xx (not 401/429) to invalid_input', async () => {
    mockFetch(() => new Response('{"error":"bad phone"}', { status: 400 }));
    const client = new TrestleClient('k');
    await expect(client.get('/phone-validation', { phone: '+1' })).rejects.toMatchObject({
      kind: 'invalid_input',
      http_status: 400,
    });
  });

  it('retries once on 5xx then succeeds', async () => {
    let attempts = 0;
    const fetchFn = mockFetch(() => {
      attempts++;
      if (attempts === 1) return new Response('', { status: 503 });
      return new Response('{"is_valid":true,"phone_number":"+14155552671"}', { status: 200 });
    });

    const client = new TrestleClient('k');
    const result = await client.get('/phone-validation', { phone: '+14155552671' });
    expect(result).toMatchObject({ is_valid: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('throws upstream after second 5xx', async () => {
    mockFetch(() => new Response('', { status: 502 }));
    const client = new TrestleClient('k');
    await expect(client.get('/phone-validation', { phone: '+14155552671' })).rejects.toMatchObject({
      kind: 'upstream',
      http_status: 502,
    });
  });

  it('maps fetch network failure to network kind', async () => {
    mockFetch(() => {
      throw new TypeError('fetch failed');
    });
    const client = new TrestleClient('k');
    await expect(client.get('/phone-validation', { phone: '+14155552671' })).rejects.toMatchObject({
      kind: 'network',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=mcp-server -- client`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// mcp-server/src/client.ts
import { TrestleError } from './errors.js';

const BASE_URL = 'https://api.trestleiq.com/1.1';

export class TrestleClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = BASE_URL,
  ) {
    if (!apiKey) {
      throw new TrestleError('auth', 'TRESTLE_API_KEY not set');
    }
  }

  async get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, 'GET');
  }

  private buildUrl(path: string, params: Record<string, string | undefined>): string {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
    return url.toString();
  }

  private async request<T>(url: string, method: 'GET' | 'POST'): Promise<T> {
    let lastErr: TrestleError | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'x-api-key': this.apiKey,
            accept: 'application/json',
          },
        });
        if (res.ok) {
          return (await res.json()) as T;
        }
        const err = this.mapHttpError(res.status, await this.safeText(res));
        if (err.kind === 'upstream' && attempt === 0) {
          lastErr = err;
          continue;
        }
        throw err;
      } catch (e) {
        if (e instanceof TrestleError) {
          if (e.kind === 'upstream' && attempt === 0) {
            lastErr = e;
            continue;
          }
          throw e;
        }
        const msg = e instanceof Error ? e.message : String(e);
        throw new TrestleError('network', msg);
      }
    }
    throw lastErr ?? new TrestleError('upstream', 'unknown upstream failure');
  }

  private mapHttpError(status: number, body: string): TrestleError {
    if (status === 401 || status === 403) return new TrestleError('auth', body || 'Unauthorized', status);
    if (status === 429) return new TrestleError('rate_limit', body || 'Rate limited', status);
    if (status >= 400 && status < 500) return new TrestleError('invalid_input', body || 'Bad request', status);
    return new TrestleError('upstream', body || `Upstream HTTP ${status}`, status);
  }

  private async safeText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '';
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=mcp-server -- client`
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/client.ts mcp-server/tests/client.test.ts
git commit -m "feat(mcp-server): add TrestleClient HTTP wrapper

- x-api-key header auth
- one retry on 5xx, no retry on 4xx
- typed TrestleError mapping for auth/rate_limit/invalid_input/upstream/network

Constraint: Trestle docs don't specify retry-after; using single immediate retry on 5xx as conservative default
Directive: When rate-limit headers become known, plumb them into a retry-after-aware backoff before adding more retries"
```

---

## Task 5: phone_validation Tool Handler (TDD)

**Files:**
- Create: `mcp-server/src/tools/phone-validation.ts`
- Test: `mcp-server/tests/phone-validation.test.ts`

Each tool exports `{ name, description, inputSchema, handler }`. Handler signature: `(args, client) => Promise<CallToolResult>`.

- [ ] **Step 1: Write the failing test**

```ts
// mcp-server/tests/phone-validation.test.ts
import { describe, it, expect, vi } from 'vitest';
import { phoneValidationTool } from '../src/tools/phone-validation.js';
import { TrestleError } from '../src/errors.js';
import type { TrestleClient } from '../src/client.js';

function clientStub(impl: TrestleClient['get']): TrestleClient {
  return { get: impl } as unknown as TrestleClient;
}

describe('phoneValidationTool', () => {
  it('exposes the tool name trestle_phone_validation', () => {
    expect(phoneValidationTool.name).toBe('trestle_phone_validation');
  });

  it('calls /phone-validation with required + optional params', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
    }));
    await phoneValidationTool.handler(
      { phone: '+14155552671', country_hint: 'US' },
      clientStub(get),
    );
    expect(get).toHaveBeenCalledWith('/phone-validation', {
      phone: '+14155552671',
      country_hint: 'US',
    });
  });

  it('returns text content with summarized result on success', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      country_code: 'US',
      line_type: 'Mobile',
      carrier: 'Verizon',
    }));
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toMatchObject({ type: 'text' });
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('+14155552671');
    expect(text).toContain('valid');
    expect(text).toContain('Mobile');
    expect(text).toContain('Verizon');
  });

  it('returns isError on TrestleError(auth)', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('auth', 'Invalid API key', 401);
    });
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid API key');
    expect(text).toContain('/trestle-setup');
  });

  it('returns isError on TrestleError(rate_limit)', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('rate_limit', 'Slow down', 429);
    });
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('rate');
  });

  it('returns isError on unexpected non-Trestle errors', async () => {
    const get = vi.fn(async () => {
      throw new Error('boom');
    });
    const result = await phoneValidationTool.handler(
      { phone: '+14155552671' },
      clientStub(get),
    );
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=mcp-server -- phone-validation`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// mcp-server/src/tools/phone-validation.ts
import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { TrestleError } from '../errors.js';
import { phoneValidationInput, phoneValidationResponse } from '../schemas.js';

const DESCRIPTION = `Validate a phone number. Returns validity, carrier, line type (Mobile/Landline/VOIP), and country code. Use when the user asks: "Is this number valid?", "What carrier is X?", or "Is X a mobile number?". Do NOT use this for ownership lookup — use trestle_reverse_phone instead.`;

export const phoneValidationTool = {
  name: 'trestle_phone_validation',
  description: DESCRIPTION,
  inputSchema: phoneValidationInput,

  async handler(
    args: z.infer<typeof phoneValidationInput>,
    client: TrestleClient,
  ) {
    try {
      const raw = await client.get('/phone-validation', {
        phone: args.phone,
        country_hint: args.country_hint,
      });
      const data = phoneValidationResponse.parse(raw);
      const lines: string[] = [
        `Phone: ${data.phone_number}`,
        `Valid: ${data.is_valid ? 'yes' : 'no'}`,
      ];
      if (data.country_code) lines.push(`Country: ${data.country_code}`);
      if (data.line_type) lines.push(`Line type: ${data.line_type}`);
      if (data.carrier) lines.push(`Carrier: ${data.carrier}`);
      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
        structuredContent: data,
      };
    } catch (e) {
      return errorResult(e);
    }
  },
};

function errorResult(e: unknown) {
  if (e instanceof TrestleError) {
    const hint =
      e.kind === 'auth'
        ? ' — run /trestle-setup to configure your TRESTLE_API_KEY.'
        : e.kind === 'rate_limit'
        ? ' — you are being rate limited; wait and try again.'
        : '';
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `${e.message}${hint}` }],
      structuredContent: e.toContent(),
    };
  }
  const msg = e instanceof Error ? e.message : String(e);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: `Unexpected error: ${msg}` }],
  };
}

export { errorResult };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=mcp-server -- phone-validation`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/tools/phone-validation.ts mcp-server/tests/phone-validation.test.ts
git commit -m "feat(mcp-server): add trestle_phone_validation tool

- handler maps TrestleError → MCP isError responses
- 401 errors include actionable hint to run /trestle-setup
- structuredContent included for tooling consumers"
```

---

## Task 6: reverse_phone Tool Handler (TDD)

**Files:**
- Create: `mcp-server/src/tools/reverse-phone.ts`
- Test: `mcp-server/tests/reverse-phone.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// mcp-server/tests/reverse-phone.test.ts
import { describe, it, expect, vi } from 'vitest';
import { reversePhoneTool } from '../src/tools/reverse-phone.js';
import { TrestleError } from '../src/errors.js';
import type { TrestleClient } from '../src/client.js';

function clientStub(impl: TrestleClient['get']): TrestleClient {
  return { get: impl } as unknown as TrestleClient;
}

describe('reversePhoneTool', () => {
  it('uses the name trestle_reverse_phone', () => {
    expect(reversePhoneTool.name).toBe('trestle_reverse_phone');
  });

  it('calls /reverse-phone with phone', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [{ name: 'Jane Doe', type: 'Person' }],
    }));
    await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    expect(get).toHaveBeenCalledWith('/reverse-phone', { phone: '+14155552671' });
  });

  it('summarizes one owner', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [{ name: 'Jane Doe', type: 'Person' }],
    }));
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Person');
  });

  it('summarizes multiple owners', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [
        { name: 'Jane Doe', type: 'Person' },
        { name: 'Acme Corp', type: 'Business' },
      ],
    }));
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Acme Corp');
  });

  it('handles zero owners gracefully', async () => {
    const get = vi.fn(async () => ({
      phone_number: '+14155552671',
      is_valid: true,
      owners: [],
    }));
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { text: string }).text;
    expect(text.toLowerCase()).toContain('no owner');
  });

  it('returns isError on auth failure with /trestle-setup hint', async () => {
    const get = vi.fn(async () => {
      throw new TrestleError('auth', 'Invalid key', 401);
    });
    const result = await reversePhoneTool.handler({ phone: '+14155552671' }, clientStub(get));
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('/trestle-setup');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=mcp-server -- reverse-phone`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// mcp-server/src/tools/reverse-phone.ts
import * as z from 'zod/v4';
import type { TrestleClient } from '../client.js';
import { reversePhoneInput, reversePhoneResponse } from '../schemas.js';
import { errorResult } from './phone-validation.js';

const DESCRIPTION = `Look up the owner(s) of a phone number. Returns names and entity types (Person/Business). Use when the user asks: "Who owns this number?", "Whose phone is this?", or "Is X a personal or business line?". This call is more expensive than trestle_phone_validation — don't use it just to check if a number is valid.`;

export const reversePhoneTool = {
  name: 'trestle_reverse_phone',
  description: DESCRIPTION,
  inputSchema: reversePhoneInput,

  async handler(
    args: z.infer<typeof reversePhoneInput>,
    client: TrestleClient,
  ) {
    try {
      const raw = await client.get('/reverse-phone', { phone: args.phone });
      const data = reversePhoneResponse.parse(raw);

      let text: string;
      if (data.owners.length === 0) {
        text = `Phone: ${data.phone_number}\nNo owners on file.`;
      } else {
        const ownerLines = data.owners
          .map((o, i) => `  ${i + 1}. ${o.name ?? '(unknown)'} (${o.type ?? 'unknown'})`)
          .join('\n');
        text = `Phone: ${data.phone_number}\nOwners:\n${ownerLines}`;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=mcp-server -- reverse-phone`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/tools/reverse-phone.ts mcp-server/tests/reverse-phone.test.ts
git commit -m "feat(mcp-server): add trestle_reverse_phone tool

- reuses errorResult helper from phone-validation tool
- gracefully handles empty owners array"
```

---

## Task 7: MCP Server Entrypoint (index.ts)

**Files:**
- Modify: `mcp-server/src/index.ts` (replaces placeholder)

No new test file — the entrypoint is glue, exercised by the live-smoke test in Task 10 and manual install in Task 11.

- [ ] **Step 1: Replace `mcp-server/src/index.ts`**

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { TrestleClient } from './client.js';
import { TrestleError } from './errors.js';
import { phoneValidationTool } from './tools/phone-validation.js';
import { reversePhoneTool } from './tools/reverse-phone.js';

const apiKey = process.env.TRESTLE_API_KEY;

const server = new McpServer({ name: 'trestleiq', version: '0.1.0' });

const tools = [phoneValidationTool, reversePhoneTool];

if (!apiKey) {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async () => ({
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'TRESTLE_API_KEY is not set. Run /trestle-setup in Claude Code, or export TRESTLE_API_KEY in your shell.',
          },
        ],
      }),
    );
  }
} else {
  const client = new TrestleClient(apiKey);
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      (args: any) => tool.handler(args, client),
    );
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`trestleiq MCP server running (apiKey=${apiKey ? 'set' : 'MISSING'})`);
}

main().catch((err) => {
  if (err instanceof TrestleError) {
    console.error(`trestleiq fatal: [${err.kind}] ${err.message}`);
  } else {
    console.error('trestleiq fatal:', err);
  }
  process.exit(1);
});
```

- [ ] **Step 2: Build to verify type-correctness**

Run: `npm run build --workspace=mcp-server`
Expected: builds without errors.

- [ ] **Step 3: Run full test suite to confirm nothing regressed**

Run: `npm test --workspace=mcp-server`
Expected: all unit tests pass (errors + schemas + client + phone-validation + reverse-phone).

- [ ] **Step 4: Commit**

```bash
git add mcp-server/src/index.ts
git commit -m "feat(mcp-server): wire stdio MCP server with both v0.1 tools

- registers degraded tools when TRESTLE_API_KEY is missing so the
  server still starts and gives actionable error to the user
- logs to stderr only (stdout is the JSON-RPC channel)

Directive: Do NOT add console.log anywhere — it will corrupt stdio transport"
```

---

## Task 8: Setup Script (TDD-lite)

**Files:**
- Create: `scripts/setup.ts`
- Create: `scripts/setup.test.ts` (sits alongside; tests only the pure pieces)
- Modify: workspace root `package.json` to include the test script if it doesn't already pick this up

Tests cover the pure helpers (shell rc detection, marker presence detection). The interactive prompt and rc write are exercised manually in Task 11.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/setup.test.ts
import { describe, it, expect } from 'vitest';
import { detectShellRc, hasTrestleMarker } from './setup.js';

describe('detectShellRc', () => {
  it('maps zsh to .zshrc', () => {
    expect(detectShellRc('/bin/zsh', '/home/u')).toBe('/home/u/.zshrc');
  });
  it('maps bash to .bashrc', () => {
    expect(detectShellRc('/usr/bin/bash', '/home/u')).toBe('/home/u/.bashrc');
  });
  it('maps fish to fish config', () => {
    expect(detectShellRc('/usr/local/bin/fish', '/home/u')).toBe('/home/u/.config/fish/config.fish');
  });
  it('falls back to .profile for unknown shells', () => {
    expect(detectShellRc('/bin/csh', '/home/u')).toBe('/home/u/.profile');
  });
});

describe('hasTrestleMarker', () => {
  it('detects the marker comment', () => {
    expect(hasTrestleMarker('export TRESTLE_API_KEY="abc" # trestleiq-claude-plugin')).toBe(true);
  });
  it('returns false when absent', () => {
    expect(hasTrestleMarker('# nothing here\nexport FOO=bar')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/shivang/dev/trestleiq-skills && npx vitest run scripts/setup.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
// scripts/setup.ts
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const MARKER = '# trestleiq-claude-plugin';
const VALIDATE_URL = 'https://api.trestleiq.com/1.1/phone-validation?phone=+14155552671';

export function detectShellRc(shell: string, home: string): string {
  if (shell.endsWith('zsh')) return join(home, '.zshrc');
  if (shell.endsWith('bash')) return join(home, '.bashrc');
  if (shell.endsWith('fish')) return join(home, '.config', 'fish', 'config.fish');
  return join(home, '.profile');
}

export function hasTrestleMarker(content: string): boolean {
  return content.includes(MARKER);
}

async function validateKey(key: string): Promise<'ok' | 'auth' | 'other'> {
  try {
    const res = await fetch(VALIDATE_URL, { headers: { 'x-api-key': key } });
    if (res.ok) return 'ok';
    if (res.status === 401 || res.status === 403) return 'auth';
    return 'other';
  } catch {
    return 'other';
  }
}

async function main() {
  if (process.env.TRESTLE_API_KEY) {
    console.log('TRESTLE_API_KEY already set in environment. Nothing to do.');
    return;
  }

  const rcPath = detectShellRc(process.env.SHELL ?? '/bin/zsh', homedir());
  if (existsSync(rcPath) && hasTrestleMarker(readFileSync(rcPath, 'utf8'))) {
    console.log(`Already configured in ${rcPath}. Restart your shell or 'source ${rcPath}'.`);
    return;
  }

  const rl = createInterface({ input: stdin, output: stdout });
  console.log('Get an API key at https://portal.trestleiq.com/account/api-keys');
  const key = (await rl.question('Paste your Trestle API key: ')).trim();
  rl.close();

  if (!key) {
    console.error('No key entered. Aborting.');
    process.exit(1);
  }

  const result = await validateKey(key);
  if (result === 'auth') {
    console.error('That key was rejected by api.trestleiq.com. Aborting.');
    process.exit(1);
  }
  if (result === 'other') {
    console.error('Could not reach api.trestleiq.com to validate the key. Aborting.');
    process.exit(1);
  }

  appendFileSync(rcPath, `\nexport TRESTLE_API_KEY="${key}" ${MARKER}\n`);
  console.log(`Wrote TRESTLE_API_KEY to ${rcPath}.`);
  console.log(`Run 'source ${rcPath}' (or restart your terminal) then restart Claude Code.`);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Add `vitest` to root devDependencies and config**

Modify workspace root `package.json` — add to `devDependencies`:

```json
"vitest": "^2.1.0"
```

Then run:
```bash
cd /Users/shivang/dev/trestleiq-skills
npm install
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run scripts/setup.test.ts`
Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/setup.ts scripts/setup.test.ts package.json package-lock.json
git commit -m "feat(scripts): add /trestle-setup helper

- detects shell rc (zsh/bash/fish/fallback)
- validates key against /phone-validation before writing
- idempotent via marker comment

Directive: The marker comment '# trestleiq-claude-plugin' is part of the public contract — do not rename without bumping plugin version and providing a migration"
```

---

## Task 9: /trestle-setup Slash Command

**Files:**
- Create: `commands/trestle-setup.md`

- [ ] **Step 1: Write the command file**

```markdown
---
description: Configure your TrestleIQ API key for the trestleiq plugin.
---

# /trestle-setup

The user wants to install or refresh their TrestleIQ API key for this plugin.

Run the setup helper script using Bash:

```
node --import tsx ${CLAUDE_PLUGIN_ROOT}/scripts/setup.ts
```

The script will:

1. Detect if `TRESTLE_API_KEY` is already set in the environment — exit early if so.
2. Detect if a key is already configured in the user's shell rc file — exit early if so.
3. Prompt the user to paste a key (link them to https://portal.trestleiq.com/account/api-keys).
4. Validate the key by hitting `GET /phone-validation` against `api.trestleiq.com`.
5. On success, append `export TRESTLE_API_KEY="<key>" # trestleiq-claude-plugin` to the appropriate shell rc.
6. Tell the user to `source` the rc file (or restart their terminal) and then restart Claude Code so the MCP server picks up the env var.

After the script completes, remind the user to restart Claude Code if it printed instructions to do so. Do not echo the API key back to the user.
```

- [ ] **Step 2: Commit**

```bash
git add commands/trestle-setup.md
git commit -m "feat(commands): add /trestle-setup slash command

Delegates to scripts/setup.ts via tsx loader. Includes explicit
instruction not to echo the API key in the resulting transcript."
```

---

## Task 10: trestle-phone-lookup Skill + live smoke test

**Files:**
- Create: `skills/trestle-phone-lookup/SKILL.md`
- Create: `mcp-server/tests/live-smoke.test.ts`

- [ ] **Step 1: Write `skills/trestle-phone-lookup/SKILL.md`**

```markdown
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
```

- [ ] **Step 2: Write the live-smoke test (gated)**

```ts
// mcp-server/tests/live-smoke.test.ts
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
```

- [ ] **Step 3: Run unit tests to confirm no regression**

Run: `npm test --workspace=mcp-server`
Expected: all unit tests pass; live-smoke is skipped (no key in env yet) **OR** runs if `TRESTLE_API_KEY` is exported.

- [ ] **Step 4: Commit**

```bash
git add skills/ mcp-server/tests/live-smoke.test.ts
git commit -m "feat: add workflow skill + gated live smoke test

- skill teaches tool selection, E.164 normalization, output summarization
- live smoke test is opt-in via TRESTLE_API_KEY env var

Not-tested: live smoke test exercised manually before each release;
not part of default CI (would require live key in CI secrets)"
```

---

## Task 11: Local Install and Manual End-to-End Verification

**Files:**
- Modify: `README.md` to fill in the install steps section

This task validates that everything wired up actually works. No new code; manual + light scripting.

- [ ] **Step 1: Build the MCP server**

```bash
cd /Users/shivang/dev/trestleiq-skills
npm run build
ls mcp-server/dist/
```

Expected: `dist/index.js`, `dist/client.js`, `dist/tools/phone-validation.js`, etc. all present.

- [ ] **Step 2: Sanity-check the MCP server starts on stdio**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | TRESTLE_API_KEY=fake node mcp-server/dist/index.js
```

Expected: JSON response on stdout listing `trestle_phone_validation` and `trestle_reverse_phone`. Server logs to stderr: `trestleiq MCP server running (apiKey=set)`.

- [ ] **Step 3: Install plugin locally**

```bash
mkdir -p ~/.claude/plugins
ln -sf /Users/shivang/dev/trestleiq-skills ~/.claude/plugins/trestleiq
```

(Note: confirm the exact install convention in current Claude Code docs — `plugin-dev:plugin-structure` skill at execution time. If a CLI command exists, use it; the symlink path above is the documented fallback.)

- [ ] **Step 4: Restart Claude Code, verify plugin is loaded**

In a fresh Claude Code session:
- `/plugin` (or equivalent) should list `trestleiq` v0.1.0.
- `/trestle-setup` should appear in the slash command list.

If either is missing, re-check `.claude-plugin/plugin.json` and the symlink target.

- [ ] **Step 5: Configure the key via slash command (real run)**

Run `/trestle-setup` inside Claude Code. Paste a real TrestleIQ key when prompted. Confirm:
- Validation succeeds (key is good).
- `~/.zshrc` (or your detected rc) now has `export TRESTLE_API_KEY="..." # trestleiq-claude-plugin`.
- Output tells you to restart Claude Code.

Restart Claude Code.

- [ ] **Step 6: Exercise both tools conversationally**

In a new session, type:

> *"Is +14155552671 a valid phone number? What carrier?"*

Confirm:
- Claude calls `trestle_phone_validation` (tool call visible in transcript).
- Response summarizes phone metadata in prose, not raw JSON.

Then:

> *"Who owns +14155552671?"*

Confirm:
- Claude calls `trestle_reverse_phone`.
- Owners are listed in prose.

- [ ] **Step 7: Exercise the missing-key error path**

Unset the key:
```bash
unset TRESTLE_API_KEY
# also comment out the line in your shell rc temporarily for this test
```

Restart Claude Code. Ask: *"Is +14155552671 valid?"*

Expected: Claude tries the tool, gets `isError`, surfaces the message pointing to `/trestle-setup`. **It must not pretend the call succeeded.**

Re-enable the key after this test.

- [ ] **Step 8: Run plugin validator**

Dispatch the `plugin-dev:plugin-validator` agent against the repo. Fix any issues it raises before continuing.

- [ ] **Step 9: Finalize README install section**

Replace the install placeholder in `README.md` with the actual verified steps (symlink path or whatever the validator confirmed).

- [ ] **Step 10: Final commit and tag**

```bash
git add README.md
git commit -m "docs: finalize README install instructions

Verified end-to-end in a clean Claude Code session.
- /trestle-setup writes shell rc correctly
- both tools called conversationally in transcript
- missing-key path returns actionable isError"

git tag v0.1.0
```

---

## Self-Review

**Spec coverage check** (against `/Users/shivang/.claude/plans/what-skills-to-use-gleaming-boole.md`):

- ✅ Plugin scaffold via `plugin-dev:create-plugin` knowledge — Task 0 produces `.claude-plugin/plugin.json` matching the manifest spec.
- ✅ MCP server via `mcp-server-dev:build-mcp-server` knowledge — Tasks 1, 7 produce TS server with stdio + SDK.
- ✅ Hand-rolled fetch + Zod client — Tasks 3, 4.
- ✅ Two endpoints (`/phone-validation`, `/reverse-phone`) — Tasks 5, 6.
- ✅ Setup command writing to shell rc — Tasks 8, 9.
- ✅ Workflow skill — Task 10.
- ✅ Mocked unit tests + gated live smoke — Tasks 2–6, 10.
- ✅ Local install + verification — Task 11.

**Placeholder scan:** none — every step has actual code or commands.

**Type consistency:**
- `TrestleClient` class introduced in Task 4 → used as type in Tasks 5, 6 (`tools/phone-validation.ts`, `tools/reverse-phone.ts`) ✓.
- `phoneValidationInput`, `reversePhoneInput` schemas in Task 3 → consumed in Tasks 5, 6 ✓.
- `errorResult` helper exported from `tools/phone-validation.ts` (Task 5) → imported in Task 6 ✓.
- `detectShellRc`, `hasTrestleMarker` exports tested in Task 8 Step 1 match implementation in Task 8 Step 3 ✓.
- Tool names `trestle_phone_validation` / `trestle_reverse_phone` used consistently in tests, handlers, and skill markdown ✓.

**Open assumptions worth flagging at execution time:**
- The plugin manifest `mcpServers` field shape matches current Claude Code spec. If the field name has changed, fix in Task 0 Step 3 with the value from `plugin-dev:plugin-structure`.
- `@modelcontextprotocol/server` package name — confirmed via context7 at plan-writing time. If npm install fails because the SDK reverted to `@modelcontextprotocol/sdk`, swap both the dep in Task 1 and the imports in Task 7.
- TrestleIQ uses `x-api-key` header. Confirm against `https://docs.trestleiq.com/api-reference/authentication` at execution time; if it's `Authorization: Bearer`, fix `client.ts` Task 4 Step 3 in one place.
- TrestleIQ API base path includes `/1.1` (typical Trestle convention). If actual base is unversioned, drop `/1.1` from `client.ts` and the smoke-test URL in Task 8 Step 3.

These are all single-file, single-line fixes — keep them in mind but don't pre-emptively change the plan.
