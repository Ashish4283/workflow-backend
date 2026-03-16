<?php
// api/utils/auth-helper.php

function base64url_encode($str) {
    return rtrim(strtr(base64_encode($str), '+/', '-_'), '=');
}

function generate_jwt($payload, $duration = 86400) {
    $secret = getenv('JWT_SECRET');
    if (!$secret) {
        // Log warning but allow fallback for dev
        error_log("Warning: JWT_SECRET not set. Using insecure fallback.");
        $secret = 'SUPER_SECRET_FALLBACK_KEY_CHANGE_ME_IMMEDIATELY_123!';
    }
    
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = base64url_encode($header);
    
    $payload['iat'] = time();
    $payload['exp'] = time() + $duration;
    
    $base64UrlPayload = base64url_encode(json_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = base64url_encode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}
