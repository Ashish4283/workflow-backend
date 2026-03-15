<?php
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

$authPayload = authenticate_request();
$userId = $authPayload['id'];
$data = json_decode(file_get_contents("php://input"), true);

try {
    $type = isset($data['type']) ? $data['type'] : 'agent_invite';
    $targetRole = $data['target_role'] ?? (($type === 'manager_invite') ? 'manager' : 'agent');
    
    // Normalize type to agent_invite for internal logic if it's a "forward" invite
    if ($type === 'manager_invite') $type = 'agent_invite';

    $workflowId = !empty($data['workflow_id']) ? (int)$data['workflow_id'] : null;
    $clusterId = !empty($data['cluster_id']) && is_numeric($data['cluster_id']) ? (int)$data['cluster_id'] : null;

    $orgId = $authPayload['org_id'] ?? null;
    $role = $authPayload['role'];

    // If cluster is provided, ensure we have the correct org_id (especially for Super Admins)
    if ($clusterId) {
        $cStmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
        $cStmt->execute([$clusterId]);
        $cluster = $cStmt->fetch();
        if ($cluster) {
            $orgId = $cluster['org_id'];
        }
    }

    // Security & Role Validation
    if ($role === 'manager') {
        if ($targetRole === 'manager') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Managers can only invite Agents/Workers"]);
            exit;
        }
    }

    // Generate unique token
    $token = bin2hex(random_bytes(16));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

    $stmt = $pdo->prepare("INSERT INTO invitation_links (token, type, target_role, creator_id, workflow_id, cluster_id, org_id, expires_at) VALUES (:token, :type, :target_role, :creator_id, :workflow_id, :cluster_id, :org_id, :expires_at)");
    $stmt->execute([
        ':token' => $token,
        ':type' => $type,
        ':target_role' => $targetRole,
        ':creator_id' => $userId,
        ':workflow_id' => $workflowId,
        ':cluster_id' => $clusterId,
        ':org_id' => $orgId,
        ':expires_at' => $expiresAt
    ]);

    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    $inviteUrl = $baseUrl . "/invite?token=" . $token;

    echo json_encode([
        "status" => "success",
        "data" => [
            "token" => $token,
            "invite_url" => $inviteUrl,
            "expires_at" => $expiresAt
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Internal server error: " . $e->getMessage()]);
}
