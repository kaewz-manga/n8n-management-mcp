# CLAUDE.md — n8n-management-mcp

> Technical guide for AI assistants working on this Cloudflare Worker project.

---

## What This Project Is

Cloudflare Worker that serves as the **backend** for the n8n MCP SaaS platform. It provides:

1. **MCP Server** — JSON-RPC 2.0 endpoint (`POST /mcp`) with 31 n8n tools
2. **Management API** — REST endpoints for users, connections, API keys, billing
3. **Auth** — Email/password, OAuth (GitHub/Google), JWT, HMAC-SHA256, SaaS API keys
4. **Admin API** — User management, analytics, revenue tracking

Deployed on Cloudflare Workers at `https://n8n-management-mcp.node2flow.net`.

There is also a **Dashboard** (React 19 SPA) in `dashboard/` deployed on Cloudflare Pages at `https://n8n-management-dashboard.node2flow.net`.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Claude Desktop  │     │  Dashboard       │     │  n8n-mcp-agent    │
│  Cursor / etc.   │     │  (React SPA)     │     │  (Vercel Next.js) │
└────────┬────────┘     └────────┬─────────┘     └────────┬──────────┘
         │ MCP JSON-RPC          │ REST + JWT              │ HMAC + JWT
         │ Bearer saas_xxx       │                         │
         ▼                       ▼                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (this project)                                │
│  n8n-management-mcp.node2flow.net                                │
│                                                                  │
│  /mcp              → MCP Protocol (31 tools)                     │
│  /api/auth/*       → Register, Login, OAuth                      │
│  /api/connections   → n8n instance CRUD                          │
│  /api/ai-connections → AI provider CRUD (BYOK)                   │
│  /api/bot-connections → Bot CRUD + webhook                       │
│  /api/agent/*      → HMAC auth for Vercel agent                  │
│  /api/admin/*      → Admin panel APIs                            │
│  /api/billing/*    → Stripe checkout/portal                      │
│                                                                  │
│  D1 Database ──── KV (Rate Limit + OAuth State)                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ n8n Public API
                       ▼
               ┌───────────────┐
               │  n8n Instance  │
               │  (Customer's)  │
               └───────────────┘
```

---

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | ~1500 | Main entry — all API routes + MCP handler |
| `src/auth.ts` | ~530 | Register, login, API key validation, admin auth |
| `src/db.ts` | ~410 | All D1 CRUD operations (users, connections, AI, bots, usage) |
| `src/crypto-utils.ts` | ~345 | PBKDF2, AES-256-GCM, JWT, API key generation |
| `src/oauth.ts` | ~330 | GitHub + Google OAuth 2.0 flows |
| `src/stripe.ts` | ~295 | Stripe checkout, billing portal, webhook handler |
| `src/tools.ts` | ~375 | 31 MCP tool definitions |
| `src/n8n-client.ts` | ~215 | HTTP client for n8n Public API v1 |
| `src/saas-types.ts` | ~215 | TypeScript interfaces (Env, User, Connection, etc.) |
| `src/types.ts` | ~75 | Base MCP types |
| `schema.sql` | ~150 | D1 database schema (6 core tables + indexes) |
| `stdio-server.js` | ~800 | Stdio server for Claude Desktop/Code (SaaS + Direct modes) |

### Dashboard (`dashboard/`)

| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Email + OAuth login |
| `src/pages/Dashboard.tsx` | Overview + stats |
| `src/pages/Connections.tsx` | n8n connections + API keys |
| `src/pages/Usage.tsx` | Usage statistics |
| `src/pages/Settings.tsx` | Profile, password, danger zone |
| `src/pages/admin/*.tsx` | Admin: users, analytics, revenue, health |
| `src/pages/n8n/*.tsx` | n8n UI: workflows, executions, credentials, tags, variables, users |
| `src/lib/api.ts` | API client (all CF Worker endpoints) |
| `src/contexts/AuthContext.tsx` | Auth state management |

---

## Database (Cloudflare D1)

9 tables total. Schema in `schema.sql` + migrations.

**Core tables**: `users`, `n8n_connections`, `api_keys`, `usage_logs`, `usage_monthly`, `plans`, `admin_logs`

**Added via migrations**: `ai_connections`, `bot_connections`

Key relationships:
- `users` → `n8n_connections` (1:many) → `api_keys` (1:many)
- `users` → `ai_connections` (1:many)
- `users` → `bot_connections` (1:many)
- `ai_connections` → `bot_connections` (1:many, via ai_connection_id)

---

## Auth Systems (4 types)

| Auth | Used By | How |
|------|---------|-----|
| **Email/Password** | Dashboard login | PBKDF2 hash → JWT (24 hours) |
| **OAuth 2.0** | Dashboard login | GitHub/Google → JWT |
| **SaaS API Key** | MCP clients | `Bearer saas_xxx` → SHA-256 lookup → decrypt n8n key |
| **HMAC-SHA256** | Vercel agent | `HMAC(AGENT_SECRET, "userId:aiConnectionId")` → decrypt AI/bot keys |

---

## Security

- Password: PBKDF2 with 100,000 iterations
- Credentials: AES-256-GCM (n8n API keys, AI API keys, bot tokens)
- JWT: HS256 signing, 24-hour expiry
- API keys: SHA-256 hashed (plain text never stored)
- OAuth state: KV-stored CSRF tokens (10 min TTL)
- Stripe webhooks: HMAC-SHA256 signature verification

**Critical secrets (never change after first use)**:
- `ENCRYPTION_KEY` — Changing breaks all encrypted credentials
- `JWT_SECRET` — Changing invalidates all active sessions

---

## Cloudflare Resources

| Resource | ID/Name |
|----------|---------|
| Worker | `n8n-management-mcp` |
| D1 Database | `705840e0-4663-430e-9f3b-3778c209e525` (n8n-management-mcp-db, APAC/SIN) |
| KV Namespace | `45d5d994b649440ab34e4f0a3a5eaa66` (RATE_LIMIT_KV) |
| Pages | `n8n-mcp-dashboard` |

---

## Environment / Secrets

### Set on Workers (via `wrangler secret put`)

| Secret | Status | Purpose |
|--------|--------|---------|
| `JWT_SECRET` | Set | JWT signing (32-byte hex) |
| `ENCRYPTION_KEY` | Set | AES-GCM encryption (32-byte hex) |
| `GITHUB_CLIENT_ID` | Set | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | Set | GitHub OAuth |
| `GOOGLE_CLIENT_ID` | Set | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Set | Google OAuth |
| `APP_URL` | Set | `https://n8n-management-dashboard.node2flow.net` |
| `AGENT_SECRET` | Set | HMAC shared secret (matches Vercel) |
| `AGENT_URL` | Set | `https://agent-chi-wine.vercel.app` |
| `STRIPE_SECRET_KEY` | Not set | Stripe billing |
| `STRIPE_WEBHOOK_SECRET` | Not set | Stripe webhook verification |
| `STRIPE_PRICE_*` | Not set | Stripe price IDs |

### Dashboard env

```
VITE_API_URL=https://n8n-management-mcp.node2flow.net
```

---

## Commands

```bash
# Worker
npm install                  # Install deps
npm run typecheck            # TypeScript check
npm test                     # Run tests (vitest)
npx wrangler dev             # Local dev
npx wrangler deploy          # Deploy to Cloudflare
npx wrangler tail             # Real-time logs

# Dashboard
cd dashboard
npm install
npm run dev                  # Local dev (Vite, port 5173)
npm run build                # Build
npm run deploy               # Build + deploy to Cloudflare Pages

# Database
npx wrangler d1 execute n8n-management-mcp-db --remote --file=./schema.sql
npx wrangler d1 execute n8n-management-mcp-db --remote --command "SELECT ..."

# Secrets
wrangler secret put SECRET_NAME
```

---

## Connected Project: n8n-mcp-agent

The Vercel Next.js app (`n8n-mcp-agent/`) connects to this Worker:

- **Chat API** (`/api/chat`) → calls `/api/agent/config` (HMAC) to get AI credentials, then `/mcp` (saas_ key) for tools
- **Dashboard UI** → calls JWT-protected endpoints directly from browser
- **Webhooks** (`/api/webhook/telegram/[userId]`, `/api/webhook/line/[userId]`) → calls `/api/agent/bot-config` (HMAC)

Shared secrets: `AGENT_SECRET` must match on both Vercel and CF Worker.

---

## Things to NOT Do

- Don't change `ENCRYPTION_KEY` — Breaks all encrypted credentials in D1
- Don't change `JWT_SECRET` — Invalidates all active user sessions
- Don't modify auth flows without understanding all 4 auth types
- Don't add CORS restrictions — Agent and Dashboard call from different origins
- Don't remove `stripe_customer_id` from users table — Needed for billing

---

**Version**: 1.0 | Created: 2026-02-02
