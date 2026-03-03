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

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing task ID"]);
        exit;
    }

    $taskId = (int)$data['id'];

    // Atomic update to pick up a task
    $stmt = $pdo->prepare("UPDATE tasks SET user_id = ?, status = 'assigned', updated_at = NOW() WHERE id = ? AND status = 'pending'");
    $stmt->execute([$userId, $taskId]);

    if ($stmt->rowCount() === 0) {
        // Did not pick up (already assigned or not found)
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Task already assigned or in-progress by another agent."]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "message" => "Task successfully assigned to your workspace.",
        "data" => ["id" => $taskId]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
