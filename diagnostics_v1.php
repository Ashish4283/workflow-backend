<?php
// diagnostics_v1.php - Testing deployment and DB
require_once 'api/db-config.php';

header("Content-Type: text/plain");
echo "DEPLOYMENT TEST: SUCCESS\n";
echo "TIMESTAMP: " . date('Y-m-d H:i:s') . "\n";

try {
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "USERS IN DB: " . $count . "\n";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "TABLES: " . implode(", ", $tables) . "\n";
    
    echo "DB NAME: " . get_env_var('DB_NAME') . "\n";
} catch (Exception $e) {
    echo "DB ERROR: " . $e->getMessage() . "\n";
}
?>
