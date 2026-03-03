<?php
// api/db-config.php

// 1. Configure CORS
$allowed_origins = getenv('ALLOWED_ORIGINS') ? explode(',', getenv('ALLOWED_ORIGINS')) : ['*']; // Allow all by default if not set, but restrict in prod
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array('*', $allowed_origins) || in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
} else {
    header("Access-Control-Allow-Origin: null"); // Prevent unauthorized access
}

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Max-Age: 86400"); // Cache preflight request for 1 day

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 2. Load .env file manually if it exists
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        
        // Populate all possible arrays for compatibility
        if (!getenv($name)) {
            putenv("{$name}={$value}");
        }
        if (!isset($_ENV[$name])) {
            $_ENV[$name] = $value;
        }
        if (!isset($_SERVER[$name])) {
            $_SERVER[$name] = $value;
        }
    }
}
loadEnv(__DIR__ . '/../.env');
loadEnv(__DIR__ . '/.env'); 
loadEnv($_SERVER['DOCUMENT_ROOT'] . '/.env');

// 3. Helper to get env from any source
function get_env_var($key, $default = null) {
    $val = getenv($key);
    if ($val !== false) return $val;
    if (isset($_ENV[$key])) return $_ENV[$key];
    if (isset($_SERVER[$key])) return $_SERVER[$key];
    return $default;
}

// 4. Database Credentials
$host = get_env_var('DB_HOST', "127.0.0.1");
$db   = get_env_var('DB_NAME', "u879603724_creative4ai");
$user = get_env_var('DB_USER', "u879603724_creative4ai_us");
$pass = get_env_var('DB_PASS') ?: get_env_var('DB_PASSWORD');

if (!$pass) {
    error_log("Security Error: Database password not found in environment.");
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server configuration error."]);
    exit;
}

// 3. PDO Connection Setup
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false, // Very important for security against SQL Injection
    PDO::ATTR_STRINGIFY_FETCHES  => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // --- AUTO-MIGRATION V2 (MONETIZATION & ACTIVATION) ---
    // Users Table
    $checkUserCols = $pdo->query("SHOW COLUMNS FROM users");
    $userCols = $checkUserCols->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('subscription_tier', $userCols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN subscription_tier ENUM('free', 'pro', 'enterprise') DEFAULT 'free'");
    }
    if (!in_array('usage_balance', $userCols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN usage_balance INT DEFAULT 100"); // 100 free credits
    }
    if (!in_array('api_key', $userCols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN api_key VARCHAR(255) DEFAULT NULL");
    }

    // Workflows Table
    $checkWfCols = $pdo->query("SHOW COLUMNS FROM workflows");
    $wfCols = $checkWfCols->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('is_template', $wfCols)) {
        $pdo->exec("ALTER TABLE workflows ADD COLUMN is_template TINYINT(1) DEFAULT 0");
    }
    if (!in_array('category', $wfCols)) {
        $pdo->exec("ALTER TABLE workflows ADD COLUMN category VARCHAR(50) DEFAULT 'general'");
    }
    if (!in_array('assigned_to', $wfCols)) {
        $pdo->exec("ALTER TABLE workflows ADD COLUMN assigned_to INT DEFAULT NULL"); // User ID of the worker/agent
    }
    if (!in_array('assigned_by', $wfCols)) {
        $pdo->exec("ALTER TABLE workflows ADD COLUMN assigned_by INT DEFAULT NULL"); // User ID of the manager
    }

    // Invitation Links Table
    $checkInvCols = $pdo->query("SHOW COLUMNS FROM invitation_links");
    $invCols = $checkInvCols->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('group_id', $invCols)) {
        $pdo->exec("ALTER TABLE invitation_links ADD COLUMN group_id INT DEFAULT NULL");
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database Connection Error: " . $e->getMessage()); // Log error instead of exposing it
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit;
}
?>