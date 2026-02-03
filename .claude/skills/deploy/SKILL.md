---
name: deploy
description: Deploy Worker and Dashboard to Cloudflare
disable-model-invocation: true
---

# Deploy Checklist

Use this skill with `/deploy` to deploy to production.

## Pre-Deploy Checks

```bash
# 1. TypeScript check
npm run typecheck

# 2. Run tests
npm test

# 3. Check for uncommitted changes
git status
```

## Deploy Worker

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Verify deployment
curl https://n8n-management-mcp.node2flow.net/
```

## Deploy Dashboard

```bash
cd dashboard

# Build
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Verify deployment
curl https://n8n-management-dashboard.node2flow.net/
```

## Post-Deploy Verification

```bash
# 1. Health check
curl https://n8n-management-mcp.node2flow.net/

# 2. Plans endpoint (public)
curl https://n8n-management-mcp.node2flow.net/api/plans

# 3. MCP tools/list (requires API key)
curl -X POST https://n8n-management-mcp.node2flow.net/mcp \
  -H "Authorization: Bearer n2f_xxx" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Rollback

If something goes wrong:

```bash
# View deployment history
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback
```

## Real-time Logs

```bash
# Watch Worker logs
npx wrangler tail
```

## Environment Variables

Secrets are set via `wrangler secret put`:

```bash
# List secrets
wrangler secret list

# Set secret
wrangler secret put SECRET_NAME
```

## Checklist

- [ ] TypeScript passes
- [ ] Tests pass
- [ ] Changes committed
- [ ] Worker deployed
- [ ] Dashboard deployed
- [ ] Health check passes
- [ ] API endpoints work
