-- Migration: Update plans to new pricing structure
-- Free: 100 requests/day, 1 connection
-- Pro: Unlimited, 10 connections, $19/month
-- Enterprise: Contact us (private MCP server)

-- Add daily_request_limit column
ALTER TABLE plans ADD COLUMN daily_request_limit INTEGER DEFAULT -1;

-- Delete old plans
DELETE FROM plans;

-- Insert new plans
INSERT INTO plans (id, name, daily_request_limit, monthly_request_limit, max_connections, price_monthly, features, is_active) VALUES
    ('free', 'Free', 100, -1, 1, 0, '{"support": "community", "analytics": false}', 1),
    ('pro', 'Pro', -1, -1, 10, 19, '{"support": "priority", "analytics": true, "unlimited": true}', 1),
    ('enterprise', 'Enterprise', -1, -1, -1, -1, '{"support": "dedicated", "analytics": true, "unlimited": true, "private_server": true, "contact_us": true}', 1);

-- Migrate existing users from starter plan to pro
UPDATE users SET plan = 'pro' WHERE plan = 'starter';
