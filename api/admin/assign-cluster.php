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
    $clusterId = $data['cluster_id'] ?? null; // Null or 'none' implies unassigning from all clusters

    if (empty($userIds)) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "User IDs required"]);
         exit;
    }

    $pdo->beginTransaction();

    // 1. First, remove these users from all clusters to enforce 1:1 primary cluster mapping (optional, but matching legacy behavior)
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $stmtDel = $pdo->prepare("DELETE FROM cluster_members WHERE user_id IN ($placeholders)");
    $stmtDel->execute($userIds);

    // 2. If assigning to a specific cluster, insert them into cluster_members
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
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
