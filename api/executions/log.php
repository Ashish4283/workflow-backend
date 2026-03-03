<?php
// api/executions/log.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
$userId = $payload['id'];

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['workflow_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Workflow ID is required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO execution_logs (workflow_id, user_id, status, duration, node_count, execution_data)
        VALUES (:wid, :uid, :status, :duration, :nodes, :data)
    ");
    
    $stmt->execute([
        ':wid' => $data['workflow_id'],
        ':uid' => $userId,
        ':status' => $data['status'] ?? 'completed',
        ':duration' => $data['duration'] ?? '0s',
        ':nodes' => $data['node_count'] ?? 0,
        ':data' => isset($data['execution_data']) ? json_encode($data['execution_data']) : null
    ]);

    echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
