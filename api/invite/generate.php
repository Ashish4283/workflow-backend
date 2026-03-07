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

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    $type = isset($data['type']) ? $data['type'] : 'manager_invite'; // 'manager_invite' or 'agent_invite'
    $workflowId = !empty($data['workflow_id']) ? (int)$data['workflow_id'] : null;
    $clusterId = !empty($data['cluster_id']) ? (int)$data['cluster_id'] : null;

    // Security check: Only managers/admins can create agent invites for specific workflows
    if ($type === 'agent_invite') {
        require_role($authPayload, ['admin', 'manager']);
        if (!$workflowId && !$clusterId) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Workflow ID or Cluster ID required for agent invites"]);
            exit;
        }
    }

    // Generate unique token
    $token = bin2hex(random_bytes(16));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days')); // Links expire in 7 days
    $orgId = $authPayload['org_id'] ?? null;

    $stmt = $pdo->prepare("INSERT INTO invitation_links (token, type, creator_id, workflow_id, cluster_id, org_id, expires_at) VALUES (:token, :type, :creator_id, :workflow_id, :cluster_id, :org_id, :expires_at)");
    $stmt->execute([
        ':token' => $token,
        ':type' => $type,
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
