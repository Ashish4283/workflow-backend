<?php
require_once '../db-config.php';
header("Content-Type: application/json");

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data["email"]) || !isset($data["otp"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email and OTP are required."]);
        exit;
    }

    $email = filter_var(trim($data["email"]), FILTER_VALIDATE_EMAIL);
    $otp = trim($data["otp"]);

    $stmt = $pdo->prepare("SELECT id, verification_otp, otp_expires_at FROM users WHERE email = ?");
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

    echo json_encode([
        "status" => "success", 
        "message" => "Identity verified successfully. You can now access the matrix."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Protocol failure during verification."]);
}
?>
