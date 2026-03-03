<?php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$authPayload = authenticate_request();
$userId = $authPayload['id'];

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data['workflow_id']) || !isset($data['tasks'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing workflow_id or tasks list."]);
        exit;
    }

    $workflowId = (int)$data['workflow_id'];
    $tasks = $data['tasks']; // Array of objects matching input_data

    // Get User Context
    $uStmt = $pdo->prepare("SELECT org_id, id FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    // Get Workflow Cluster
    $wStmt = $pdo->prepare("SELECT cluster_id FROM workflows WHERE id = ?");
    $wStmt->execute([$workflowId]);
    $workflow = $wStmt->fetch(PDO::FETCH_ASSOC);
    $clusterId = $workflow['cluster_id'];

    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO tasks (org_id, cluster_id, workflow_id, input_data, status, external_ref) VALUES (?, ?, ?, ?, 'pending', ?)");

    $count = 0;
    foreach ($tasks as $taskIn) {
        $input_json = json_encode($taskIn['data']);
        $ref = isset($taskIn['external_ref']) ? $taskIn['external_ref'] : null;
        $stmt->execute([$user['org_id'], $clusterId, $workflowId, $input_json, $ref]);
        $count++;
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Successfully queued $count individual task(s) for the operational team.",
        "data" => ["count" => $count]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
