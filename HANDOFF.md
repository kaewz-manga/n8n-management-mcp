# HANDOFF.md - n8n MCP SaaS Platform

> Context สำหรับ Claude ตัวใหม่ที่จะทำงานต่อ

**Updated**: 2026-01-31
**GitHub**: https://github.com/kaewz-manga/n8n-mcp-multi-tanent-v2
**Production**: https://n8n-mcp-saas.suphakitm99.workers.dev
**Dashboard**: https://n8n-mcp-dashboard.pages.dev (Cloudflare Pages)

---

## โปรเจคนี้คืออะไร

**n8n MCP SaaS** - แพลตฟอร์ม SaaS ที่ให้บริการ MCP Server สำหรับเชื่อมต่อ AI clients (Claude, Cursor, etc.) กับ n8n automation platform

**Value**: ลูกค้าสมัคร → เพิ่ม n8n instance → ได้ API key `saas_xxx` → ใช้ AI ควบคุม n8n workflows ได้เลย

---

## สถานะปัจจุบัน (2026-01-31)

### ✅ ทำเสร็จแล้ว

- **SaaS Backend** - Auth, Connections, API Keys, Rate Limiting, Usage Tracking
- **31 MCP Tools** - n8n Public API coverage (Community Edition)
- **Cloudflare D1** - Database สร้าง + schema apply แล้ว
- **Cloudflare KV** - Rate limiting cache
- **GitHub Actions** - CI/CD (typecheck + deploy)
- **E2E Test ผ่าน** - Register → Login → Add Connection → MCP Initialize → list_workflows → list_tags
- **Bug fix** - getConnectionById missing .bind(), try-catch on /mcp endpoint
- **Dashboard deploy config** - React SPA พร้อม deploy ขึ้น Cloudflare Pages (wrangler.toml, _redirects, .env.production)
- **Stripe integration** - Checkout session, billing portal, webhook handler (signature verification)
- **OAuth endpoints** - GitHub + Google OAuth flow พร้อมใช้ (code + endpoints ครบ)
- **stdio-server.js SaaS mode** - รองรับทั้ง SaaS API key mode และ direct n8n mode

### ❌ ยังไม่ทำ (ต้อง set secrets บน Cloudflare)

- **Dashboard deploy** - `cd dashboard && npm run deploy` (ต้อง `npm install` ก่อน)
- **OAuth client IDs** - ต้องสร้าง OAuth App บน GitHub/Google แล้ว set secrets
- **Stripe secrets** - ต้องสร้าง Stripe account, products, prices แล้ว set secrets
- **DB migration** - ต้อง run `ALTER TABLE users ADD COLUMN stripe_customer_id TEXT` บน production D1

---

## Cloudflare Resources

| Resource | ID | Type |
|----------|-----|------|
| **Worker** | n8n-mcp-saas | Cloudflare Workers |
| **D1 Database** | `705840e0-4663-430e-9f3b-3778c209e525` | n8n-mcp-saas-db (APAC/SIN) |
| **KV Namespace** | `45d5d994b649440ab34e4f0a3a5eaa66` | RATE_LIMIT_KV |
| **Account ID** | `ed77f292a2c8173c4fbadebcd1fbe8fc` | Cloudflare Account |
| **Pages** | n8n-mcp-dashboard | Cloudflare Pages (dashboard SPA) |

### Secrets (set on Cloudflare Workers)

- `JWT_SECRET` - 32-byte hex for JWT signing
- `ENCRYPTION_KEY` - 32-byte hex for AES-GCM encryption of n8n API keys
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth (optional)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)
- `APP_URL` - Frontend URL for OAuth redirects (optional)
- `STRIPE_SECRET_KEY` - Stripe API key (optional)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (optional)
- `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` - Stripe Price IDs (optional)

---

## File Structure

```
n8n-mcp-workers/
├── src/
│   ├── index.ts          # Main Worker - API + MCP handler
│   ├── auth.ts           # Auth middleware - register, login, API key validation
│   ├── db.ts             # D1 database layer - all CRUD
│   ├── crypto-utils.ts   # Crypto - PBKDF2, AES-GCM, JWT, API key gen
│   ├── oauth.ts          # OAuth - GitHub + Google
│   ├── stripe.ts         # Stripe billing - checkout, portal, webhooks
│   ├── saas-types.ts     # TypeScript types
│   ├── n8n-client.ts     # n8n API client
│   ├── tools.ts          # 31 MCP tool definitions
│   └── types.ts          # Base types
├── dashboard/            # React 19 SPA (Cloudflare Pages)
│   ├── src/pages/        # Landing, Login, Register, Dashboard, Connections, Usage, Settings
│   ├── src/lib/api.ts    # API client with billing functions
│   ├── wrangler.toml     # Cloudflare Pages config
│   ├── .env.production   # Production API URL
│   └── public/_redirects # SPA routing
├── tests/
│   ├── crypto-utils.test.ts
│   └── tools.test.ts
├── schema.sql            # D1 database schema (6 tables + stripe_customer_id)
├── stdio-server.js       # Claude Desktop/Code stdio server (SaaS + Direct modes)
├── wrangler.toml         # Cloudflare Workers config (D1 + KV bindings)
├── docs/
│   ├── SAAS_PLAN.md      # Full SaaS business plan
│   └── DEPLOYMENT.md     # Deployment guide (OAuth + Stripe + Dashboard setup)
├── .github/workflows/
│   └── deploy.yml        # GitHub Actions (typecheck + deploy)
└── package.json
```

---

## API Endpoints

### Management API (`/api/*`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | - | สมัครด้วย email+password |
| `/api/auth/login` | POST | - | Login ได้ JWT token |
| `/api/auth/oauth/providers` | GET | - | ดู OAuth providers ที่เปิด |
| `/api/auth/oauth/:provider` | GET | - | เริ่ม OAuth flow |
| `/api/auth/oauth/:provider/callback` | GET | - | OAuth callback |
| `/api/plans` | GET | - | ดู pricing plans |
| `/api/webhooks/stripe` | POST | Signature | Stripe webhook handler |
| `/api/connections` | GET | JWT | ดู n8n connections ทั้งหมด |
| `/api/connections` | POST | JWT | เพิ่ม n8n instance + ได้ `saas_xxx` key |
| `/api/connections/:id` | DELETE | JWT | ลบ connection |
| `/api/connections/:id/api-keys` | POST | JWT | สร้าง API key ใหม่ |
| `/api/api-keys/:id` | DELETE | JWT | ลบ API key |
| `/api/usage` | GET | JWT | ดูสถิติการใช้งาน |
| `/api/user/profile` | GET | JWT | ดูข้อมูล user |
| `/api/user/password` | PUT | JWT | เปลี่ยนรหัสผ่าน |
| `/api/user` | DELETE | JWT | ลบ account |
| `/api/billing/checkout` | POST | JWT | สร้าง Stripe checkout session |
| `/api/billing/portal` | POST | JWT | สร้าง Stripe billing portal |

### MCP API (`/mcp`)

| Method | Auth | Description |
|--------|------|-------------|
| POST `/mcp` | Bearer `saas_xxx` | JSON-RPC 2.0 MCP protocol |

---

## 31 MCP Tools

### Workflow (10)
`n8n_list_workflows`, `n8n_get_workflow`, `n8n_create_workflow`, `n8n_update_workflow`, `n8n_delete_workflow`, `n8n_activate_workflow`, `n8n_deactivate_workflow`, `n8n_execute_workflow`, `n8n_get_workflow_tags`, `n8n_update_workflow_tags`

### Execution (4)
`n8n_list_executions`, `n8n_get_execution`, `n8n_delete_execution`, `n8n_retry_execution`

### Credential (4) - `n8n_list_credentials` removed (405 on Community Edition)
`n8n_create_credential`, `n8n_update_credential`, `n8n_delete_credential`, `n8n_get_credential_schema`

### Tag (5)
`n8n_list_tags`, `n8n_get_tag`, `n8n_create_tag`, `n8n_update_tag`, `n8n_delete_tag`

### Variable (4)
`n8n_list_variables`, `n8n_create_variable`, `n8n_update_variable`, `n8n_delete_variable`

### User (4)
`n8n_list_users`, `n8n_get_user`, `n8n_delete_user`, `n8n_update_user_role`

---

## Pricing Plans (in D1 database)

| Plan | Price | Requests/Month | Connections |
|------|-------|----------------|-------------|
| Free | $0 | 100 | 1 |
| Starter | $9.99/mo | 1,000 | 3 |
| Pro | $29.99/mo | 10,000 | 10 |
| Enterprise | $99.99/mo | 100,000 | Unlimited |

---

## Database Schema (D1)

6 tables: `users`, `n8n_connections`, `api_keys`, `usage_logs`, `usage_monthly`, `plans`

- Users: email + password_hash (PBKDF2) or OAuth + stripe_customer_id
- Connections: n8n URL + encrypted API key (AES-GCM)
- API keys: hashed (SHA-256), prefix stored for display
- Usage: per-request logs + monthly aggregation

---

## Auth Flow

```
1. Register (email+password or OAuth) → user created (plan: free)
2. Login → JWT token (24h expiry)
3. Add Connection (JWT + n8n URL + n8n API key) → connection created + saas_xxx key returned
4. Use MCP (Bearer saas_xxx) → authenticate → decrypt n8n key → call n8n API → track usage
5. Upgrade plan → Stripe checkout → webhook updates plan
```

---

## stdio-server.js Modes

```bash
# SaaS mode (connects through SaaS platform)
node stdio-server.js saas_YOUR_API_KEY
SAAS_API_KEY=saas_xxx node stdio-server.js

# Direct mode (connects directly to n8n)
node stdio-server.js <N8N_URL> <N8N_API_KEY>
N8N_URL=https://your-n8n.com N8N_API_KEY=your_key node stdio-server.js
```

---

## Commands

```bash
# Install
npm install

# Type check
npm run typecheck

# Run tests
npm test

# Local dev
npx wrangler dev

# Deploy worker
npx wrangler deploy

# Deploy dashboard
cd dashboard && npm install && npm run deploy

# GitHub Actions deploy
gh workflow run deploy.yml
```

---

## Known Issues / Bugs Fixed

1. **getConnectionById missing .bind(id)** - D1 query crashed with "Wrong number of parameter bindings" → Fixed (commit 84e1265)
2. **n8n_list_credentials returns 405** - n8n Community Edition blocks GET /api/v1/credentials → Removed tool
3. **npm start doesn't pass args** - stdio-server.js must use `node stdio-server.js` directly
4. **ENCRYPTION_KEY with newline** - `echo` adds trailing newline, use `printf` instead

---

## Test Account

- Email: `admin@node2flow.net`
- Plan: free (100 req/mo)
- Connection: n8n-no1 (https://n8n-no1.missmanga.org)

---

## Next Steps (Priority Order)

1. **Deploy dashboard** - `cd dashboard && npm install && npm run deploy`
2. **Set Stripe secrets** - Create Stripe account, products, prices → set wrangler secrets
3. **Set OAuth secrets** - Create GitHub/Google OAuth apps → set wrangler secrets
4. **DB migration** - `wrangler d1 execute n8n-mcp-saas-db --command "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT"`
5. **Re-deploy worker** - `npx wrangler deploy` (to pick up Stripe + OAuth code)

---

## Key Files to Read

1. `docs/SAAS_PLAN.md` - Full business plan, architecture, API spec
2. `docs/DEPLOYMENT.md` - Deployment guide with OAuth + Stripe setup
3. `src/index.ts` - Main entry point (API routes + MCP handler)
4. `src/auth.ts` - Auth flow (register, login, API key validation)
5. `src/stripe.ts` - Stripe billing integration
6. `schema.sql` - Database schema

---

**End of Handoff**
