---
name: db-migrations
description: Database migration guide for Cloudflare D1
disable-model-invocation: true
---

# Database Migrations

Use this skill with `/db-migrations` to manage D1 schema changes.

## Migration Files

Location: `migrations/`

Naming: `XXX_description.sql` (e.g., `005_totp.sql`)

## Create Migration

```bash
# Create new migration file
touch migrations/006_new_feature.sql
```

Example migration:
```sql
-- migrations/006_new_feature.sql

-- Add new column
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Create new table
CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  data TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);
```

## Apply Migration

```bash
# Preview (local)
npx wrangler d1 execute n8n-management-mcp-db --local --file=./migrations/006_new_feature.sql

# Apply to production
npx wrangler d1 execute n8n-management-mcp-db --remote --file=./migrations/006_new_feature.sql
```

## Query Database

```bash
# Run query
npx wrangler d1 execute n8n-management-mcp-db --remote --command "SELECT * FROM users LIMIT 5"

# Show tables
npx wrangler d1 execute n8n-management-mcp-db --remote --command ".tables"

# Show table schema
npx wrangler d1 execute n8n-management-mcp-db --remote --command ".schema users"
```

## Current Schema

```
users
├── id TEXT PRIMARY KEY
├── email TEXT UNIQUE
├── password_hash TEXT
├── plan TEXT (free/pro/enterprise)
├── stripe_customer_id TEXT
├── totp_secret_encrypted TEXT
├── totp_enabled INTEGER
├── created_at TEXT
└── updated_at TEXT

n8n_connections
├── id TEXT PRIMARY KEY
├── user_id TEXT → users(id)
├── name TEXT
├── base_url TEXT
├── api_key_encrypted TEXT
├── created_at TEXT
└── updated_at TEXT

api_keys
├── id TEXT PRIMARY KEY
├── connection_id TEXT → n8n_connections(id)
├── key_hash TEXT (SHA-256)
├── key_prefix TEXT (n2f_xxx...)
├── created_at TEXT
└── last_used_at TEXT

ai_connections
├── id TEXT PRIMARY KEY
├── user_id TEXT → users(id)
├── name TEXT
├── provider TEXT (openai/anthropic/google)
├── api_key_encrypted TEXT
└── created_at TEXT

bot_connections
├── id TEXT PRIMARY KEY
├── user_id TEXT → users(id)
├── ai_connection_id TEXT → ai_connections(id)
├── name TEXT
├── platform TEXT (telegram/line/discord)
├── token_encrypted TEXT
└── created_at TEXT

usage_logs
├── id INTEGER PRIMARY KEY
├── user_id TEXT
├── tool_name TEXT
├── created_at TEXT
└── ...

usage_monthly
├── user_id TEXT
├── year_month TEXT
├── request_count INTEGER
└── PRIMARY KEY (user_id, year_month)
```

## Rollback Strategy

D1 doesn't support automatic rollback. Always:

1. **Backup data** before destructive changes
2. **Test locally** first with `--local`
3. **Keep rollback SQL** ready

Example rollback:
```sql
-- Rollback 006_new_feature.sql
DROP TABLE IF EXISTS new_table;
ALTER TABLE users DROP COLUMN new_field;
```

## Best Practices

- ✅ Use `IF NOT EXISTS` / `IF EXISTS`
- ✅ Add indexes for foreign keys
- ✅ Include rollback SQL
- ✅ Test on local D1 first
- ❌ Don't delete columns with data
- ❌ Don't change column types (create new column instead)
