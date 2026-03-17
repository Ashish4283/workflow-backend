-- TradeMaster MVP Tables for u879603724_creative4ai
-- USE `u879603724_creative4ai`; -- Uncomment if running manually in SQL tab

-- Trades Table
CREATE TABLE IF NOT EXISTS tm_trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    strategy_name VARCHAR(100) DEFAULT 'Momentum Breakout',
    type ENUM('STRANGLE', 'CE', 'PE') NOT NULL,
    status ENUM('OPEN', 'CLOSED', 'CANCELLED') DEFAULT 'OPEN',
    entry_price DECIMAL(10, 2),
    exit_price DECIMAL(10, 2),
    qty INT DEFAULT 50,
    pnl DECIMAL(12, 2) DEFAULT 0.00,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    metadata JSON -- For storing extra info like breakout points
);

-- Strategy Logs Table
CREATE TABLE IF NOT EXISTS tm_strategy_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_level ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') DEFAULT 'INFO',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE IF NOT EXISTS tm_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initial Settings
INSERT INTO tm_settings (setting_key, setting_value) VALUES 
('breakout_threshold', '120'),
('time_window_seconds', '300'),
('trading_mode', 'paper')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
