<?php
// api/credentials/list.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
$userId = $payload['id'];

try {
    // List credentials for clusters the user is a member of
    $stmt = $pdo->prepare("
        SELECT v.id, v.key_name, v.provider_type, v.created_at, c.name as cluster_name
        FROM vault_secrets v
        JOIN clusters c ON v.cluster_id = c.id
        JOIN cluster_members cm ON c.id = cm.cluster_id
        WHERE cm.user_id = :uid
    ");
    $stmt->execute([':uid' => $userId]);
    $creds = $stmt->fetchAll();

    echo json_encode(["status" => "success", "data" => $creds]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
