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
    require_role($payload, ['super_admin', 'admin']);

    $data = json_decode(file_get_contents("php://input"), true);
    $userIds = $data['user_ids'] ?? [];
    $orgIdRequested = $data['org_id'] ?? null;

    if ($payload['role'] === 'admin') {
        $orgId = $payload['org_id'];
        if (!$orgId) {
             http_response_code(403);
             echo json_encode(["status" => "error", "message" => "Admin not associated with an organization."]);
             exit;
        }
    } else {
        $orgId = $orgIdRequested;
    }

    if (empty($userIds)) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "User IDs required"]);
         exit;
    }

    $pdo->beginTransaction();

    if ($payload['role'] === 'admin') {
        // Validation: Admin can only adopt users who are currently detached (null org)
        // or users already belonging to their organization.
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id IN ($placeholders) AND (org_id IS NULL OR org_id = ?)");
        $checkStmt->execute(array_merge($userIds, [$orgId]));
        
        if ($checkStmt->fetchColumn() < count($userIds)) {
             throw new Exception("Unauthorized: You can only adopt detached members or manage your own organization's members.");
        }
    }

    // The $orgId variable is already correctly set for both admin and super_admin roles
    // based on the logic above. For super_admin, it's $orgIdRequested (or null if 'none').
    // For admin, it's $payload['org_id'].
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $params = array_merge([$orgId], $userIds);

    $stmt = $pdo->prepare("UPDATE users SET org_id = ? WHERE id IN ($placeholders)");
    $stmt->execute($params);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Users associated with organization successfully"]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    // error_log("Assign Org Error: " . $e->getMessage()); // Removed as per instruction
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
