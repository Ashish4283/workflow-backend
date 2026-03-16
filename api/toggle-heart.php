<?php
require_once 'db-config.php';
require_once 'auth-guard.php';

header("Content-Type: application/json");

$authPayload = authenticate_request();
$userId = $authPayload['id'];

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
$workflowId = $data['workflow_id'] ?? null;

if (!$workflowId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Workflow ID required."]);
    exit;
}

try {
    // Check if already liked
    $checkStmt = $pdo->prepare("SELECT id FROM workflow_likes WHERE workflow_id = ? AND user_id = ?");
    $checkStmt->execute([$workflowId, $userId]);
    $existing = $checkStmt->fetch();

    $pdo->beginTransaction();

    if ($existing) {
        // Unlike
        $delStmt = $pdo->prepare("DELETE FROM workflow_likes WHERE id = ?");
        $delStmt->execute([$existing['id']]);
        
        $upStmt = $pdo->prepare("UPDATE workflows SET hearts = GREATEST(0, hearts - 1) WHERE id = ?");
        $upStmt->execute([$workflowId]);
        
        $action = "unliked";
    } else {
        // Like
        $insStmt = $pdo->prepare("INSERT INTO workflow_likes (workflow_id, user_id) VALUES (?, ?)");
        $insStmt->execute([$workflowId, $userId]);
        
        $upStmt = $pdo->prepare("UPDATE workflows SET hearts = hearts + 1 WHERE id = ?");
        $upStmt->execute([$workflowId]);
        
        $action = "liked";
    }

    $pdo->commit();

    // Get new count
    $countStmt = $pdo->prepare("SELECT hearts FROM workflows WHERE id = ?");
    $countStmt->execute([$workflowId]);
    $newCount = $countStmt->fetchColumn();

    echo json_encode([
        "status" => "success", 
        "action" => $action, 
        "hearts" => $newCount,
        "is_liked" => ($action === 'liked')
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
