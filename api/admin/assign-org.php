<?php
// api/admin/assign-org.php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $payload = authenticate_request();
    require_role($payload, ['super_admin']);

    $data = json_decode(file_get_contents("php://input"), true);
    $userIds = $data['user_ids'] ?? [];
    $orgId = $data['org_id'] ?? null; // Null implies unassigning

    if (empty($userIds)) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "User IDs required"]);
         exit;
    }

    $pdo->beginTransaction();

    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $params = array_merge([$orgId === 'none' ? null : $orgId], $userIds);

    $stmt = $pdo->prepare("UPDATE users SET org_id = ? WHERE id IN ($placeholders)");
    $stmt->execute($params);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Users assigned to organization successfully"]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    error_log("Assign Org Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not assign organization."]);
}
?>
