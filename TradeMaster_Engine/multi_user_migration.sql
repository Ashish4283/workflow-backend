-- Migration to add multi-user support to TradeMaster
-- Add user_id to tm_trades
ALTER TABLE tm_trades ADD COLUMN user_id INT NOT NULL;
ALTER TABLE tm_trades ADD INDEX (user_id);

-- Add user_id to tm_strategy_logs
ALTER TABLE tm_strategy_logs ADD COLUMN user_id INT NOT NULL;
ALTER TABLE tm_strategy_logs ADD INDEX (user_id);

-- Update tm_settings to include user_id in the primary key
-- First, drop the existing primary key
ALTER TABLE tm_settings DROP PRIMARY KEY;
-- Add user_id column
ALTER TABLE tm_settings ADD COLUMN user_id INT NOT NULL FIRST;
-- Add new primary key
ALTER TABLE tm_settings ADD PRIMARY KEY (user_id, setting_key);

-- Add foreign keys for integrity
ALTER TABLE tm_trades ADD CONSTRAINT fk_trades_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tm_strategy_logs ADD CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tm_settings ADD CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
