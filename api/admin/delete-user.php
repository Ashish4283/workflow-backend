<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Only admins can delete users
// Only admins/managers can delete users
$current_payload = authenticate_request();
require_role($current_payload, ['admin', 'manager']);

$data = json_decode(file_get_contents("php://input"));
$targetUserId = $data->user_id ?? null;

if (!$targetUserId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

// Security: Prevent self-deletion
if ($current_payload['id'] == $targetUserId) {
    echo json_encode(["status" => "error", "message" => "You cannot decommission your own entity."]);
    exit;
}

$currentRole = $current_payload['role'];
$isSuperAdmin = ($currentRole === 'super_admin');
$currentOrgId = $current_payload['org_id'];
$currentUserId = $current_payload['id'];

try {
    // Check target user
    $checkStmt = $pdo->prepare("SELECT role, email, org_id FROM users WHERE id = :id");
    $checkStmt->execute([':id' => $targetUserId]);
    $targetUser = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser) {
        echo json_encode(["status" => "error", "message" => "Target entity not found."]);
        exit;
    }

    // Role safety logic
    if (!$isSuperAdmin) {
        if ($currentRole === 'admin') {
            // Admins can only delete within their org
            if ($targetUser['org_id'] != $currentOrgId) {
                throw new Exception("Unauthorized: Target belongs to a different organization.");
            }
            // Cannot delete other admins or superadmins
            if ($targetUser['role'] === 'admin' || $targetUser['role'] === 'super_admin') {
                throw new Exception("Unauthorized: Insufficient permissions to decommission an Admin.");
            }
        } 
        elseif ($currentRole === 'manager') {
            // Managers can only delete workers/tech_users in their clusters
            if ($targetUser['role'] === 'admin' || $targetUser['role'] === 'super_admin' || $targetUser['role'] === 'manager') {
                throw new Exception("Unauthorized: Managers cannot decommission other managers or higher.");
            }
            
            // Check if user is in manager's cluster
            $clusterCheck = $pdo->prepare("
                SELECT 1 FROM cluster_members cm1
                JOIN cluster_members cm2 ON cm1.cluster_id = cm2.cluster_id
                WHERE cm1.user_id = ? AND cm2.user_id = ?
            ");
            $clusterCheck->execute([$currentUserId, $targetUserId]);
            if (!$clusterCheck->fetch()) {
                 throw new Exception("Unauthorized: Target entity is outside your cluster scope.");
            }
        }
    }

    $pdo->beginTransaction();

    // 1. Clear manager_id from users who were managed by this user
    $pdo->prepare("UPDATE users SET manager_id = NULL WHERE manager_id = ?")->execute([$targetUserId]);

    // 2. Delete workflows
    $pdo->prepare("DELETE FROM workflows WHERE user_id = ?")->execute([$targetUserId]);

    // 3. Delete cluster memberships
    $pdo->prepare("DELETE FROM cluster_members WHERE user_id = ?")->execute([$targetUserId]);

    // 4. Delete user
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    if ($stmt->execute([$targetUserId])) {
        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Entity decommissioned successfully."]);
    } else {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Unable to delete user."]);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
