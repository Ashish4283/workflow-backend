<?php
require_once '../db-config.php';
require_once '../utils/auth-helper.php';
header("Content-Type: application/json");

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data["email"]) || !isset($data["otp"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email and OTP are required."]);
        exit;
    }

    $email = strtolower(filter_var(trim($data["email"]), FILTER_VALIDATE_EMAIL));
    $otp = trim($data["otp"]);

    $stmt = $pdo->prepare("SELECT id, name, email, role, org_id, verification_otp, otp_expires_at FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    if ($user['verification_otp'] !== $otp) {
        http_response_code(401); 
        echo json_encode(["status" => "error", "message" => "Invalid verification code. Please check your email."]);
        exit;
    }

    // Check Expiration
    if ($user['otp_expires_at'] && strtotime($user['otp_expires_at']) < time()) {
        http_response_code(410); // Gone
        echo json_encode(["status" => "error", "message" => "Verification code has expired. Please request a new one."]);
        exit;
    }

    // Mark as verified and clear OTP
    $updateStmt = $pdo->prepare("UPDATE users SET is_verified = 1, verification_otp = NULL WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // Generate JWT for immediate access
    $rememberMe = isset($data['rememberMe']) && $data['rememberMe'] === true;
    $duration = $rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 1 week vs 1 day

    $token = generate_jwt([
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'name' => $user['name'],
        'org_id' => $user['org_id']
    ], $duration);

    echo json_encode([
        "status" => "success", 
        "message" => "Identity verified successfully. Protocol authorized.",
        "data" => [
            "token" => $token,
            "user" => [
                "id" => (int)$user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "role" => $user['role'],
                "org_id" => $user['org_id']
            ]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Protocol failure during verification."]);
}
?>
