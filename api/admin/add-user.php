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
require_role($authPayload, ['admin', 'manager']);

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data['name']) || !isset($data['email']) || !isset($data['role'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing name, email, or role"]);
        exit;
    }

    $name = trim($data['name']);
    $email = trim($data['email']);
    $targetRole = strtolower(trim($data['role']));
    $password = isset($data['password']) ? trim($data['password']) : null;

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid email format"]);
        exit;
    }

    // Role Hierarchy Enforcement
    $allowedRolesToCreate = [];
    $currentRole = $authPayload['role'];
    $currentOrgId = $authPayload['org_id'];

    if ($currentRole === 'super_admin') {
        $allowedRolesToCreate = ['admin', 'manager', 'tech_user', 'worker'];
    } else if ($currentRole === 'admin') {
        $allowedRolesToCreate = ['manager', 'tech_user', 'worker'];
    } else if ($currentRole === 'manager') {
        $allowedRolesToCreate = ['tech_user', 'worker'];
    }

    if (!in_array($targetRole, $allowedRolesToCreate)) {
        http_response_code(403);
        echo json_encode([
            "status" => "error", 
            "message" => "You are not allowed to create a user with the role: " . $targetRole
        ]);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Email already exists"]);
        exit;
    }

    $pdo->beginTransaction();

    // Hash password if provided, else assign a random one or keep null
    $hashedPassword = $password ? password_hash($password, PASSWORD_DEFAULT) : null;
    $targetOrgId = ($currentRole === 'super_admin') ? ($data['org_id'] ?? null) : $currentOrgId;

    $insertStmt = $pdo->prepare("INSERT INTO users (name, email, password, role, org_id, status) VALUES (?, ?, ?, ?, ?, 'active')");
    $insertStmt->execute([
        $name, $email, $hashedPassword, $targetRole, $targetOrgId
    ]);
    $newUserId = $pdo->lastInsertId();

    // If a cluster_id is provided, auto-assign
    if (!empty($data['cluster_id'])) {
        $clusterId = (int)$data['cluster_id'];
        // Double check cluster belongs to org if not super_admin
        if ($currentRole !== 'super_admin') {
             $cCheck = $pdo->prepare("SELECT id FROM clusters WHERE id = ? AND org_id = ?");
             $cCheck->execute([$clusterId, $currentOrgId]);
             if ($cCheck->fetch()) {
                 $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'member')")->execute([$clusterId, $newUserId]);
             }
        } else {
             $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'member')")->execute([$clusterId, $newUserId]);
        }
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Identity successfully integrated.",
        "data" => [
            "id" => $newUserId,
            "name" => $name,
            "email" => $email,
            "role" => $targetRole,
            "org_id" => $targetOrgId
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Internal server error: " . $e->getMessage()]);
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
}
