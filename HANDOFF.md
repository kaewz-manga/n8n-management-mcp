# HANDOFF.md - n8n MCP SaaS Platform

> Context สำหรับ Claude ตัวใหม่ที่จะทำงานต่อ

**Updated**: 2026-02-03
**GitHub**: https://github.com/kaewz-manga/n8n-management-mcp

### Production URLs

| Service | Custom Domain | Cloudflare Default |
|---------|--------------|-------------------|
| **MCP Server (Worker)** | https://n8n-management-mcp.node2flow.net | https://n8n-mcp-saas.suphakitm99.workers.dev |
| **Dashboard (Pages)** | https://n8n-management-dashboard.node2flow.net | https://n8n-mcp-dashboard.pages.dev |
| **Agent (Vercel)** | https://agent-chi-wine.vercel.app | — |

---

## โปรเจคนี้คืออะไร

**n8n MCP SaaS** - แพลตฟอร์ม SaaS ที่ให้บริการ MCP Server สำหรับเชื่อมต่อ AI clients (Claude, Cursor, etc.) กับ n8n automation platform

**Value**: ลูกค้าสมัคร → เพิ่ม n8n instance → ได้ API key `saas_xxx` → ใช้ AI ควบคุม n8n workflows ได้เลย

### Connected Projects

| Project | Repo | Purpose |
|---------|------|---------|
| **n8n-mcp-agent** | Moved to separate repo | Next.js 15 Chat UI + Dashboard frontend (Vercel) |
| **n8n-management-mcp** | This repo | CF Worker backend (API + MCP + D1) |

The **n8n-mcp-agent** project has been **moved out** to a separate repository (previously in `agent/` folder).
It connects to this Worker via:
- HMAC-SHA256 for AI/bot configs (`/api/agent/config`, `/api/agent/bot-config`)
- JWT for dashboard CRUD
- `saas_` API key for MCP tools

---

## สถานะปัจจุบัน (2026-02-02)

### ✅ ทำเสร็จ + Deploy แล้ว

- **SaaS Backend** - Auth, Connections, API Keys, Rate Limiting, Usage Tracking
- **31 MCP Tools** - n8n Public API coverage (Community Edition)
- **Cloudflare D1** - Database สร้าง + schema apply + migrations แล้ว (9 tables total)
- **Cloudflare KV** - Rate limiting cache + OAuth state
- **GitHub Actions** - CI/CD (typecheck + deploy)
- **E2E Test ผ่าน** - Register → Login → Add Connection → MCP Initialize → list_workflows → list_tags
- **Dashboard deployed** - React 19 SPA บน Cloudflare Pages (includes Admin pages + n8n UI pages)
- **Worker deployed** - Cloudflare Workers
- **Stripe integration** - `src/stripe.ts` - Checkout session, billing portal, webhook handler
- **OAuth working** - GitHub + Google OAuth login ใช้งานได้ (tested 2026-01-31)
- **stdio-server.js** - รองรับทั้ง SaaS API key mode (`saas_xxx`) และ Direct n8n mode
- **Custom domains** - Worker: `n8n-management-mcp.node2flow.net`, Dashboard: `n8n-management-dashboard.node2flow.net`
- **Monitoring** - Cloudflare Observability enabled
- **AI Connections** - BYOK AI provider credentials (OpenAI, Anthropic, Google) - CRUD + AES-GCM encryption
- **Bot Connections** - Telegram/LINE bot management with webhook registration/deregistration
- **Agent endpoints** - HMAC-SHA256 auth for Vercel agent (`/api/agent/config`, `/api/agent/bot-config`)
- **Admin panel** - User management, analytics, revenue tracking, health monitoring
- **n8n-mcp-agent** - Chat UI + Dashboard UI deployed on Vercel (login works, needs deeper testing)

### ✅ Bug fixes

- `getConnectionById` missing `.bind(id)` → Fixed (commit 84e1265)
- `/mcp` endpoint missing try-catch → Fixed (commit 84e1265)
- Dashboard `tsc -b` fails with Vite 7 + TS 5.9 → Fixed: ใช้ `vite build` เดี่ยว (commit d535095)
- `n8n_list_credentials` returns 405 on Community Edition → Removed tool
- OAuth `redirect_uri` ใช้ `APP_URL` (Dashboard) แทน Worker origin → Fixed (commit 02fd3fa)
- Dashboard ส่ง `redirect_uri` ผิด override Worker's callback → Fixed (commit 02fd3fa)

### ⏳ ยังไม่ได้ทดสอบละเอียด

- **n8n-mcp-agent Dashboard CRUD** - Login เข้าได้แล้ว แต่ยังไม่ได้ตรวจสอบ CRUD operations ทั้งหมด
  - AI connections create/delete
  - Bot connections create/delete + webhook toggle
  - n8n connections + API key management
  - OAuth full flow (GitHub/Google redirect → callback → dashboard)
- **Stripe billing** - Integration code ready แต่ยัง set secrets ไม่ครบ

### ⏳ รอ set secrets (ต้องทำ manual)

- **Stripe secrets** - ต้องสร้าง Stripe account, products, prices แล้ว set:
  - `wrangler secret put STRIPE_SECRET_KEY`
  - `wrangler secret put STRIPE_WEBHOOK_SECRET`
  - `wrangler secret put STRIPE_PRICE_STARTER`
  - `wrangler secret put STRIPE_PRICE_PRO`
  - `wrangler secret put STRIPE_PRICE_ENTERPRISE`
  - Add webhook endpoint in Stripe Dashboard: `https://n8n-management-mcp.node2flow.net/api/webhooks/stripe`

ดู `docs/DEPLOYMENT.md` Step 10 สำหรับ instructions ละเอียด

### 🎯 Priority: MCP ก่อน

ผู้ใช้ต้องการโฟกัส MCP features ก่อน Dashboard UI testing จะทำทีหลัง

---

## Cloudflare Resources

| Resource | ID/Name | Type |
|----------|---------|------|
| **Worker** | n8n-mcp-saas | Cloudflare Workers |
| **D1 Database** | `705840e0-4663-430e-9f3b-3778c209e525` | n8n-mcp-saas-db (APAC/SIN) |
| **KV Namespace** | `45d5d994b649440ab34e4f0a3a5eaa66` | RATE_LIMIT_KV |
| **Pages** | n8n-mcp-dashboard | Cloudflare Pages |
| **Account ID** | `ed77f292a2c8173c4fbadebcd1fbe8fc` | Cloudflare Account |

### Secrets ที่ set แล้วบน Workers

- `JWT_SECRET` - 32-byte hex for JWT signing
- `ENCRYPTION_KEY` - 32-byte hex for AES-GCM encryption of n8n API keys
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth (working)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth (working)
- `APP_URL` - `https://n8n-management-dashboard.node2flow.net` (OAuth redirect target)

### Secrets ที่ยังไม่ set (optional features)

- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Stripe billing
- `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` - Stripe Price IDs

### OAuth Callback URLs (registered)

- **GitHub**: `https://n8n-management-mcp.node2flow.net/api/auth/oauth/github/callback`
- **Google**: `https://n8n-management-mcp.node2flow.net/api/auth/oauth/google/callback`

---

## Architecture Overview

```
┌─────────────────┐     ┌────────────────────────────────────────┐
│  Claude Desktop  │     │  Dashboard (React 19 SPA)              │
│  Cursor / etc.   │     │  n8n-management-dashboard.node2flow.net│
└────────┬────────┘     └─────────────┬──────────────────────────┘
         │ MCP (JSON-RPC)             │ REST API
         │ Bearer saas_xxx            │ Bearer JWT
         ▼                            ▼
┌──────────────────────────────────────────────────────┐
│  Cloudflare Worker (n8n-mcp-saas)                    │
│  n8n-management-mcp.node2flow.net                    │
│                                                      │
│  ├── /mcp          → MCP Protocol Handler            │
│  ├── /api/auth/*   → Register, Login, OAuth          │
│  ├── /api/*        → Connections, Usage, etc.         │
│  ├── /api/billing/* → Stripe Checkout/Portal         │
│  └── /api/webhooks/stripe → Stripe Webhooks          │
│                                                      │
│  D1 Database ──── KV (Rate Limit Cache)              │
└──────────────────────┬───────────────────────────────┘
                       │ n8n Public API
                       ▼
               ┌───────────────┐
               │  n8n Instance  │
               │  (Customer's)  │
               └───────────────┘
```

### stdio-server.js (Claude Desktop/Code)

```
┌─────────────────┐     stdio      ┌──────────────┐
│  Claude Desktop  │ ◄──────────► │ stdio-server   │
│  or Claude Code  │               │               │
└─────────────────┘               │ SaaS mode:    │──► Worker ──► n8n
                                  │ Direct mode:  │──────────────► n8n
                                  └──────────────┘
```

---

## File Structure

```
n8n-management-mcp/
├── src/
│   ├── index.ts          # Main Worker - API routes + MCP handler (~1500 lines)
│   ├── auth.ts           # Auth - register, login, API key validation (~530 lines)
│   ├── db.ts             # D1 database layer - all CRUD (~410 lines)
│   ├── crypto-utils.ts   # PBKDF2, AES-GCM, JWT, API key gen (~345 lines)
│   ├── oauth.ts          # GitHub + Google OAuth flow (~330 lines)
│   ├── stripe.ts         # Stripe checkout, portal, webhooks (~295 lines)
│   ├── saas-types.ts     # TypeScript types + Env interface (~215 lines)
│   ├── n8n-client.ts     # n8n API client (~215 lines)
│   ├── tools.ts          # 31 MCP tool definitions (~375 lines)
│   └── types.ts          # Base MCP types (~75 lines)
├── dashboard/            # React 19 SPA (Cloudflare Pages)
│   ├── src/
│   │   ├── App.tsx           # Router + Protected/Public routes
│   │   ├── pages/
│   │   │   ├── Landing.tsx   # Marketing page + pricing
│   │   │   ├── Login.tsx     # Email + OAuth login
│   │   │   ├── Register.tsx  # Email registration
│   │   │   ├── AuthCallback.tsx # OAuth callback handler
│   │   │   ├── Dashboard.tsx # Overview + stats + connections
│   │   │   ├── Connections.tsx # Manage n8n connections + API keys
│   │   │   ├── Usage.tsx     # Usage statistics
│   │   │   └── Settings.tsx  # Profile, password, MCP config, danger zone
│   │   ├── components/Layout.tsx  # Sidebar navigation
│   │   ├── contexts/AuthContext.tsx # Auth state management
│   │   └── lib/api.ts       # API client (auth, connections, usage, billing, OAuth)
│   ├── wrangler.toml         # Cloudflare Pages config
│   ├── .env.production       # VITE_API_URL=https://n8n-management-mcp.node2flow.net
│   └── public/_redirects     # SPA routing: /* /index.html 200
├── tests/
│   ├── crypto-utils.test.ts
│   └── tools.test.ts
├── schema.sql            # D1 schema (6 tables + indexes)
├── stdio-server.js       # Claude Desktop/Code stdio server (SaaS + Direct modes)
├── wrangler.toml         # Workers config (D1 + KV bindings + custom domain)
├── docs/
│   ├── SAAS_PLAN.md      # Full SaaS business plan
│   └── DEPLOYMENT.md     # Deploy guide (Steps 1-11: D1, KV, secrets, OAuth, Stripe, Pages)
├── .github/workflows/
│   └── deploy.yml        # GitHub Actions (typecheck + deploy)
├── HANDOFF.md            # This file
└── package.json
```

---

## API Endpoints

### Public (no auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/auth/register` | POST | Register (email+password) |
| `/api/auth/login` | POST | Login → JWT token |
| `/api/auth/oauth/providers` | GET | List enabled OAuth providers |
| `/api/auth/oauth/:provider` | GET | Get OAuth authorize URL |
| `/api/auth/oauth/:provider/callback` | GET | OAuth callback → redirect with JWT |
| `/api/plans` | GET | List pricing plans |

### Webhook (signature verified)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/stripe` | POST | Stripe webhook (checkout.session.completed, subscription.deleted) |

### Protected (JWT required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET | User profile |
| `/api/user/password` | PUT | Change password |
| `/api/user` | DELETE | Delete account (soft delete) |
| `/api/connections` | GET | List n8n connections + API keys |
| `/api/connections` | POST | Add n8n connection → returns `saas_xxx` key |
| `/api/connections/:id` | DELETE | Delete connection |
| `/api/connections/:id/api-keys` | POST | Generate new API key |
| `/api/api-keys/:id` | DELETE | Revoke API key |
| `/api/ai-connections` | GET | List AI connections |
| `/api/ai-connections` | POST | Create AI connection `{ name, provider_url, api_key, model_name }` |
| `/api/ai-connections/:id` | DELETE | Delete AI connection |
| `/api/bot-connections` | GET | List bot connections |
| `/api/bot-connections` | POST | Create bot connection `{ platform, name, bot_token, ... }` |
| `/api/bot-connections/:id` | DELETE | Delete bot connection |
| `/api/bot-connections/:id/webhook` | POST | Register webhook → returns URL |
| `/api/bot-connections/:id/webhook` | DELETE | Deregister webhook |
| `/api/usage` | GET | Usage statistics (requests, limits, success rate) |
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Create Stripe billing portal |

### Agent (HMAC-SHA256 required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/config` | POST | Get AI config `{ user_id, ai_connection_id, signature }` |
| `/api/agent/bot-config` | POST | Get bot config `{ user_id, platform, signature }` |

### MCP (SaaS API key required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | MCP JSON-RPC 2.0 (initialize, tools/list, tools/call) |

### Admin (JWT + is_admin required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/stats` | GET | Platform statistics |
| `/api/admin/analytics/timeseries` | GET | Usage timeseries |
| `/api/admin/analytics/top-tools` | GET | Most used tools |
| `/api/admin/analytics/top-users` | GET | Top users by usage |
| `/api/admin/analytics/errors` | GET | Recent errors |
| `/api/admin/users/:id/status` | PUT | Update user status |
| `/api/admin/users/:id/plan` | PUT | Update user plan |

---

## 31 MCP Tools

| Category | Tools |
|----------|-------|
| **Workflow** (10) | list, get, create, update, delete, activate, deactivate, execute, get_tags, update_tags |
| **Execution** (4) | list, get, delete, retry |
| **Credential** (4) | create, update, delete, get_schema |
| **Tag** (5) | list, get, create, update, delete |
| **Variable** (4) | list, create, update, delete |
| **User** (4) | list, get, delete, update_role |

---

## Database Schema (D1)

9 tables total (6 core + 3 from migrations):

| Table | Key Fields |
|-------|------------|
| **users** | id, email, password_hash, oauth_provider, oauth_id, plan, status, stripe_customer_id, is_admin |
| **n8n_connections** | id, user_id, name, n8n_url, n8n_api_key_encrypted, status |
| **api_keys** | id, user_id, connection_id, key_hash (SHA-256), key_prefix, status |
| **usage_logs** | id, user_id, api_key_id, connection_id, tool_name, status, response_time_ms |
| **usage_monthly** | id, user_id, year_month, request_count, success_count, error_count |
| **plans** | id (free/starter/pro/enterprise), monthly_request_limit, max_connections, price_monthly |
| **admin_logs** | id, admin_user_id, action, target_user_id, details |
| **ai_connections** | id, user_id, name, provider_url, api_key_encrypted, model_name, is_default, status |
| **bot_connections** | id, user_id, platform, name, bot_token_encrypted, channel_secret_encrypted, ai_connection_id, mcp_api_key_encrypted, webhook_active, webhook_url, status |

---

## Auth Flow

```
Email/Password:
  Register → PBKDF2 hash → user created (plan: free)
  Login → verify hash → JWT token (24 hours)

OAuth (GitHub/Google):
  Dashboard → Worker /api/auth/oauth/:provider → redirect to provider
  → user authorizes → provider redirects to Worker /callback
  → Worker exchanges code → gets email → creates/finds user → JWT
  → Worker redirects to Dashboard /auth/callback?token=xxx

MCP:
  Bearer saas_xxx → SHA-256 hash → lookup api_keys → get user + connection → decrypt n8n key (AES-GCM) → call n8n API → track usage

Stripe:
  Checkout → Stripe hosted page → webhook (checkout.session.completed) → update plan
  Cancel → webhook (customer.subscription.deleted) → downgrade to free
```

---

## Pricing Plans

| Plan | Price | Requests/Month | Connections |
|------|-------|----------------|-------------|
| Free | $0 | 100 | 1 |
| Starter | $9.99/mo | 1,000 | 3 |
| Pro | $29.99/mo | 10,000 | 10 |
| Enterprise | $99.99/mo | 100,000 | Unlimited |

---

## Commands

```bash
# Worker
npm install                  # Install deps
npm run typecheck            # TypeScript check (worker only)
npm test                     # Run tests (vitest)
npx wrangler dev             # Local dev server
npx wrangler deploy          # Deploy to Cloudflare

# Dashboard
cd dashboard
npm install                  # Install deps
npm run dev                  # Local dev (Vite)
npm run build                # Build (vite build)
npm run deploy               # Build + deploy to Cloudflare Pages
npm run deploy:preview       # Build + deploy to preview branch

# Database
npx wrangler d1 execute n8n-mcp-saas-db --remote --file=./schema.sql  # Apply schema
npx wrangler d1 execute n8n-mcp-saas-db --remote --command "SELECT ..." # Query

# Secrets (use --env="" to target production)
wrangler secret put SECRET_NAME --env=""

# Monitoring
npx wrangler tail             # Real-time logs
# Cloudflare Dashboard → Workers → n8n-mcp-saas → Analytics

# CI/CD
gh workflow run deploy.yml   # Trigger GitHub Actions
```

---

## stdio-server.js Usage

```bash
# SaaS mode (connects through SaaS platform)
node stdio-server.js saas_YOUR_API_KEY
SAAS_API_KEY=saas_xxx node stdio-server.js

# Direct mode (connects directly to n8n)
node stdio-server.js <N8N_URL> <N8N_API_KEY>
N8N_URL=https://your-n8n.com N8N_API_KEY=your_key node stdio-server.js
```

Claude Desktop config:
```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["path/to/stdio-server.js", "saas_YOUR_API_KEY"]
    }
  }
}
```

---

## Known Issues / Bugs Fixed

1. **getConnectionById missing .bind(id)** - D1 query crash → Fixed (84e1265)
2. **n8n_list_credentials 405** - Community Edition blocks GET → Removed tool
3. **npm start doesn't pass args** - Must use `node stdio-server.js` directly
4. **ENCRYPTION_KEY newline** - `echo` adds `\n`, use `printf` instead
5. **Dashboard tsc -b fails** - Vite 7 + TS 5.9 type def incompatibility → Use `vite build` directly (d535095)
6. **OAuth redirect_uri wrong** - Used `APP_URL` (Dashboard) instead of `url.origin` (Worker) → Fixed (02fd3fa)
7. **Dashboard sent custom redirect_uri** - Overrode Worker's callback URL → Removed from api.ts (02fd3fa)
8. **package-lock.json out of sync** - vitest@2.1.9 missing from lock file → Cloudflare Pages `npm ci` failed → Fixed: ran `npm install` to sync (275b97d)
9. **TypeScript errors after npm fix** - Missing `is_admin` in JWTPayload, missing `oauth_provider` in User, `listCredentials` call removed → Fixed types and code (6f465a2)

---

## Test Account

- Email: `admin@node2flow.net`
- Plan: free (100 req/mo)
- Connection: n8n-no1 (https://n8n-no1.missmanga.org)

---

## Git History (Key Commits)

```
275b97d fix: sync package-lock.json with package.json
1c3007b Apply dark theme across entire dashboard
ea52536 Blur only paid plan cards, keep free plan visible
761a824 Remove agent/ folder, moved to separate repository
458b575 Hide pricing plans from public, keep visible for admin only
24f7887 Fix n8n Users page: show role as badge, add pending status
5862384 Add user-configurable session duration and rename worker
574c987 Add CLAUDE.md and update HANDOFF.md with current project status
7cb3aa2 Add custom domains for Worker and Dashboard
02fd3fa Fix OAuth redirect_uri to use Worker origin instead of APP_URL
```

---

## Next Steps

### Priority 1: MCP Features
- เน้นทำ MCP ให้สมบูรณ์ก่อน (ผู้ใช้ต้องการ)

### Priority 2: Dashboard Testing
- ทดสอบ n8n-mcp-agent Dashboard CRUD ให้ครบ (login เข้าได้แล้ว)
- AI connections create/delete
- Bot connections + webhook toggle
- n8n connections + API keys
- OAuth full flow

### Priority 3: Billing & Production
- Set Stripe secrets → `wrangler secret put` (ดู DEPLOYMENT.md Step 10)
- Landing page → ปรับ Landing.tsx ให้แสดงข้อมูลจริง
- Rate limit tuning, error alerting, backup strategy

---

## Key Files to Read

| Priority | File | Description |
|----------|------|-------------|
| 1 | `src/index.ts` | Main entry point - all API routes + MCP handler |
| 2 | `src/auth.ts` | Auth flow - register, login, API key validation |
| 3 | `src/stripe.ts` | Stripe billing - checkout, portal, webhooks |
| 4 | `src/db.ts` | Database layer - all CRUD operations |
| 5 | `schema.sql` | D1 database schema |
| 6 | `docs/DEPLOYMENT.md` | Full deployment guide (11 steps) |
| 7 | `docs/SAAS_PLAN.md` | Business plan + architecture |
| 8 | `dashboard/src/lib/api.ts` | Frontend API client |

---

**End of Handoff**
