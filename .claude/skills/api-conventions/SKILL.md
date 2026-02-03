---
name: api-conventions
description: REST API conventions for auth headers, error format, and endpoint patterns
user-invocable: false
---

# API Conventions

## Base URLs

- **Production**: `https://n8n-management-mcp.node2flow.net`
- **Local**: `http://localhost:8787`

## Authentication Headers

### JWT (Dashboard)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### API Key (MCP)
```
Authorization: Bearer n2f_abc123...
```

### HMAC (Agent)
```
X-HMAC-Signature: <hmac-sha256>
X-User-Id: <userId>
X-AI-Connection-Id: <aiConnectionId>
```

## Endpoint Patterns

### RESTful Resources
```
GET    /api/connections          # List
POST   /api/connections          # Create
GET    /api/connections/:id      # Get one
PUT    /api/connections/:id      # Update
DELETE /api/connections/:id      # Delete
```

### Auth Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/totp/setup
POST   /api/auth/totp/enable
POST   /api/auth/verify-sudo
```

### MCP Endpoint
```
POST   /mcp                      # JSON-RPC 2.0
```

## Response Format

### Success
```json
{
  "id": "123",
  "name": "My Connection",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Error
```json
{
  "error": "Human-readable error message"
}
```

### List Response
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

## Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / Validation error |
| 401 | Unauthorized (missing/invalid auth) |
| 403 | Forbidden (valid auth, no permission) |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Validation Patterns

### Required Fields
```typescript
const { email, password } = await request.json();
if (!email || !password) {
  return jsonError('Email and password are required', 400);
}
```

### Email Format
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return jsonError('Invalid email format', 400);
}
```

### UUID Format
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

## MCP JSON-RPC Format

### Request
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_workflows",
    "arguments": {}
  },
  "id": 1
}
```

### Success Response
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{ "type": "text", "text": "..." }]
  },
  "id": 1
}
```

### Error Response
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  },
  "id": 1
}
```
