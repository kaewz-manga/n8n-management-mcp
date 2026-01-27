# n8n MCP SaaS Platform

**Multi-tenant n8n automation via Model Context Protocol - SaaS Edition**

A complete SaaS platform that provides MCP server as a service for n8n automation. Users register, connect their n8n instances, and get API keys to use with any MCP-compatible client (Claude Desktop, Cursor, etc.).

---

## Features

### Platform Features
- **Multi-tenant SaaS** - One platform, unlimited users
- **Dashboard** - Modern React dashboard for managing connections
- **OAuth Login** - Sign in with GitHub or Google
- **Usage Tracking** - Monitor API usage with monthly limits
- **Subscription Plans** - Free, Starter, Pro, and Enterprise tiers

### Technical Features
- **32 MCP Tools** - Complete n8n Public API coverage
- **Edge Deployment** - Cloudflare Workers for global low latency
- **Secure Storage** - AES-256 encryption for n8n credentials
- **Rate Limiting** - Per-user monthly request limits

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│  Cloudflare      │────▶│  n8n Instance   │
│ (Claude/Cursor) │     │  Workers         │     │  (Customer's)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │ Bearer Token          │ D1 Database
        │ (SaaS API Key)        │ KV Store
        │                       │
        └───────────────────────┘

┌─────────────────┐     ┌──────────────────┐
│   Dashboard     │────▶│  Management API  │
│   (React App)   │     │  (/api/*)        │
└─────────────────┘     └──────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### 1. Clone and Install

```bash
git clone https://github.com/your-repo/n8n-mcp-saas.git
cd n8n-mcp-saas
npm install
```

### 2. Setup Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create D1 Database
wrangler d1 create n8n-mcp-saas-db
# Copy the database_id from output

# Create KV Namespace
wrangler kv:namespace create "RATE_LIMIT_KV"
# Copy the id from output
```

### 3. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "n8n-mcp-saas-db"
database_id = "YOUR_DATABASE_ID_HERE"  # <- Replace this

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_KV_NAMESPACE_ID_HERE"  # <- Replace this
```

### 4. Apply Database Schema

```bash
wrangler d1 execute n8n-mcp-saas-db --file=./schema.sql
```

### 5. Set Secrets

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set required secrets
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY

# Optional: OAuth (for GitHub/Google login)
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put APP_URL  # e.g., https://your-app.com
```

### 6. Deploy

```bash
# Deploy API server
wrangler deploy

# Build and deploy dashboard (optional - can host separately)
cd dashboard
npm install
npm run build
# Deploy dist/ to your hosting (Cloudflare Pages, Vercel, etc.)
```

---

## Local Development

### Backend (API Server)

```bash
# Start local dev server with D1 and KV
wrangler dev --local --persist

# The API will be available at http://localhost:8787
```

### Frontend (Dashboard)

```bash
cd dashboard
npm install
npm run dev

# Dashboard will be available at http://localhost:5173
```

### Environment Variables (Dashboard)

Create `dashboard/.env.local`:

```env
VITE_API_URL=http://localhost:8787
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/oauth/providers` | List enabled OAuth providers |
| GET | `/api/auth/oauth/{provider}` | Get OAuth authorize URL |
| GET | `/api/auth/oauth/{provider}/callback` | OAuth callback handler |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| PUT | `/api/user/password` | Change password |
| DELETE | `/api/user` | Delete account |

### Connections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connections` | List all connections |
| POST | `/api/connections` | Create new connection |
| DELETE | `/api/connections/:id` | Delete connection |
| POST | `/api/connections/:id/api-keys` | Generate new API key |
| DELETE | `/api/api-keys/:id` | Revoke API key |

### Usage & Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/usage` | Get current usage stats |
| GET | `/api/plans` | List available plans |

### MCP Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mcp` | MCP JSON-RPC endpoint |

---

## MCP Client Configuration

After registering and creating a connection, use this config in your MCP client:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "n8n": {
      "url": "https://your-api.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### Cursor / Other MCP Clients

```json
{
  "mcpServers": {
    "n8n": {
      "type": "http",
      "url": "https://your-api.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

---

## Available MCP Tools (32 Total)

### Workflow Management (10 tools)
- `n8n_list_workflows` - List all workflows
- `n8n_get_workflow` - Get workflow details
- `n8n_create_workflow` - Create new workflow
- `n8n_update_workflow` - Update workflow
- `n8n_delete_workflow` - Delete workflow
- `n8n_activate_workflow` - Activate workflow
- `n8n_deactivate_workflow` - Deactivate workflow
- `n8n_execute_workflow` - Execute workflow
- `n8n_get_workflow_tags` - Get workflow tags
- `n8n_update_workflow_tags` - Update workflow tags

### Execution Management (4 tools)
- `n8n_list_executions` - List executions
- `n8n_get_execution` - Get execution details
- `n8n_delete_execution` - Delete execution
- `n8n_retry_execution` - Retry failed execution

### Credential Management (5 tools)
- `n8n_list_credentials` - List credentials
- `n8n_create_credential` - Create credential
- `n8n_update_credential` - Update credential
- `n8n_delete_credential` - Delete credential
- `n8n_get_credential_schema` - Get credential schema

### Tag Management (5 tools)
- `n8n_list_tags` - List tags
- `n8n_get_tag` - Get tag details
- `n8n_create_tag` - Create tag
- `n8n_update_tag` - Update tag
- `n8n_delete_tag` - Delete tag

### Variable Management (4 tools)
- `n8n_list_variables` - List variables
- `n8n_create_variable` - Create variable
- `n8n_update_variable` - Update variable
- `n8n_delete_variable` - Delete variable

### User Management (4 tools)
- `n8n_list_users` - List users
- `n8n_get_user` - Get user details
- `n8n_delete_user` - Delete user
- `n8n_update_user_role` - Update user role

---

## Pricing Plans

| Plan | Requests/Month | Connections | Price |
|------|---------------|-------------|-------|
| Free | 100 | 1 | $0 |
| Starter | 1,000 | 3 | $9.99 |
| Pro | 10,000 | 10 | $29.99 |
| Enterprise | 100,000 | Unlimited | $99.99 |

---

## Project Structure

```
n8n-mcp-saas/
├── src/
│   ├── index.ts          # Main Cloudflare Worker entry
│   ├── auth.ts           # Authentication handlers
│   ├── oauth.ts          # OAuth handlers (GitHub/Google)
│   ├── db.ts             # Database operations
│   ├── crypto-utils.ts   # Encryption/hashing utilities
│   ├── n8n-client.ts     # n8n API client
│   ├── tools.ts          # MCP tool definitions
│   ├── types.ts          # TypeScript types
│   └── saas-types.ts     # SaaS-specific types
├── dashboard/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # API client
│   └── ...
├── schema.sql            # D1 database schema
├── wrangler.toml         # Cloudflare configuration
└── package.json
```

---

## Security

- **Password Hashing**: PBKDF2 with 100,000 iterations
- **Credential Encryption**: AES-256-GCM for n8n API keys
- **JWT Tokens**: HS256 with 7-day expiry
- **API Keys**: SHA-256 hashed, never stored in plain text
- **OAuth State**: CSRF protection with KV-stored state tokens

---

## Environment Variables

### Required Secrets

| Name | Description |
|------|-------------|
| `JWT_SECRET` | Secret for JWT signing (32+ bytes hex) |
| `ENCRYPTION_KEY` | Secret for AES encryption (32 bytes hex) |

### Optional Secrets (OAuth)

| Name | Description |
|------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `APP_URL` | Frontend URL for OAuth redirects |

---

## Troubleshooting

### "Invalid or missing token"

- Check that `Authorization: Bearer YOUR_API_KEY` header is set
- Verify the API key hasn't been revoked
- Ensure the API key is for an active connection

### "Rate limit exceeded"

- Check your current usage at `/api/usage`
- Upgrade your plan for higher limits
- Wait for monthly reset

### OAuth not working

- Ensure OAuth secrets are set correctly
- Check that `APP_URL` matches your frontend domain
- Verify OAuth app callback URLs are configured correctly

---

## License

MIT

---

## Links

- [n8n Documentation](https://docs.n8n.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [MCP Specification](https://modelcontextprotocol.io/)
