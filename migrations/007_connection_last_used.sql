-- Migration 007: Add last_used_at to n8n_connections for activity tracking
-- Free plan connections inactive for 14 days will be auto-deleted

-- Add last_used_at column for connection activity tracking
ALTER TABLE n8n_connections ADD COLUMN last_used_at TEXT;

-- Initialize with created_at for existing connections (gives grace period)
UPDATE n8n_connections SET last_used_at = created_at WHERE last_used_at IS NULL;

-- Index for efficient inactive connection queries
CREATE INDEX IF NOT EXISTS idx_connections_last_used ON n8n_connections(last_used_at);
