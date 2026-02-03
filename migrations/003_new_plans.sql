-- Migration: Update plans to new pricing structure
-- Free: 50 req/min, 100 req/day, unlimited connections
-- Pro: 100 req/min, 5000 req/day (fair use), unlimited connections, $19/month
-- Enterprise: Custom (contact us)

-- Add new columns
ALTER TABLE plans ADD COLUMN daily_request_limit INTEGER DEFAULT -1;
ALTER TABLE plans ADD COLUMN requests_per_minute INTEGER DEFAULT 10;

-- Delete old plans
DELETE FROM plans;

-- Insert new plans
INSERT INTO plans (id, name, daily_request_limit, requests_per_minute, monthly_request_limit, max_connections, price_monthly, features, is_active) VALUES
    ('free', 'Free', 100, 50, -1, -1, 0, '{"support": "community", "analytics": false}', 1),
    ('pro', 'Pro', 5000, 100, -1, -1, 19, '{"support": "priority", "analytics": true, "fair_use": true}', 1),
    ('enterprise', 'Enterprise', -1, -1, -1, -1, -1, '{"support": "dedicated", "analytics": true, "private_server": true, "contact_us": true}', 1);

-- Migrate existing users from starter plan to free (if any)
UPDATE users SET plan = 'free' WHERE plan = 'starter';
