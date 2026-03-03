<?php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");

try {
    $userPayload = authenticate_request();
    $managerId = (int)$userPayload['id'];
    $role = $userPayload['role'];

    if ($role !== 'admin' && $role !== 'manager') {
        throw new Exception("Unauthorized: Only admins or managers can assign workflows.");
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $workflowId = $data['workflow_id'] ?? null;
    $targetWorkerId = $data['worker_id'] ?? null; // Can be NULL to unassign

    if (!$workflowId) {
        throw new Exception("Workflow Protocol ID is required.");
    }

    // Verify the workflow exists and is owned by the manager (or manager's group)
    $checkStmt = $pdo->prepare("SELECT user_id FROM workflows WHERE id = :id");
    $checkStmt->execute([':id' => $workflowId]);
    $workflow = $checkStmt->fetch();

    if (!$workflow) {
        throw new Exception("Workflow not found in global index.");
    }

    // In a real multi-tenant app, we'd check if the manager has permission over this owner.
    // For now, if role is manager/admin, we allow assignment from global pool.

    $updateStmt = $pdo->prepare("UPDATE workflows SET assigned_to = :worker_id, assigned_by = :manager_id WHERE id = :wf_id");
    $updateStmt->execute([
        ':worker_id' => $targetWorkerId,
        ':manager_id' => $managerId,
        ':wf_id' => $workflowId
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Workflow successfully delegated to Agent."
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
