---
name: deploy
description: Deploy Worker and Dashboard to Cloudflare with full verification
user-invocable: true
---

# Deploy to Production

Use `/deploy` to deploy Worker and Dashboard.

---

## Pre-Deploy Checks

```bash
# 1. TypeScript check
npm run typecheck

# 2. Run tests
npm test

# 3. Check for uncommitted changes
git status
```

If any check fails, fix issues before deploying.

---

## Deploy Worker

```bash
npx wrangler deploy
```

Verify deployment:
```bash
curl -s https://n8n-management-mcp.node2flow.net/
curl -s https://n8n-management-mcp.node2flow.net/api/plans
```

---

## Deploy Dashboard

```bash
cd dashboard
npm run build
npm run deploy
```

Verify deployment:
```bash
curl -I https://n8n-management-dashboard.node2flow.net/
```

---

## Post-Deploy Verification

### Option 1: Manual Check

```bash
# Health check
curl https://n8n-management-mcp.node2flow.net/

# Plans endpoint
curl https://n8n-management-mcp.node2flow.net/api/plans

# MCP tools/list (requires API key)
curl -X POST https://n8n-management-mcp.node2flow.net/mcp \
  -H "Authorization: Bearer n2f_xxx" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Option 2: Use cloudflare-observability MCP

Use **cloudflare-observability** MCP server to:
- View recent logs
- Check for 500 errors
- Verify response times

---

## Rollback

If something goes wrong:

```bash
# View deployment history
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback
```

---

## Real-time Logs

```bash
npx wrangler tail
```

Or use **cloudflare-observability** MCP for advanced log analysis.

---

## Environment Variables

Secrets are set via `wrangler secret put`:

```bash
# List secrets
wrangler secret list

# Set secret
wrangler secret put SECRET_NAME
```

---

## Record Deployment (Memory MCP)

After successful deployment, record in Memory MCP:

```
Entity: deploy-YYYY-MM-DD
Type: deployment
Observations:
  - Worker version deployed
  - Dashboard version deployed
  - Changes included
  - Verification results
```

---

## Checklist

- [ ] TypeScript passes
- [ ] Tests pass
- [ ] Changes committed
- [ ] Worker deployed
- [ ] Dashboard deployed
- [ ] Health check passes
- [ ] API endpoints work
- [ ] Logged in Memory MCP
