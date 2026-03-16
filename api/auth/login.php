<?php
require_once '../db-config.php';
require_once '../utils/audit-logger.php';
header("Cross-Origin-Opener-Policy: same-origin-allow-popups");
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function base64url_encode($str) {
    return rtrim(strtr(base64_encode($str), '+/', '-_'), '=');
}

function generate_jwt($payload) {
    $secret = getenv('JWT_SECRET');
    if (!$secret) {
        error_log("Warning: JWT_SECRET not set. Using insecure fallback for development. Set JWT_SECRET in environment for production.");
        $secret = 'SUPER_SECRET_FALLBACK_KEY_CHANGE_ME_IMMEDIATELY_123!';
    }
    
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = base64url_encode($header);
    
    $payload['iat'] = time();
    // Expires in 24 hours
    $payload['exp'] = time() + (24 * 60 * 60);
    
    $base64UrlPayload = base64url_encode(json_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64url_encode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data["email"]) || !isset($data["password"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid payload, require email and password"]);
        exit;
    }

    $email = strtolower(trim($data["email"]));
    $password = $data["password"];

    $stmt = $pdo->prepare("SELECT id, name, email, password, role, org_id, is_verified FROM users WHERE email = :email");
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        
        // Generate new 6-digit OTP for EVERY login challenge
        $otp = sprintf("%06d", mt_rand(1, 999999));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Persist the challenge to the ledger
        $updateStmt = $pdo->prepare("UPDATE users SET verification_otp = ?, otp_expires_at = ? WHERE id = ?");
        $updateStmt->execute([$otp, $expiresAt, $user['id']]);

        // Dispatch the security signal
        require_once '../utils/email-service.php';
        $emailSent = sendOTP($user['email'], $otp, $user['name']);

        if (!$emailSent) {
             http_response_code(500);
             echo json_encode(["status" => "error", "message" => "Security challenge dispatch failed. Service interrupted."]);
             exit;
        }

        // Log the security challenge issuance
        log_audit("Security Challenge Issued", $user['id'], [
            "ip" => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            "type" => "MFA_LOGIN"
        ], 'info');

        echo json_encode([
            "status" => "success",
            "message" => "Security challenge dispatched. Please enter your verification matrix code.",
            "requires_verification" => true,
            "data" => [
                "email" => $user['email']
            ]
        ]);
        exit;
        
    } else {
        // Log failure
        log_audit("Authorization Failed", null, ["email" => $email], 'warning');
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    error_log("Login Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not process login."]);
}
?>
