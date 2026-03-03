<?php
// api/admin/assign-group.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
require_role($payload, ['admin', 'manager']);

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $userIds = $data['user_ids'] ?? [];
    $groupId = $data['group_id'] ?? null; // Null means remove from group

    if (empty($userIds) && !isset($data['all_in_group_id'])) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "User IDs or search criteria required"]);
         exit;
    }

    $pdo->beginTransaction();

    if (!empty($userIds)) {
        // Build placeholders for IN clause
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = $pdo->prepare("UPDATE users SET group_id = ? WHERE id IN ($placeholders)");
        $params = array_merge([$groupId], $userIds);
        $stmt->execute($params);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Users assigned successfully"]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
