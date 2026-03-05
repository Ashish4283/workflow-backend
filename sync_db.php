<?php
require_once 'api/db-config.php';

header("Content-Type: text/html");
echo "<html><head><title>DB Sync</title></head><body><pre>";
echo "Running Database Schema Update...\n";

try {
    // Helper to check if column exists
    function columnExists($pdo, $table, $column) {
        try {
            $stmt = $pdo->prepare("DESCRIBE `$table` ");
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return in_array($column, $columns);
        } catch (Exception $e) {
            return false;
        }
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

    // 4. Ensure password column is NULLABLE
    $stmt = $pdo->prepare("DESCRIBE users `password` ");
    $stmt->execute();
    $passInfo = $stmt->fetch();
    if ($passInfo && $passInfo['Null'] === 'NO') {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL");
        echo "Made password column nullable: OK\n";
    } else {
        echo "Password column is already nullable or handled: SKIP\n";
    }

    // 5. Add trial_ends_at, manager_id, and org_id to users
    if (!columnExists($pdo, 'users', 'trial_ends_at')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP NULL AFTER created_at");
        echo "Added trial_ends_at column: OK\n";
    }
    if (!columnExists($pdo, 'users', 'manager_id')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN manager_id INT NULL AFTER id, ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL");
        echo "Added manager_id column and FK: OK\n";
    }
    if (!columnExists($pdo, 'users', 'org_id')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN org_id INT NULL AFTER manager_id");
        echo "Added org_id column to users: OK\n";
    }

    try {
        if (!columnExists($pdo, 'workflows', 'cluster_id')) {
            $pdo->exec("ALTER TABLE workflows ADD COLUMN cluster_id INT NULL AFTER id");
            echo "Added cluster_id column to workflows: OK\n";
        }
    } catch (Exception $e) {
        echo "Could not check/add cluster_id to workflows: " . $e->getMessage() . "\n";
    }

    // 6. Create invitation_links table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS invitation_links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(64) UNIQUE NOT NULL,
            type ENUM('manager_invite', 'agent_invite') NOT NULL,
            creator_id INT NOT NULL,
            workflow_id INT NULL,
            expires_at TIMESTAMP NULL,
            max_uses INT DEFAULT 1,
            uses_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB");
        echo "Check/Create invitation_links table: OK\n";
        
        // Try adding workflow_id FK separately
        try {
            $pdo->exec("ALTER TABLE invitation_links ADD CONSTRAINT fk_invite_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE");
            echo "Added workflow_id FK: OK\n";
        } catch (Exception $wfEx) {
            echo "Could not add workflow_id FK (might be missing workflows table): SKIP\n";
        }
    } catch (Exception $invEx) {
        echo "SKIP invitation_links: " . $invEx->getMessage() . "\n";
    }

    // 7. Create tasks table
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            org_id INT NULL,
            cluster_id INT NULL,
            workflow_id INT NOT NULL,
            user_id INT NULL,
            input_data JSON,
            output_data JSON,
            status ENUM('pending', 'assigned', 'completed', 'failed') DEFAULT 'pending',
            external_ref VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB");
        echo "Check/Create tasks table: OK\n";
    } catch (Exception $tEx) {
        echo "SKIP tasks table: " . $tEx->getMessage() . "\n";
    }

    echo "\n--- Database Diagnostics ---\n";
    
    // Check Users
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "Total Users Primary Table: $userCount\n";
    
    // Check workflows
    try {
        $wfCount = $pdo->query("SELECT COUNT(*) FROM workflows")->fetchColumn();
        echo "Total Workflows Table: $wfCount\n";
    } catch (Exception $e) {
        echo "Workflows table MISSING.\n";
    }

    echo "\n--- Sample Users ---\n";
    $stmt = $pdo->query("SELECT id, name, email, role FROM users LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf("ID: %d | Name: %-20s | Email: %-30s | Role: %s\n", $row['id'], $row['name'], $row['email'], $row['role']);
    }

    echo "\n--- Tables found in DB ---\n";
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        echo "- " . $row[0] . "\n";
    }

} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
}

echo "\nSchema sync attempt complete.\n";
echo "</pre></body></html>";
?>
