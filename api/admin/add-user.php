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
    if ($authPayload['role'] === 'admin') {
        $allowedRolesToCreate = ['admin', 'manager', 'user', 'worker'];
    } else if ($authPayload['role'] === 'manager') {
        $allowedRolesToCreate = ['user', 'worker'];
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

    // Hash password if provided, else null (for Google/SSO users if needed, though usually local add has password)
    $hashedPassword = $password ? password_hash($password, PASSWORD_DEFAULT) : null;

    $insertStmt = $pdo->prepare("INSERT INTO users (name, email, password, role, status) VALUES (:name, :email, :password, :role, 'active')");
    $insertStmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password' => $hashedPassword,
        ':role' => $targetRole
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "User created successfully",
        "data" => [
            "id" => $pdo->lastInsertId(),
            "name" => $name,
            "email" => $email,
            "role" => $targetRole
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Internal server error: " . $e->getMessage()]);
}
