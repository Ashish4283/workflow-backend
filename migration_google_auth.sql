-- Migration to add Google Auth columns and fix password column if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local' AFTER email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) AFTER auth_provider;

-- Ensure 'password' column exists (register.php uses 'password', but schema said 'password_hash')
-- We'll check this via a PHP script instead since SQL 'IF NOT EXISTS' for columns is tricky in MySQL < 8.0
