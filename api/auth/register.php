<?php
require_once '../db-config.php';
// header("Cross-Origin-Opener-Policy: same-origin-allow-popups");
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
    
    // Determine Role & Org
    $org_name = isset($data["org_name"]) ? htmlspecialchars(strip_tags(trim($data["org_name"])), ENT_QUOTES, 'UTF-8') : null;
    $is_public_client = isset($data["is_public_client"]) ? (int)$data["is_public_client"] : 0;
    
    $role = 'tech_user';
    $org_id = null;
    $joining_existing = false;

    if ($org_name) {
        // Check if organization already exists
        $checkOrgStmt = $pdo->prepare("SELECT id FROM organizations WHERE name = ?");
        $checkOrgStmt->execute([$org_name]);
        $existingOrg = $checkOrgStmt->fetch();

        if ($existingOrg) {
            $org_id = null; // Don't assign yet, create request later
            $joining_existing = $existingOrg['id'];
        } else {
            $role = 'admin'; // Creator of a new org is the admin
            $oStmt = $pdo->prepare("INSERT INTO organizations (name, is_public_client) VALUES (:name, :consent)");
            $oStmt->execute([':name' => $org_name, ':consent' => $is_public_client]);
            $org_id = $pdo->lastInsertId();

            // Create initial hierarchy: Global Operations Cluster
            $cStmt = $pdo->prepare("INSERT INTO clusters (org_id, name, description) VALUES (?, ?, ?)");
            $cStmt->execute([$org_id, 'Global Operations', 'Primary cluster for ' . $org_name]);
        }
    }

    // Set trial to 14 days from now
    $trial_expiry = date('Y-m-d H:i:s', strtotime('+14 days'));

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, trial_ends_at, org_id) VALUES (:name, :email, :password_hash, :role, :trial_expiry, :org_id)");
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':password_hash', $password_hash, PDO::PARAM_STR);
    $stmt->bindValue(':role', $role, PDO::PARAM_STR);
    $stmt->bindValue(':trial_expiry', $trial_expiry, PDO::PARAM_STR);
    $stmt->bindValue(':org_id', $org_id, $org_id ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->execute();

    $newUserId = $pdo->lastInsertId();

    if ($org_id) {
        // Link user to the auto-created cluster
        $mStmt = $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES ((SELECT id FROM clusters WHERE org_id = ? LIMIT 1), ?, 'manager')");
        $mStmt->execute([$org_id, $newUserId]);
    } else if ($joining_existing) {
        // Create request for existing org
        $pdo->prepare("INSERT INTO organization_requests (user_id, org_id, message) VALUES (?, ?, ?)")
            ->execute([$newUserId, $joining_existing, "Automated request during signup using organization name: $org_name"]);
    }

    $message = $joining_existing ? "Registration successful. Membership request sent for '$org_name'." : "Registration successful.";

    echo json_encode([
        "status" => "success", 
        "message" => $message, 
        "data" => [
            "id" => $newUserId,
            "name" => $name,
            "email" => $email,
            "role" => $role,
            "org_id" => $org_id,
            "request_pending" => (bool)$joining_existing
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Registration Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not register user."]);
}
?>
