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
    $userId = (int)$userPayload['id'];
    
    // Initialize stats
    $stats = [];
    
    // Total workflows owned by this user
    $wfCountStmt = $pdo->prepare("SELECT COUNT(*) FROM workflows WHERE user_id = :user_id");
    $wfCountStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $wfCountStmt->execute();
    $stats['total_workflows'] = (int)$wfCountStmt->fetchColumn();
    
    // Total App Users who interacted with this user's workflows
    // Assuming you have created the app_users table from the schema.sql
    try {
        $appUserCountStmt = $pdo->prepare("SELECT COUNT(*) FROM app_users WHERE saas_user_id = :user_id");
        $appUserCountStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $appUserCountStmt->execute();
        $stats['total_app_users'] = (int)$appUserCountStmt->fetchColumn();
    } catch (PDOException $e) {
        // Fallback if app_users table isn't created yet or other DB error
        $stats['total_app_users'] = 0; 
    }

    // Fetch user basic info + monetization metrics
    $userStmt = $pdo->prepare("SELECT name, email, role, subscription_tier, usage_balance FROM users WHERE id = :user_id");
    $userStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $userStmt->execute();
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "user" => $userData,
            "stats" => $stats,
            "recent_workflows" => $recentWorkflows
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("User Dashboard Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not fetch user dashboard metrics."]);
}
?>
