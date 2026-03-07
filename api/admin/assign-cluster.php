<?php
// api/admin/assign-cluster.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
require_role($payload, ['admin', 'manager', 'super_admin']);

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $userIds = $data['user_ids'] ?? [];
    $clusterId = $data['cluster_id'] ?? null; // 'none' or null to unassign

    if (empty($userIds)) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "User IDs required"]);
         exit;
    }

    $role = $payload['role'];
    $currentUserId = $payload['id'];
    $orgId = $payload['org_id'];

    $pdo->beginTransaction();

    // 1. Authorization Check for the Cluster
    if ($role !== 'super_admin') {
        if ($clusterId && $clusterId !== 'none') {
            // Check if user has permission to assign TO this cluster
            if ($role === 'admin') {
                $stmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
                $stmt->execute([$clusterId]);
                $cluster = $stmt->fetch();
                if (!$cluster || $cluster['org_id'] != $orgId) {
                    throw new Exception("Unauthorized: Cluster is outside your organization.");
                }
            } else if ($role === 'manager') {
                $stmt = $pdo->prepare("SELECT role FROM cluster_members WHERE cluster_id = ? AND user_id = ?");
                $stmt->execute([$clusterId, $currentUserId]);
                $membership = $stmt->fetch();
                if (!$membership || $membership['role'] !== 'manager') {
                    throw new Exception("Unauthorized: You are not a manager of this cluster.");
                }
            }
        }
    }

    // 2. Authorization Check for the Users being assigned/unassigned
    if ($role !== 'super_admin') {
        // Prepare list of IDs for SQL
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        
        if ($role === 'admin') {
            // Check if all users belong to the same org
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id IN ($placeholders) AND (org_id = ? OR org_id IS NULL)");
            $stmt->execute(array_merge($userIds, [$orgId]));
            if ($stmt->fetchColumn() < count($userIds)) {
                throw new Exception("Unauthorized: One or more users belong to a different organization.");
            }
        } else if ($role === 'manager') {
            // Managers can only manage users in their own clusters?? 
            // Or can they "invite" detached entities to their cluster?
            // "Being a Manager, manager should have power to Add/include/attach or remove/delete/detach any users."
            // Assuming this means they can attach ANY users to THEIR cluster, but we should probably restrict to their org or detached.
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id IN ($placeholders) AND (org_id = ? OR org_id IS NULL)");
            $stmt->execute(array_merge($userIds, [$orgId]));
            if ($stmt->fetchColumn() < count($userIds)) {
                throw new Exception("Unauthorized: One or more users are outside your management scope.");
            }
        }
    }

    // 3. Process Assignment
    // For this implementation, we detach users from current clusters before attaching to new one
    // to keep it simple (Primary Cluster model)
    $stmtDel = $pdo->prepare("DELETE FROM cluster_members WHERE user_id IN (".implode(',', array_fill(0, count($userIds), '?')).")");
    $stmtDel->execute($userIds);

    if ($clusterId && $clusterId !== 'none') {
        $insertStmt = $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'member')");
        foreach ($userIds as $uid) {
            $insertStmt->execute([$clusterId, $uid]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Users assigned to cluster successfully"]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code($e->getMessage() === "Unauthorized" ? 403 : 500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
