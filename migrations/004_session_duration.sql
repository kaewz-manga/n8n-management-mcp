-- Migration 004: Add user-configurable session duration
-- Allows users to set their JWT expiry time (default: 24 hours = 86400 seconds)

ALTER TABLE users ADD COLUMN session_duration_seconds INTEGER DEFAULT 86400;
