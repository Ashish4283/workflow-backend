<?php
header("Content-Type: application/json");

try {
    require_once '../db-config.php';
    require_once '../utils/email-service.php';

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

    // BLOCK DISPOSABLE / FAKE DOMAINS
    $blocked_domains = ['no-email.com', 'test.com', 'example.com', 'mailinator.com'];
    $domain = substr(strrchr($email, "@"), 1);
    if (in_array(strtolower($domain), $blocked_domains)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "This email domain is not permitted. Please use a valid organization email."]);
        exit;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters"]);
        exit;
    }

    // Generate Verification OTP
    $otp = sprintf("%06d", mt_rand(1, 999999));

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

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, trial_ends_at, org_id, verification_otp, is_verified) VALUES (:name, :email, :password_hash, :role, :trial_expiry, :org_id, :otp, 0)");
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':password_hash', $password_hash, PDO::PARAM_STR);
    $stmt->bindValue(':role', $role, PDO::PARAM_STR);
    $stmt->bindValue(':trial_expiry', $trial_expiry, PDO::PARAM_STR);
    $stmt->bindValue(':org_id', $org_id, $org_id ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->bindValue(':otp', $otp, PDO::PARAM_STR);
    $stmt->execute();

    $newUserId = $pdo->lastInsertId();

    // Dispatch OTP Signal
    $signalSent = sendOTP($email, $otp, $name);

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
    $otp_status = $signalSent ? "Verification signal dispatched to $email." : "Warning: Dispatch failure. System local log entry created.";

    echo json_encode([
        "status" => "success", 
        "message" => "$message $otp_status",
        "data" => [
            "id" => $newUserId,
            "name" => $name,
            "email" => $email,
            "role" => $role,
            "org_id" => $org_id,
            "request_pending" => (bool)$joining_existing
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    $errorMsg = $e->getMessage();
    error_log("Registration Error: " . $errorMsg);
    
    // Check for debug mode safely
    $isDebug = false;
    if (function_exists('get_env_var')) {
        $isDebug = (get_env_var('DEBUG_MODE') === 'true');
    }

    echo json_encode([
        "status" => "error", 
        "message" => "Security barrier protocols engaged. Service interrupted. [Fault Detail: " . ($isDebug ? $errorMsg : "Contact Command Center") . "]",
        "debug" => $isDebug ? $errorMsg : null,
        "trace" => $isDebug ? $e->getTraceAsString() : null
    ]);
}
