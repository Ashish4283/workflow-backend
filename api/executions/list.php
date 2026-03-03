<?php
// api/executions/list.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
$userId = $payload['id'];

try {
    // List executions for workflows the user has access to
    // (Either their own or shared via cluster)
    $stmt = $pdo->prepare("
        SELECT e.*, w.name as workflow_name 
        FROM execution_logs e
        JOIN workflows w ON e.workflow_id = w.id
        WHERE w.user_id = :uid 
           OR w.cluster_id IN (SELECT cluster_id FROM cluster_members WHERE user_id = :uid)
        ORDER BY e.created_at DESC
        LIMIT 50
    ");
    $stmt->execute([':uid' => $userId]);
    $logs = $stmt->fetchAll();

    echo json_encode(["status" => "success", "data" => $logs]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
