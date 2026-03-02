<?php
require_once 'api/db-config.php';

header("Content-Type: text/html");
echo "<html><head><title>DB Sync</title></head><body><pre>";
echo "Running Database Schema Update...\n";

try {
    // Helper to check if column exists
    function columnExists($pdo, $table, $column) {
        $stmt = $pdo->prepare("DESCRIBE `$table` ");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return in_array($column, $columns);
    }

    // 1. Add auth_provider if missing
    if (!columnExists($pdo, 'users', 'auth_provider')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local' AFTER email");
        echo "Added auth_provider column: OK\n";
    } else {
        echo "auth_provider column already exists: SKIP\n";
    }
    
    // 2. Add provider_id if missing
    if (!columnExists($pdo, 'users', 'provider_id')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) AFTER auth_provider");
        echo "Added provider_id column: OK\n";
    } else {
        echo "provider_id column already exists: SKIP\n";
    }

    // 3. Update roles ENUM
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'user', 'worker') DEFAULT 'user'");
    echo "Updated roles ENUM: OK\n";

    // 4. Ensure password column is NULLABLE (important for Google users)
    // First, check if it's already nullable
    $stmt = $pdo->prepare("DESCRIBE users `password` ");
    $stmt->execute();
    $passInfo = $stmt->fetch();
    if ($passInfo && $passInfo['Null'] === 'NO') {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL");
        echo "Made password column nullable: OK\n";
    } else {
        echo "Password column is already nullable or handled: SKIP\n";
    }

    // 5. Handle password column name sync (if they still have 'password_hash')
    if (!columnExists($pdo, 'users', 'password') && columnExists($pdo, 'users', 'password_hash')) {
        $pdo->exec("ALTER TABLE users CHANGE password_hash password VARCHAR(255) NULL");
        echo "Renamed password_hash to password and made nullable: OK\n";
    }

    echo "\nSchema sync complete! Google Auth columns are ready.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
echo "</pre></body></html>";
?>
