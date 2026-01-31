-- Migration: Add admin support
-- Date: 2026-01-31

-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tool ON usage_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_usage_logs_status ON usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
