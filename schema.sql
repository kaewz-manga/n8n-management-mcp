-- n8n MCP SaaS Platform - Database Schema
-- For Cloudflare D1

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,  -- NULL for OAuth users
    oauth_provider TEXT,  -- 'github', 'google', or NULL for email/password
    oauth_id TEXT,  -- Provider's user ID
    plan TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active',  -- active, suspended, deleted
    is_admin INTEGER DEFAULT 0,  -- 0 = normal user, 1 = admin
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- n8n Connections Table
-- ============================================
CREATE TABLE IF NOT EXISTS n8n_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    n8n_url TEXT NOT NULL,
    n8n_api_key_encrypted TEXT NOT NULL,
    status TEXT DEFAULT 'active',  -- active, inactive, error
    last_tested_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- API Keys Table
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,  -- First 8 chars for display (e.g., "saas_abc...")
    name TEXT DEFAULT 'Default',
    status TEXT DEFAULT 'active',  -- active, revoked
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (connection_id) REFERENCES n8n_connections(id) ON DELETE CASCADE
);

-- ============================================
-- Usage Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    api_key_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    status TEXT NOT NULL,  -- success, error, rate_limited
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Monthly Usage Summary Table
-- ============================================
CREATE TABLE IF NOT EXISTS usage_monthly (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    year_month TEXT NOT NULL,  -- Format: '2024-01'
    request_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, year_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- Plans Table
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    daily_request_limit INTEGER DEFAULT -1,  -- -1 = unlimited
    requests_per_minute INTEGER DEFAULT 50,  -- -1 = unlimited
    monthly_request_limit INTEGER NOT NULL,  -- deprecated
    max_connections INTEGER NOT NULL,        -- -1 = unlimited
    price_monthly REAL NOT NULL,             -- -1 = contact us
    features TEXT,  -- JSON string
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Insert Default Plans
-- ============================================
-- Free: 50 req/min, 100 req/day, unlimited connections, $0
-- Pro: 100 req/min, 5000 req/day (fair use), unlimited connections, $19/month
-- Enterprise: Custom (contact us)
INSERT OR IGNORE INTO plans (id, name, daily_request_limit, requests_per_minute, monthly_request_limit, max_connections, price_monthly, features) VALUES
    ('free', 'Free', 100, 50, -1, -1, 0, '{"support": "community", "analytics": false}'),
    ('pro', 'Pro', 5000, 100, -1, -1, 19, '{"support": "priority", "analytics": true, "fair_use": true}'),
    ('enterprise', 'Enterprise', -1, -1, -1, -1, -1, '{"support": "dedicated", "analytics": true, "private_server": true, "contact_us": true}');

-- ============================================
-- Admin Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_n8n_connections_user ON n8n_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_connections_status ON n8n_connections(status);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_connection ON api_keys(connection_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key ON usage_logs(api_key_id);

CREATE INDEX IF NOT EXISTS idx_usage_monthly_user ON usage_monthly(user_id, year_month);

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tool ON usage_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_usage_logs_status ON usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
