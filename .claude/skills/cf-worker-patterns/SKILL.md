---
name: cf-worker-patterns
description: Cloudflare Worker patterns for D1 database, KV storage, and Workers runtime
user-invocable: false
---

# Cloudflare Worker Patterns

## D1 Database (SQLite)

### Prepared Statements (Required)
```typescript
// ✅ GOOD: Parameterized query
const user = await env.DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first();

// ❌ BAD: SQL injection risk
const user = await env.DB.exec(
  `SELECT * FROM users WHERE id = '${userId}'`
);
```

### Common Operations
```typescript
// Single row
const row = await env.DB.prepare(sql).bind(...args).first<T>();

// Multiple rows
const { results } = await env.DB.prepare(sql).bind(...args).all<T>();

// Insert/Update/Delete
const { meta } = await env.DB.prepare(sql).bind(...args).run();
console.log(meta.changes); // rows affected

// Batch operations
await env.DB.batch([
  env.DB.prepare('INSERT INTO ...').bind(...),
  env.DB.prepare('UPDATE ...').bind(...),
]);
```

### Null Handling
```typescript
// D1 returns null for missing rows
const user = await db.prepare(...).first<User>();
if (!user) {
  return jsonError('Not found', 404);
}
```

## KV Storage

### Rate Limiting Pattern
```typescript
// Sliding window rate limit
const key = `ratelimit:${userId}:${minute}`;
const count = await env.RATE_LIMIT_KV.get(key);

if (parseInt(count || '0') >= limit) {
  return jsonError('Rate limit exceeded', 429);
}

await env.RATE_LIMIT_KV.put(key, String(newCount), {
  expirationTtl: 60 // seconds
});
```

### OAuth State Storage
```typescript
// Store with TTL
await env.RATE_LIMIT_KV.put(`oauth:${state}`, JSON.stringify(data), {
  expirationTtl: 600 // 10 minutes
});

// Retrieve and delete
const data = await env.RATE_LIMIT_KV.get(`oauth:${state}`, 'json');
await env.RATE_LIMIT_KV.delete(`oauth:${state}`);
```

## Environment Bindings

```typescript
interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespace
  RATE_LIMIT_KV: KVNamespace;

  // Secrets (wrangler secret put)
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;

  // Variables (wrangler.toml)
  APP_URL: string;
}
```

## Request/Response Patterns

### JSON Response Helper
```typescript
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function jsonError(error: string, status = 400): Response {
  return json({ error }, status);
}
```

### CORS Headers
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

## Crypto (Web Crypto API)

Workers use Web Crypto API, not Node.js crypto:

```typescript
// Random bytes
const bytes = crypto.getRandomValues(new Uint8Array(32));

// SHA-256 hash
const hash = await crypto.subtle.digest('SHA-256', data);

// PBKDF2
const key = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  key, 256
);

// AES-GCM
const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext);
```

## Things to Avoid

- No Node.js APIs (fs, path, crypto module)
- No `process.env` (use `env` parameter)
- No synchronous operations
- No `console.log` in production (use `wrangler tail` for debugging)
