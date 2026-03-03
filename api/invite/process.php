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

    if ($invite['type'] === 'manager_invite') {
        // The creator of the invite is the USER who wants to be adopted by a MANAGER
        // Or vice-versa? Let's follow user's request:
        // "they can generate the link and share it with their manager and the manager can enroll them"
        // So creator = User, logged-in = Manager.
        
        require_role($authPayload, ['admin', 'manager']);
        
        $userToAdopt = $invite['creator_id'];
        $managerId = $userId;

        $updateStmt = $pdo->prepare("UPDATE users SET manager_id = :mid, trial_ends_at = NULL WHERE id = :uid");
        $updateStmt->execute([':mid' => $managerId, ':uid' => $userToAdopt]);

    } else if ($invite['type'] === 'agent_invite') {
        // Creator = Manager/Admin, Logged-in = Worker/Agent
        // Linking a worker to a specific workflow (we'll need a many-to-many table for this later)
        // For now, let's just update their manager_id if they don't have one and set role to 'worker'
        
        $managerId = $invite['creator_id'];
        $groupId = $invite['group_id'];
        
        $updateStmt = $pdo->prepare("UPDATE users SET manager_id = :mid, role = 'worker', group_id = :gid WHERE id = :uid AND role = 'user'");
        $updateStmt->execute([':mid' => $managerId, ':gid' => $groupId, ':uid' => $userId]);
        
        // Also we should track workflow access. For now, we'll just return success.
    }

    if ($invite['group_id'] && $invite['type'] === 'manager_invite') {
         // Even for manager invites, if a group is coded in, apply it to the creator (the user)
         $stmt = $pdo->prepare("UPDATE users SET group_id = ? WHERE id = ?");
         $stmt->execute([$invite['group_id'], $invite['creator_id']]);
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
