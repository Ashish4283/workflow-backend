<?php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$token = isset($_GET['token']) ? $_GET['token'] : null;
if (!$token) {
    // Try POST if not in GET
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    $token = isset($data['token']) ? $data['token'] : null;
}

if (!$token) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Token is required"]);
    exit;
}

try {
    // 1. Validate Token
    $stmt = $pdo->prepare("SELECT * FROM invitation_links WHERE token = :token AND (expires_at IS NULL OR expires_at > NOW()) AND uses_count < max_uses");
    $stmt->execute([':token' => $token]);
    $invite = $stmt->fetch();

    if (!$invite) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Invite link invalid or expired"]);
        exit;
    }

    // 2. If it's a GET request, just return invite details (for UI to show "You are invited by...")
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $creatorStmt = $pdo->prepare("SELECT name FROM users WHERE id = :id");
        $creatorStmt->execute([':id' => $invite['creator_id']]);
        $creator = $creatorStmt->fetch();

        echo json_encode([
            "status" => "success",
            "data" => [
                "type" => $invite['type'],
                "creator_name" => $creator ? $creator['name'] : 'System',
                "workflow_id" => $invite['workflow_id']
            ]
        ]);
        exit;
    }

    // 3. If it's a POST request, process the enrollment
    $authPayload = authenticate_request();
    $userId = $authPayload['id'];

    $pdo->beginTransaction();

    $orgId = $invite['org_id'];
    $clusterId = $invite['cluster_id'];

    if ($invite['type'] === 'manager_invite') {
        // Creator = User (the person wanting to be managed)
        // Logged-in ($userId) = Manager/Admin
        require_role($authPayload, ['admin', 'manager']);
        
        $userToAdopt = $invite['creator_id'];
        $managerId = $userId;
        $managerOrgId = $authPayload['org_id'];

        // Manager adopts user: update manager_id and org_id
        $updateStmt = $pdo->prepare("UPDATE users SET manager_id = ?, org_id = ?, trial_ends_at = NULL WHERE id = ?");
        $updateStmt->execute([$managerId, $managerOrgId, $userToAdopt]);

        // Auto-link to cluster if specified
        if ($clusterId) {
            $pdo->prepare("INSERT IGNORE INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'member')")->execute([$clusterId, $userToAdopt]);
        }

    } else if ($invite['type'] === 'agent_invite' || $invite['type'] === 'org_invite') {
        // Creator = Manager/Admin
        // Logged-in ($userId) = The new user joining
        
        $managerId = $invite['creator_id'];
        $roleToSet = ($invite['type'] === 'agent_invite') ? 'agent' : 'tech_user';

        // Update user: update manager_id, org_id, and role
        $updateStmt = $pdo->prepare("UPDATE users SET manager_id = ?, org_id = ?, role = ? WHERE id = ?");
        $updateStmt->execute([$managerId, $orgId, $roleToSet, $userId]);
        
        // Auto-link to cluster if specified
        if ($clusterId) {
            $pdo->prepare("INSERT IGNORE INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'member')")->execute([$clusterId, $userId]);
        }
    }

    // Increment use count
    $incStmt = $pdo->prepare("UPDATE invitation_links SET uses_count = uses_count + 1 WHERE id = :id");
    $incStmt->execute([':id' => $invite['id']]);

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Invitation processed successfully"
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Internal server error: " . $e->getMessage()]);
}
