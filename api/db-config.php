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

    // --- AUTO-MIGRATION V3 (ENTERPRISE SAAS ARCHITECTURE) ---
    
    // 1. Organizations (Top-level Tenancy)
    $pdo->exec("CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        billing_tier ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
        is_public_client TINYINT(1) DEFAULT 0,
        logo_url TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $orgCols = $pdo->query("SHOW COLUMNS FROM organizations")->fetchAll(PDO::FETCH_COLUMN);
    $orgColumnMap = [
        'is_public_client' => "TINYINT(1) DEFAULT 0",
        'logo_url' => "TEXT DEFAULT NULL",
        'parent_id' => "INT DEFAULT NULL"
    ];

    foreach ($orgColumnMap as $col => $def) {
        if (!in_array($col, $orgCols)) {
            $pdo->exec("ALTER TABLE organizations ADD COLUMN $col $def");
        }
    }

    // 2. Clusters (Renamed Groups)
    $pdo->exec("CREATE TABLE IF NOT EXISTS clusters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        org_id INT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // 2b. Migration: Remove global unique constraint on cluster name if it exists
    try {
        $pdo->exec("ALTER TABLE clusters DROP INDEX name");
    } catch (Exception $e) {
        // Index might not exist or already removed
    }
    
    // Add composite unique key for (org_id, name) if desired, but for now just relaxing the constraint
    // $pdo->exec("ALTER TABLE clusters ADD UNIQUE KEY org_cluster_name (org_id, name)");

    // 3. Cluster Memberships (Normalization)
    $pdo->exec("CREATE TABLE IF NOT EXISTS cluster_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cluster_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('manager', 'member') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_cluster (user_id, cluster_id)
    )");

    // 4. Users Core Update
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        role ENUM('super_admin', 'admin', 'manager', 'tech_user', 'agent') DEFAULT 'tech_user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $userCols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
    $columnMap = [
        'org_id' => "INT DEFAULT NULL",
        'subscription_tier' => "ENUM('free', 'pro', 'enterprise') DEFAULT 'free'",
        'usage_balance' => "INT DEFAULT 100",
        'api_key' => "VARCHAR(255) DEFAULT NULL",
        'avatar_url' => "TEXT DEFAULT NULL",
        'notification_prefs' => "JSON DEFAULT NULL",
        'builder_prefs' => "JSON DEFAULT NULL",
        'engine_prefs' => "JSON DEFAULT NULL",
        'group_id' => "INT DEFAULT NULL",
        'trial_ends_at' => "TIMESTAMP DEFAULT NULL",
        'manager_id' => "INT DEFAULT NULL",
        'auth_provider' => "VARCHAR(50) DEFAULT 'local'",
        'provider_id' => "VARCHAR(255) DEFAULT NULL"
    ];

    foreach ($columnMap as $col => $def) {
        if (!in_array($col, $userCols)) {
            $pdo->exec("ALTER TABLE users ADD COLUMN $col $def");
        }
    }

    // 4b. Self-Healing Migration: Force ENUM expansion
    try {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'tech_user', 'agent', 'worker') DEFAULT 'tech_user'");
    } catch (Exception $e) {
        // Log but don't crash - maybe table is locked
        error_log("Non-critical users migration skipped: " . $e->getMessage());
    }

    // 4c. Restore Ashish as Super Admin (Hard-reset)
    $pdo->exec("UPDATE users SET role = 'super_admin' WHERE email = 'ashish.jiwa@gmail.com'");

    // 4d. Default corrupted roles to tech_user
    $pdo->exec("UPDATE users SET role = 'tech_user' WHERE role IS NULL OR role = ''");

    // 5. Workflows (Cluster Scoped)
    $pdo->exec("CREATE TABLE IF NOT EXISTS workflows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cluster_id INT DEFAULT NULL,
        group_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        builder_json JSON,
        is_template TINYINT(1) DEFAULT 0,
        category VARCHAR(50) DEFAULT 'general',
        assigned_to INT DEFAULT NULL,
        assigned_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $wfCols = $pdo->query("SHOW COLUMNS FROM workflows")->fetchAll(PDO::FETCH_COLUMN);
    $wfColumnMap = [
        'cluster_id' => "INT DEFAULT NULL",
        'org_id' => "INT DEFAULT NULL",
        'status' => "ENUM('draft', 'active', 'archived') DEFAULT 'active'",
        'environment' => "ENUM('draft', 'test', 'prod') DEFAULT 'draft'",
        'version' => "INT DEFAULT 1",
        'parent_id' => "INT DEFAULT NULL" 
    ];

    foreach ($wfColumnMap as $col => $def) {
        if (!in_array($col, $wfCols)) {
            $pdo->exec("ALTER TABLE workflows ADD COLUMN $col $def");
        }
    }

    // 5b. Workflow History (for Version Control)
    $pdo->exec("CREATE TABLE IF NOT EXISTS workflow_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workflow_id INT NOT NULL,
        builder_json JSON,
        version INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 6. Vault Secrets (Encrypted Storage)
    $pdo->exec("CREATE TABLE IF NOT EXISTS vault_secrets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cluster_id INT NOT NULL,
        key_name VARCHAR(100) NOT NULL,
        provider_type VARCHAR(50) NOT NULL,
        encrypted_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY cluster_key (cluster_id, key_name)
    )");

    // 7. Execution Logs (Real Activity)
    $pdo->exec("CREATE TABLE IF NOT EXISTS execution_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workflow_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('running', 'completed', 'failed') DEFAULT 'running',
        duration VARCHAR(50),
        node_count INT DEFAULT 0,
        error_message TEXT,
        execution_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS invitation_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) NOT NULL UNIQUE,
        type ENUM('manager_invite', 'agent_invite', 'org_invite') NOT NULL,
        target_role ENUM('manager', 'tech_user', 'worker', 'agent') DEFAULT 'agent',
        creator_id INT NOT NULL,
        workflow_id INT DEFAULT NULL,
        cluster_id INT DEFAULT NULL,
        org_id INT DEFAULT NULL,
        uses_count INT DEFAULT 0,
        max_uses INT DEFAULT 100,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Self-healing: add columns if they don't exist
    $invLinksCols = $pdo->query("SHOW COLUMNS FROM invitation_links")->fetchAll(PDO::FETCH_COLUMN);
    $invColumnMap = [
        'target_role' => "ENUM('manager', 'tech_user', 'worker', 'agent') DEFAULT 'agent'",
        'org_id' => "INT DEFAULT NULL",
        'uses_count' => "INT DEFAULT 0",
        'max_uses' => "INT DEFAULT 100"
    ];
    foreach ($invColumnMap as $col => $def) {
        if (!in_array($col, $invLinksCols)) {
            $pdo->exec("ALTER TABLE invitation_links ADD COLUMN $col $def");
        }
    }
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        org_id INT DEFAULT NULL,
        cluster_id INT DEFAULT NULL,
        workflow_id INT NOT NULL,
        user_id INT NULL, 
        status ENUM('pending', 'assigned', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        input_data JSON, 
        output_data JSON, 
        external_ref VARCHAR(255), 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    $invLinksCols = $pdo->query("SHOW COLUMNS FROM invitation_links")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('cluster_id', $invLinksCols)) {
        $pdo->exec("ALTER TABLE invitation_links ADD COLUMN cluster_id INT DEFAULT NULL");
    }

    // 9. Knowledge Base (Editable documentation)
    $pdo->exec("CREATE TABLE IF NOT EXISTS knowledge_base (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_id VARCHAR(100) NOT NULL UNIQUE,
        content_json JSON NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // 10. Organization Join Requests
    $pdo->exec("CREATE TABLE IF NOT EXISTS organization_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        org_id INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY user_org_pending (user_id, org_id, status)
    )");

} catch (Exception $e) {
    http_response_code(500);
    $msg = "Database connection failed.";
    if (get_env_var('DEBUG_MODE') === 'true') {
        $msg .= " Error: " . $e->getMessage();
    }
    error_log("Database Error: " . $e->getMessage()); 
    echo json_encode(["status" => "error", "message" => $msg]);
    exit;
}
?>