<?php
require_once 'api/db-config.php';

echo "Running Database Schema Update...\n";

try {
    // 1. Add auth_provider
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local' AFTER email");
    echo "Check/Add auth_provider: OK\n";
    
    // 2. Add provider_id
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) AFTER auth_provider");
    echo "Check/Add provider_id: OK\n";

    // 3. Update roles ENUM to include: admin, manager, user, worker
    // Admin: Full Access, Manager: Builder/Moderator, User: Collaborator, Worker: Execution Agent
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'user', 'worker') DEFAULT 'user'");
    echo "Updated roles ENUM: OK\n";

    // 4. Add status column if missing
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' AFTER role");
    echo "Check/Add status column: OK\n";

    // 5. Handle password column mismatch
    // Check if 'password' exists, if not rename 'password_hash' to 'password'
    $cols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('password', $cols) && in_array('password_hash', $cols)) {
        $pdo->exec("ALTER TABLE users CHANGE password_hash password VARCHAR(255) NOT NULL");
        echo "Renamed password_hash to password: OK\n";
    }

    echo "\nSchema sync complete! Google Auth columns are ready.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
