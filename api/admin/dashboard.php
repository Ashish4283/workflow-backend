<?php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // 1. Authenticate user via JWT
    $userPayload = authenticate_request();
    
    // 2. Allow Admin and Manager
    require_role($userPayload, ['admin', 'manager']);

    // Fetch System-wide Stats
    $stats = [];
    
    // Total SaaS Users
    $userCountStmt = $pdo->query("SELECT COUNT(*) FROM users");
    $stats['total_users'] = (int)$userCountStmt->fetchColumn();
    
    // Total Admins
    $adminCountStmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    $stats['total_admins'] = (int)$adminCountStmt->fetchColumn();

    // Total Workflows
    $workflowCountStmt = $pdo->query("SELECT COUNT(*) FROM workflows");
    $stats['total_workflows'] = (int)$workflowCountStmt->fetchColumn();
    
    // Fetch Recent SaaS Users
    $recentUsersStmt = $pdo->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 50");
    $recentUsers = $recentUsersStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "stats" => $stats,
            "recent_users" => $recentUsers
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Admin Dashboard Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not fetch dashboard metrics."]);
}
?>
