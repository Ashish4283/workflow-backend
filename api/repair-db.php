<?php
// api/repair-db.php
// A standalone emergency script to force-patch the database schema.
require_once 'db-config.php';

header("Content-Type: text/plain");

echo "Initiating Emergency Schema Repair...\n";

try {
    // 1. Repair Workflows Table
    echo "Checking 'workflows' table...\n";
    $wfCols = $pdo->query("SHOW COLUMNS FROM workflows")->fetchAll(PDO::FETCH_COLUMN);
    $wfMap = [
        'cluster_id' => "INT DEFAULT NULL",
        'org_id' => "INT DEFAULT NULL",
        'status' => "ENUM('draft', 'active', 'archived') DEFAULT 'active'",
        'environment' => "ENUM('draft', 'test', 'prod') DEFAULT 'draft'",
        'version' => "INT DEFAULT 1"
    ];
    foreach ($wfMap as $col => $def) {
        if (!in_array($col, $wfCols)) {
            $pdo->exec("ALTER TABLE workflows ADD COLUMN $col $def");
            echo " - Added '$col' to workflows\n";
        }
    }

    // 2. Repair Invites Table
    echo "Checking 'invitation_links' table...\n";
    $invCols = $pdo->query("SHOW COLUMNS FROM invitation_links")->fetchAll(PDO::FETCH_COLUMN);
    $invMap = [
        'target_role' => "ENUM('manager', 'tech_user', 'worker', 'agent') DEFAULT 'agent'",
        'org_id' => "INT DEFAULT NULL",
        'uses_count' => "INT DEFAULT 0",
        'max_uses' => "INT DEFAULT 100"
    ];
    foreach ($invMap as $col => $def) {
        if (!in_array($col, $invCols)) {
            $pdo->exec("ALTER TABLE invitation_links ADD COLUMN $col $def");
            echo " - Added '$col' to invitation_links\n";
        }
    }

    echo "\nRepair Complete. The Admin Portal should now synchronize correctly.\n";

} catch (Exception $e) {
    echo "\nERROR DURING REPAIR: " . $e->getMessage() . "\n";
}
?>
