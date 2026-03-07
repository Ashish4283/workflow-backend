<?php
// api/orgs/request.php
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
    $userId = $payload['id'];

    // Check if user is already in an org
    $checkUser = $pdo->prepare("SELECT org_id FROM users WHERE id = ?");
    $checkUser->execute([$userId]);
    $currentUser = $checkUser->fetch();

    if ($currentUser && $currentUser['org_id']) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "You are already associated with an organization."]);
         exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $orgId = $data['org_id'] ?? null;
    $message = $data['message'] ?? '';

    if (!$orgId) {
         http_response_code(400);
         echo json_encode(["status" => "error", "message" => "Organization ID is required."]);
         exit;
    }

    // Insert request
    $stmt = $pdo->prepare("INSERT INTO organization_requests (user_id, org_id, message) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $orgId, $message]);

    echo json_encode(["status" => "success", "message" => "Request submitted successfully. Waiting for admin approval."]);

} catch (Exception $e) {
    if ($e->getCode() == 23000) { // Duplicate entry
         echo json_encode(["status" => "error", "message" => "You already have a pending request for this organization."]);
    } else {
         http_response_code(500);
         echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
