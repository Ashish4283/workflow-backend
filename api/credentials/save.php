<?php
// api/credentials/save.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
$userId = $payload['id'];

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['key_name']) || empty($data['value']) || empty($data['cluster_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Name, Value, and Cluster mapping required"]);
    exit;
}

try {
    // Check if user is a manager of this cluster
    $check = $pdo->prepare("SELECT role FROM cluster_members WHERE user_id = ? AND cluster_id = ?");
    $check->execute([$userId, $data['cluster_id']]);
    $role = $check->fetchColumn();

    if ($role !== 'manager' && $payload['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Cluster authorization required"]);
        exit;
    }

    // In a real app, use openssl_encrypt here
    $encrypted = base64_encode("SECURE_VAULT_".$data['value']);

    $stmt = $pdo->prepare("
        INSERT INTO vault_secrets (cluster_id, key_name, provider_type, encrypted_value)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE encrypted_value = VALUES(encrypted_value)
    ");
    
    $stmt->execute([
        $data['cluster_id'],
        $data['key_name'],
        $data['provider_type'] ?? 'generic',
        $encrypted
    ]);

    echo json_encode(["status" => "success", "message" => "Secret ingestion protocol complete"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
