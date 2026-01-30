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

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `ENCRYPTION_KEY` | Secret for encrypting n8n API keys | Yes |
| `ENVIRONMENT` | Environment name (development/staging/production) | No |

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

### Protected Endpoints (requires JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/profile` | Get user profile |
| GET | `/api/connections` | List n8n connections |
| POST | `/api/connections` | Add n8n connection |
| DELETE | `/api/connections/:id` | Delete connection |
| POST | `/api/connections/:id/api-keys` | Generate new API key |
| DELETE | `/api/api-keys/:id` | Revoke API key |
| GET | `/api/usage` | Get usage statistics |

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
