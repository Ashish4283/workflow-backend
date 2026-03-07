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

    $currentOrgId = $userPayload['org_id'];
    $isSuperAdmin = ($role === 'super_admin');

    // 1. Verify the workflow exists and is within scope
    $checkStmt = $pdo->prepare("SELECT user_id, cluster_id FROM workflows WHERE id = :id");
    $checkStmt->execute([':id' => $workflowId]);
    $workflow = $checkStmt->fetch();

    if (!$workflow) {
        throw new Exception("Workflow not found in global index.");
    }

    if (!$isSuperAdmin) {
        if ($role === 'admin') {
            // Admin must own the workflow's org or be the owner
            $ownerStmt = $pdo->prepare("SELECT org_id FROM users WHERE id = ?");
            $ownerStmt->execute([$workflow['user_id']]);
            $owner = $ownerStmt->fetch();
            if (!$owner || $owner['org_id'] != $currentOrgId) {
                // Check if it's assigned to a cluster in this org
                $cStmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
                $cStmt->execute([$workflow['cluster_id']]);
                $cluster = $cStmt->fetch();
                if (!$cluster || $cluster['org_id'] != $currentOrgId) {
                    throw new Exception("Unauthorized: Workflow is outside your organization's domain.");
                }
            }
        } elseif ($role === 'manager') {
            // Manager must be a manager of the cluster the workflow is in
            if (!$workflow['cluster_id']) {
                 throw new Exception("Unauthorized: Only Admins can manage unclustered workflows.");
            }
            $mCheck = $pdo->prepare("SELECT 1 FROM cluster_members WHERE cluster_id = ? AND user_id = ? AND role = 'manager'");
            $mCheck->execute([$workflow['cluster_id'], $managerId]);
            if (!$mCheck->fetch()) {
                 throw new Exception("Unauthorized: You do not manage the cluster associated with this workflow.");
            }
        }
    }

    // 2. Verify target worker is in scope
    if ($targetWorkerId && !$isSuperAdmin) {
        $wStmt = $pdo->prepare("SELECT org_id FROM users WHERE id = ?");
        $wStmt->execute([$targetWorkerId]);
        $worker = $wStmt->fetch();
        if (!$worker || ($role === 'admin' && $worker['org_id'] != $currentOrgId)) {
             throw new Exception("Unauthorized: Worker is outside your organization.");
        }
        if ($role === 'manager') {
             // Manager can only assign to workers in their managed clusters
             $mcCheck = $pdo->prepare("
                SELECT 1 FROM cluster_members cm1
                JOIN cluster_members cm2 ON cm1.cluster_id = cm2.cluster_id
                WHERE cm1.user_id = ? AND cm1.role = 'manager' AND cm2.user_id = ?
             ");
             $mcCheck->execute([$managerId, $targetWorkerId]);
             if (!$mcCheck->fetch()) {
                  throw new Exception("Unauthorized: Worker is not in your managed clusters.");
             }
        }
    }

    $updateStmt = $pdo->prepare("UPDATE workflows SET assigned_to = :worker_id, assigned_by = :manager_id WHERE id = :wf_id");
    $updateStmt->execute([
        ':worker_id' => $targetWorkerId,
        ':manager_id' => $managerId,
        ':wf_id' => $workflowId
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Workflow successfully delegated."
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
