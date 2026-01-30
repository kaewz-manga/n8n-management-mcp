# Deployment Guide

คู่มือการ deploy n8n MCP SaaS Platform บน Cloudflare Workers

## Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

## Step 1: Login to Cloudflare

```bash
wrangler login
```

## Step 2: Create D1 Database

```bash
# Create database
wrangler d1 create n8n-mcp-saas-db

# Output จะแสดง database_id - copy ไปใส่ใน wrangler.toml
# [[d1_databases]]
# binding = "DB"
# database_name = "n8n-mcp-saas-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 3: Apply Database Schema

```bash
# Apply schema to database
wrangler d1 execute n8n-mcp-saas-db --file=./schema.sql
```

## Step 4: Create KV Namespace

```bash
# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMIT_KV"

# Output จะแสดง id - copy ไปใส่ใน wrangler.toml
# [[kv_namespaces]]
# binding = "RATE_LIMIT_KV"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Step 5: Set Secrets

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set JWT secret (ใช้สำหรับ sign JWT tokens)
wrangler secret put JWT_SECRET
# Paste the generated secret

# Set encryption key (ใช้สำหรับ encrypt n8n API keys)
wrangler secret put ENCRYPTION_KEY
# Paste another generated secret
```

## Step 6: Update wrangler.toml

แก้ไข `wrangler.toml` ใส่ค่าที่ได้จาก Step 2 และ Step 4:

```toml
[[d1_databases]]
binding = "DB"
database_name = "n8n-mcp-saas-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"  # แก้ตรงนี้

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_ACTUAL_KV_ID"  # แก้ตรงนี้
```

## Step 7: Deploy

```bash
# Deploy to production
wrangler deploy

# หรือ deploy to staging
wrangler deploy --env staging
```

## Step 8: Verify Deployment

```bash
# Test health endpoint
curl https://n8n-mcp-saas.YOUR_SUBDOMAIN.workers.dev/

# Expected response:
# {
#   "name": "n8n-mcp-saas",
#   "version": "2.0.0",
#   "status": "ok"
# }
```

---

## Local Development

### Run locally with persistence

```bash
# Install dependencies
npm install

# Run dev server
wrangler dev --local --persist
```

### Test with sample requests

```bash
# Register user
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Add n8n connection (use token from login response)
curl -X POST http://localhost:8787/api/connections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My n8n",
    "n8n_url": "https://your-n8n.example.com",
    "n8n_api_key": "your_n8n_api_key"
  }'

# Test MCP endpoint (use api_key from connection response)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer saas_YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

---

## Step 9: Setup OAuth (Optional)

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: n8n MCP SaaS
   - **Homepage URL**: `https://n8n-mcp-dashboard.pages.dev`
   - **Authorization callback URL**: `https://n8n-mcp-saas.suphakitm99.workers.dev/api/auth/oauth/github/callback`
4. Copy Client ID and Client Secret
5. Set secrets:

```bash
wrangler secret put GITHUB_CLIENT_ID
# Paste your GitHub OAuth App Client ID

wrangler secret put GITHUB_CLIENT_SECRET
# Paste your GitHub OAuth App Client Secret
```

### Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://n8n-mcp-saas.suphakitm99.workers.dev/api/auth/oauth/google/callback`
4. Copy Client ID and Client Secret
5. Set secrets:

```bash
wrangler secret put GOOGLE_CLIENT_ID
# Paste your Google OAuth Client ID

wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Google OAuth Client Secret
```

### Set APP_URL for OAuth redirects

```bash
wrangler secret put APP_URL
# Enter: https://n8n-mcp-dashboard.pages.dev
```

---

## Step 10: Setup Stripe Billing (Optional)

1. Create a Stripe account at https://stripe.com
2. Create Products and Prices in Stripe Dashboard:
   - **Starter**: $9.99/month recurring
   - **Pro**: $29.99/month recurring
   - **Enterprise**: $99.99/month recurring
3. Copy the Price IDs (e.g., `price_xxx`)
4. Set secrets:

```bash
wrangler secret put STRIPE_SECRET_KEY
# Paste your Stripe Secret Key (sk_live_xxx or sk_test_xxx)

wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your Stripe Webhook Signing Secret (whsec_xxx)

wrangler secret put STRIPE_PRICE_STARTER
# Paste Price ID for Starter plan

wrangler secret put STRIPE_PRICE_PRO
# Paste Price ID for Pro plan

wrangler secret put STRIPE_PRICE_ENTERPRISE
# Paste Price ID for Enterprise plan
```

5. Add webhook endpoint in Stripe Dashboard:
   - URL: `https://n8n-mcp-saas.suphakitm99.workers.dev/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`

---

## Step 11: Deploy Dashboard (Cloudflare Pages)

```bash
cd dashboard

# Install dependencies
npm install

# Deploy to Cloudflare Pages
npm run deploy
```

The dashboard will be available at: `https://n8n-mcp-dashboard.pages.dev`

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `ENCRYPTION_KEY` | Secret for encrypting n8n API keys | Yes |
| `ENVIRONMENT` | Environment name (development/staging/production) | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | No |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | No |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | No |
| `APP_URL` | Frontend URL for OAuth redirects | No |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | No |
| `STRIPE_PRICE_STARTER` | Stripe Price ID for Starter plan | No |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan | No |
| `STRIPE_PRICE_ENTERPRISE` | Stripe Price ID for Enterprise plan | No |

---

## Troubleshooting

### Database errors

```bash
# Check database tables
wrangler d1 execute n8n-mcp-saas-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# Re-apply schema if needed
wrangler d1 execute n8n-mcp-saas-db --file=./schema.sql
```

### View logs

```bash
# Tail production logs
wrangler tail

# Tail with filter
wrangler tail --format=pretty
```

### Reset database (CAUTION: deletes all data)

```bash
# Drop all tables
wrangler d1 execute n8n-mcp-saas-db --command "DROP TABLE IF EXISTS usage_logs"
wrangler d1 execute n8n-mcp-saas-db --command "DROP TABLE IF EXISTS usage_monthly"
wrangler d1 execute n8n-mcp-saas-db --command "DROP TABLE IF EXISTS api_keys"
wrangler d1 execute n8n-mcp-saas-db --command "DROP TABLE IF EXISTS n8n_connections"
wrangler d1 execute n8n-mcp-saas-db --command "DROP TABLE IF EXISTS users"
wrangler d1 execute n8n-mcp-saas-db --command "DROP TABLE IF EXISTS plans"

# Re-apply schema
wrangler d1 execute n8n-mcp-saas-db --file=./schema.sql
```

---

## API Endpoints Summary

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/plans` | List pricing plans |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### OAuth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/oauth/providers` | List enabled OAuth providers |
| GET | `/api/auth/oauth/:provider` | Get OAuth authorize URL |
| GET | `/api/auth/oauth/:provider/callback` | OAuth callback handler |

### Protected Endpoints (requires JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/password` | Change password |
| DELETE | `/api/user` | Delete account |
| GET | `/api/connections` | List n8n connections |
| POST | `/api/connections` | Add n8n connection |
| DELETE | `/api/connections/:id` | Delete connection |
| POST | `/api/connections/:id/api-keys` | Generate new API key |
| DELETE | `/api/api-keys/:id` | Revoke API key |
| GET | `/api/usage` | Get usage statistics |
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/billing/portal` | Create Stripe billing portal |

### Webhook Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### MCP Endpoint (requires SaaS API key)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/mcp` | MCP JSON-RPC endpoint |

---

## Security Checklist

- [ ] JWT_SECRET is a secure random string (32+ bytes)
- [ ] ENCRYPTION_KEY is a secure random string (32+ bytes)
- [ ] CORS is configured correctly for production
- [ ] Rate limiting is enabled
- [ ] Database backups are configured
- [ ] Monitoring/alerting is set up
