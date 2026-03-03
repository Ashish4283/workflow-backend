<?php
// temp-migrate.php
require_once 'api/db-config.php';

try {
    $pdo->beginTransaction();

    // 1. Create user_groups table
    $createGroupsTable = "CREATE TABLE IF NOT EXISTS user_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($createGroupsTable);
    echo "Table 'user_groups' created or already exists.\n";

    // 2. Add group_id to users table if not exists
    $checkColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'group_id'");
    if ($checkColumn->rowCount() == 0) {
        $alterUsersTable = "ALTER TABLE users ADD COLUMN group_id INT DEFAULT NULL, 
                            ADD CONSTRAINT fk_user_group FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE SET NULL;";
        $pdo->exec($alterUsersTable);
        echo "Column 'group_id' added to 'users' table.\n";
    } else {
        echo "Column 'group_id' already exists in 'users' table.\n";
    }

    // 3. Create a default "Global" group if no groups exist
    $checkGroups = $pdo->query("SELECT COUNT(*) FROM user_groups");
    if ($checkGroups->fetchColumn() == 0) {
        $insertDefaultGroup = "INSERT INTO user_groups (name, description) VALUES ('Global Team', 'Default group for all users');";
        $pdo->exec($insertDefaultGroup);
        echo "Default 'Global Team' group created.\n";
    }

    $pdo->commit();
    echo "Migration Successful.\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
