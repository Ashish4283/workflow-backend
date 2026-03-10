<?php
// api/admin/update-org.php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $payload = authenticate_request();
    
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (empty($data["id"]) || empty($data["name"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Organization ID and Name are required."]);
        exit;
    }

    $id = (int)$data["id"];
    $name = htmlspecialchars(strip_tags(trim($data["name"])), ENT_QUOTES, 'UTF-8');
    $billing_tier = isset($data["billing_tier"]) ? $data["billing_tier"] : 'free';
    $is_public_client = isset($data["is_public_client"]) ? (int)$data["is_public_client"] : 0;
    $logo_url = isset($data["logo_url"]) ? $data["logo_url"] : null;

    // RBAC: super_admin can edit any, admin can only edit their own
    if ($payload['role'] !== 'super_admin') {
        if ($payload['role'] === 'admin') {
            if ($payload['org_id'] != $id) {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "Access denied. You can only manage your own organization."]);
                exit;
            }
        } else {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Access denied. Administrative privileges required."]);
            exit;
        }
    }

    $stmt = $pdo->prepare("UPDATE organizations SET name = ?, billing_tier = ?, is_public_client = ?, logo_url = ? WHERE id = ?");
    $stmt->execute([$name, $billing_tier, $is_public_client, $logo_url, $id]);

    echo json_encode([
        "status" => "success",
        "message" => "Organization configuration updated successfully.",
        "data" => [
            "id" => $id,
            "name" => $name,
            "billing_tier" => $billing_tier,
            "is_public_client" => $is_public_client
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Update Org Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>
