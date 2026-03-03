require_once '../db-config.php';

header("Content-Type: application/json");

try {
    // Basic connectivity check
    $userCountStmt = $pdo->query("SELECT COUNT(*) FROM users");
    $totalUsers = (int)$userCountStmt->fetchColumn();
    
    $workflowCountStmt = $pdo->query("SELECT COUNT(*) FROM workflows");
    $totalWorkflows = (int)$workflowCountStmt->fetchColumn();

    $sampleUsers = $pdo->query("SELECT id, name, email, role FROM users LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "debug",
        "total_users" => $totalUsers,
        "total_workflows" => $totalWorkflows,
        "sample_users" => $sampleUsers,
        "db_info" => [
            "name" => get_env_var('DB_NAME'),
            "user" => get_env_var('DB_USER')
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
