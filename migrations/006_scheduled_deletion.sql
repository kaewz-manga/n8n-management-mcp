-- Migration: Add scheduled deletion support for account recovery (30-day grace period)
-- Date: 2026-02-05

-- Add scheduled deletion column to users table
ALTER TABLE users ADD COLUMN scheduled_deletion_at TEXT;

-- Index for cron job to find accounts ready for deletion
CREATE INDEX IF NOT EXISTS idx_users_scheduled_deletion ON users(scheduled_deletion_at);
