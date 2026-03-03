<?php
// api/auth-guard.php

function base64url_decode($str) {
    return base64_decode(str_pad(strtr($str, '-_', '+/'), strlen($str) % 4, '=', STR_PAD_RIGHT));
}

function verify_jwt($token) {
    if (!$token) return false;
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
    
    $secret = get_env_var('JWT_SECRET');
    if (!$secret) {
        error_log("Warning: JWT_SECRET not set. Using insecure fallback for development. Set JWT_SECRET in environment for production.");
        $secret = 'SUPER_SECRET_FALLBACK_KEY_CHANGE_ME_IMMEDIATELY_123!';
    }
    
    // Verify Signature
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $checkSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    
    if (!hash_equals($base64UrlSignature, $checkSignature)) {
        return false;
    }
    
    // Check Expiration
    $payload = json_decode(base64url_decode($base64UrlPayload), true);
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; // Expired
    }
    
    return $payload;
}

// Helper to authenticate request
function authenticate_request() {
    $headers = apache_request_headers();
    $authHeader = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } else if (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized - Missing or invalid token"]);
        exit;
    }

    $token = $matches[1];
    $payload = verify_jwt($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized - Invalid or expired token"]);
        exit;
    }

    return $payload; // Returns the decoded user payload from the token
}

function require_role($payload, $allowed_roles) {
    if (!is_array($allowed_roles)) {
        $allowed_roles = [$allowed_roles];
    }
    // SUPER ADMIN BYPASS: They can access everything.
    if (isset($payload['role']) && $payload['role'] === 'super_admin') {
        return;
    }
    if (!isset($payload['role']) || !in_array($payload['role'], $allowed_roles)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Forbidden - Insufficient permissions"]);
        exit;
    }
}
?>
