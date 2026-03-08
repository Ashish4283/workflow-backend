<?php
// api/admin/delete-org.php
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
    $orgId = $data['org_id'] ?? null;

    if (!$orgId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Organization ID required."]);
        exit;
    }

    $pdo->beginTransaction();

    // 1. Detach users
    $updUsers = $pdo->prepare("UPDATE users SET org_id = NULL WHERE org_id = ?");
    $updUsers->execute([$orgId]);

    // 2. Detach clusters
    $updClusters = $pdo->prepare("UPDATE clusters SET org_id = NULL WHERE org_id = ?");
    $updClusters->execute([$orgId]);

    // 3. Clear pending requests
    $delReqs = $pdo->prepare("DELETE FROM organization_requests WHERE org_id = ?");
    $delReqs->execute([$orgId]);

    // 4. Delete the organization
    $delOrg = $pdo->prepare("DELETE FROM organizations WHERE id = ?");
    $delOrg->execute([$orgId]);

    $pdo->commit();

    echo json_encode(["status" => "success", "message" => "Organization decommissioned. All assets have been detached."]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
