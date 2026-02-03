-- Migration: Add TOTP (Time-based One-Time Password) support
-- For 2FA authentication using Google Authenticator, Authy, etc.

-- Add TOTP columns to users table
ALTER TABLE users ADD COLUMN totp_secret_encrypted TEXT;  -- AES-256-GCM encrypted
ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0;  -- 0 = disabled, 1 = enabled
