<?php
// api/executions/list.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db-config.php';
require_once '../auth-guard.php';

$authPayload = authenticate_request();
$userId = $authPayload['id'];
$userRole = $authPayload['role'];

try {
    // 1. Fetch User Metadata
    $uStmt = $pdo->prepare("SELECT org_id FROM users WHERE id = :uid");
    $uStmt->execute(['uid' => $userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Determine Visibility
    $sql = "SELECT e.*, w.name as workflowName, e.node_count as nodes, e.created_at as timestamp 
            FROM execution_logs e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE 1=1";
    $params = [];

    if ($userRole === 'super_admin') {
        // No extra filters
    } elseif ($userRole === 'admin') {
        $sql .= " AND (w.user_id IN (SELECT id FROM users WHERE org_id = ?) OR w.cluster_id IN (SELECT id FROM clusters WHERE org_id = ?))";
        $params[] = $user['org_id'];
        $params[] = $user['org_id'];
    } else {
        // Manager/Tech/Agent -> Cluster level
        $sql .= " AND w.cluster_id IN (SELECT cluster_id FROM cluster_members WHERE user_id = ?)";
        $params[] = $userId;
    }

    $sql .= " ORDER BY e.created_at DESC LIMIT 50";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $logs]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
