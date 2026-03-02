<?php
require_once '../db-config.php';
header("Cross-Origin-Opener-Policy: same-origin-allow-popups");
require_once '../auth-guard.php'; 

// Duplicate generate_jwt here for now, or move it to auth-guard.php
function generate_jwt($payload) {
    $secret = getenv('JWT_SECRET') ?: 'SUPER_SECRET_FALLBACK_KEY_CHANGE_ME_IMMEDIATELY_123!';
    
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    
    $payload['iat'] = time();
    $payload['exp'] = time() + (24 * 60 * 60);
    
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data["credential"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing Google credential"]);
        exit;
    }

    $id_token = $data["credential"];

    // 1. Verify the token with Google's public endpoint
    $verify_url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $id_token;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $verify_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Hostinger sometimes has issues with CA certs
    $response = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new Exception("Google Token Verification Failed: Curl Error: " . $curl_error);
    }
    
    if ($http_code !== 200) {
        throw new Exception("Google Token Verification Failed: HTTP Status " . $http_code . " - Response: " . $response);
    }

    $google_data = json_decode($response, true);

    if (!$google_data || isset($google_data['error'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid Google Token", "debug_error" => $google_data['error_description'] ?? 'Unknown error']);
        exit;
    }

    // Check if the aud (Client ID) matches yours here if you want extra security
    // $client_id = "YOUR_CLIENT_ID.apps.googleusercontent.com";
    // if($google_data['aud'] !== $client_id) { ... }

    $email = $google_data['email'];
    $name = $google_data['name'];
    $google_id = $google_data['sub'];

    // 2. Check if user already exists
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE email = :email");
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch();

    if ($user) {
        // User exists, update their provider info just in case
        $updateStmt = $pdo->prepare("UPDATE users SET auth_provider = 'google', provider_id = :provider_id WHERE id = :id");
        $updateStmt->execute([':provider_id' => $google_id, ':id' => $user['id']]);
        
        $userId = $user['id'];
        $userRole = $user['role'];
    } else {
        // Create new user completely without a password
        $insertStmt = $pdo->prepare("INSERT INTO users (name, email, role, auth_provider, provider_id) VALUES (:name, :email, 'user', 'google', :provider_id)");
        $insertStmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':provider_id' => $google_id
        ]);
        
        $userId = $pdo->lastInsertId();
        $userRole = 'user';
    }

    // 3. Issue our own system JWT
    $token = generate_jwt([
        'id' => (int)$userId,
        'email' => $email,
        'role' => $userRole,
        'name' => $name
    ]);

    echo json_encode([
        "status" => "success", 
        "message" => "Google Login successful", 
        "data" => [
            "token" => $token,
            "user" => [
                "id" => (int)$userId,
                "name" => $name,
                "email" => $email,
                "role" => $userRole
            ]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Google Auth Critical Error: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Could not process Google login.",
        "debug" => $e->getMessage() // TEMPORARY: help the user see what's wrong in the console
    ]);
}
?>
