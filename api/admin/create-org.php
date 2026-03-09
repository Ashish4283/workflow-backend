<?php
// api/admin/create-org.php
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

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (empty($data["name"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Organization name is required."]);
        exit;
    }

    $name = htmlspecialchars(strip_tags(trim($data["name"])), ENT_QUOTES, 'UTF-8');
    $billing_tier = isset($data["billing_tier"]) ? $data["billing_tier"] : 'free';
    $is_public_client = isset($data["is_public_client"]) ? (int)$data["is_public_client"] : 0;

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO organizations (name, billing_tier, is_public_client) VALUES (?, ?, ?)");
    $stmt->execute([$name, $billing_tier, $is_public_client]);
    $orgId = $pdo->lastInsertId();

    // Cluster creation is now handled manually by the Admin/SuperAdmin
    $pdo->commit();

    echo json_encode([
        "status" => "success", 
        "message" => "Organization successfully integrated.",
        "data" => [
           "id" => $orgId,
           "name" => $name,
           "billing_tier" => $billing_tier,
           "is_public_client" => $is_public_client,
           "default_cluster" => $clusterName
        ]
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    error_log("Create Org Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Execution failed: " . $e->getMessage()]);
}
?>
