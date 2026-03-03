<?php
require_once 'db-config.php';
require_once 'auth-guard.php';

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
        echo json_encode(["status" => "error", "message" => "Missing workflow ID"]);
        exit;
    }

    $id = filter_var($data['id'], FILTER_VALIDATE_INT);

    // 1. Find latest history entry
    $hStmt = $pdo->prepare("SELECT * FROM workflow_history WHERE workflow_id = ? ORDER BY version DESC LIMIT 1");
    $hStmt->execute([$id]);
    $history = $hStmt->fetch(PDO::FETCH_ASSOC);

    if (!$history) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "No rollback history found for this protocol."]);
        exit;
    }

    $pdo->beginTransaction();
    try {
        // 2. Fetch current for swap (optional but good for 'redo')
        $currStmt = $pdo->prepare("SELECT builder_json, version FROM workflows WHERE id = ?");
        $currStmt->execute([$id]);
        $current = $currStmt->fetch();

        // 3. Update workflow with history content
        $uStmt = $pdo->prepare("UPDATE workflows SET builder_json = ?, version = ?, updated_at = NOW() WHERE id = ?");
        $uStmt->execute([$history['builder_json'], $history['version'], $id]);

        // 4. Delete the history entry we just used
        $dStmt = $pdo->prepare("DELETE FROM workflow_history WHERE id = ?");
        $dStmt->execute([$history['id']]);

        // 5. Optional: Push current to history as a new entry (allows "undoing" the rollback)
        // For now, let's just keep it simple as a one-way rollback.

        $pdo->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Protocol successfully rolled back to Version " . $history['version'],
            "data" => [ "version" => $history['version'] ]
        ]);

    } catch (Exception $ex) {
        $pdo->rollBack();
        throw $ex;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
