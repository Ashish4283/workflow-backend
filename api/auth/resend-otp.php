<?php
header("Content-Type: application/json");

try {
    require_once '../db-config.php';
    require_once '../utils/email-service.php';

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data["email"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email is required for synchronization."]);
        exit;
    }

    $email = strtolower(filter_var(trim($data["email"]), FILTER_VALIDATE_EMAIL));

    if (!$email) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid email format."]);
        exit;
    }

    // Find User
    $stmt = $pdo->prepare("SELECT id, name, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Identity not found in database."]);
        exit;
    }

    if ((int)$user['is_verified'] === 1) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Identity already synchronized and verified."]);
        exit;
    }

    // Generate New OTP
    $otp = sprintf("%06d", mt_rand(1, 999999));
    $otp_expiry = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    // Update User
    $updateStmt = $pdo->prepare("UPDATE users SET verification_otp = ?, otp_expires_at = ? WHERE id = ?");
    $updateStmt->execute([$otp, $otp_expiry, $user['id']]);

    // Dispatch OTP Signal
    $signalSent = sendOTP($email, $otp, $user['name']);

    if ($signalSent) {
        echo json_encode([
            "status" => "success",
            "message" => "Fresh verification signal dispatched to $email."
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Dispatch failure. System local log entry created."
        ]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    error_log("Resend OTP Error: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Neural link interruption during synchronization."
    ]);
}
