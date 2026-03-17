-- TradeMaster MVP Tables for u879603724_creative4ai (Multi-User Version)
-- Optimized for institutional-grade isolation

-- Trades Table
CREATE TABLE IF NOT EXISTS tm_trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
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
    metadata JSON,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Strategy Logs Table
CREATE TABLE IF NOT EXISTS tm_strategy_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_level ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') DEFAULT 'INFO',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System Settings (User-Scoped)
CREATE TABLE IF NOT EXISTS tm_settings (
    user_id INT NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, setting_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
