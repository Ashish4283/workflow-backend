<?php
require_once '../db-config.php';
header("Cross-Origin-Opener-Policy: same-origin-allow-popups");
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data["email"]) || !isset($data["password"]) || !isset($data["name"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid payload, require name, email, password"]);
        exit;
    }

    $name = htmlspecialchars(strip_tags(trim($data["name"])), ENT_QUOTES, 'UTF-8');
    $email = filter_var(trim($data["email"]), FILTER_VALIDATE_EMAIL);
    $password = trim($data["password"]);

    if (!$email) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid email format"]);
        exit;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters"]);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    
    if ($stmt->fetchColumn()) {
        http_response_code(409); // Conflict
        echo json_encode(["status" => "error", "message" => "Email already registered."]);
        exit;
    }

    // Hash the password securely
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Default role is 'user'
    // Set trial to 14 days from now
    $trial_expiry = date('Y-m-d H:i:s', strtotime('+14 days'));

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, trial_ends_at) VALUES (:name, :email, :password_hash, 'tech_user', :trial_expiry)");
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':password_hash', $password_hash, PDO::PARAM_STR);
    $stmt->bindValue(':trial_expiry', $trial_expiry, PDO::PARAM_STR);
    $stmt->execute();

    $newUserId = $pdo->lastInsertId();

    echo json_encode([
        "status" => "success", 
        "message" => "Registration successful", 
        "data" => [
            "id" => $newUserId,
            "name" => $name,
            "email" => $email,
            "role" => 'tech_user'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Registration Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not register user."]);
}
?>
