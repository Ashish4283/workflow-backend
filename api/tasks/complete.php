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

    if (!isset($data['id']) || !isset($data['status'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing task ID or final status."]);
        exit;
    }

    $taskId = (int)$data['id'];
    $status = $data['status']; // 'completed' or 'failed'
    $output = isset($data['output']) ? json_encode($data['output']) : null;
    $duration = isset($data['duration']) ? $data['duration'] : '0s';

    // 1. Fetch Task Details for logging
    $tStmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
    $tStmt->execute([$taskId]);
    $task = $tStmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Task not found."]);
        exit;
    }

    $pdo->beginTransaction();

    // 2. Update Task Status
    $uStmt = $pdo->prepare("UPDATE tasks SET status = ?, output_data = ?, updated_at = NOW() WHERE id = ?");
    $uStmt->execute([$status, $output, $taskId]);

    // 3. Log to Execution Logs for Audit
    $lStmt = $pdo->prepare("INSERT INTO execution_logs (workflow_id, user_id, status, duration, execution_data, node_count) VALUES (?, ?, ?, ?, ?, ?)");
    $lStmt->execute([
        $task['workflow_id'],
        $userId,
        $status,
        $duration,
        $output, // Using output as execution data
        0 // Static for now
    ]);

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Task finalized and logged to activity audit."
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
