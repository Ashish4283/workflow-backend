<?php
// api/admin/assign-cluster-org.php
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
    $clusterId = $data['cluster_id'] ?? null;
    $orgIdParam = $data['org_id'] ?? null;

    if (!$clusterId) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "Cluster ID required"]);
         exit;
    }

    $orgId = ($orgIdParam === 'none' || $orgIdParam === null) ? null : $orgIdParam;

    if ($payload['role'] === 'admin') {
         $adminOrgId = $payload['org_id'];
         if (!$adminOrgId) {
             throw new Exception("Unauthorized: Admin not associated with an organization.");
         }
         
         // If admin is trying to ATTACH (orgId is not null), we ensure they only attach to Their Org.
         // If admin is trying to DETACH (orgId is null), we ensure they only detach if they OWN it.
         if ($orgId && $orgId != $adminOrgId) {
             $orgId = $adminOrgId; // Force their orgId
         }
    }

    $pdo->beginTransaction();

    if ($payload['role'] === 'admin') {
        // Validation: Admin can only manage clusters that are currently detached (null org)
        // or clusters already belonging to their organization.
        $checkStmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
        $checkStmt->execute([$clusterId]);
        $cluster = $checkStmt->fetch();

        if (!$cluster || ($cluster['org_id'] !== null && $cluster['org_id'] != $orgId)) {
             throw new Exception("Unauthorized: You can only manage detached clusters or your own organization's clusters.");
        }
    }

    // 1. Update the cluster's organization
    $stmt = $pdo->prepare("UPDATE clusters SET org_id = ? WHERE id = ?");
    $stmt->execute([$orgId, $clusterId]);

    // 2. Cascade update to all users in this cluster (Adoption)
    $updateUsers = $pdo->prepare("
        UPDATE users 
        SET org_id = ? 
        WHERE id IN (
            SELECT user_id FROM cluster_members WHERE cluster_id = ?
        )
    ");
    $updateUsers->execute([$orgId, $clusterId]);

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Cluster associated with organization successfully. All cluster members have been adopted."]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    error_log("Assign Cluster Org Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
