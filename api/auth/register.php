<?php
header("Content-Type: application/json");

try {
    require_once '../db-config.php';
    require_once '../utils/email-service.php';
    require_once '../utils/audit-logger.php';

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data["email"]) || !isset($data["password"]) || !isset($data["name"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid payload, require name, email, password"]);
        exit;
    }

    $name = htmlspecialchars(strip_tags(trim($data["name"])), ENT_QUOTES, 'UTF-8');
    $email = strtolower(filter_var(trim($data["email"]), FILTER_VALIDATE_EMAIL));
    $password = trim($data["password"]);

    if (!$email) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid email format"]);
        exit;
    }

    // BLOCK DISPOSABLE / FAKE DOMAINS
    $blocked_domains = ['no-email.com', 'test.com', 'example.com', 'mailinator.com'];
    $public_domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'me.com', 'aol.com', 'live.com'];
    
    $emailParts = explode('@', $email);
    $domain = strtolower(end($emailParts));
    
    if (in_array($domain, $blocked_domains)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "This email domain is not permitted. Please use a valid organization email."]);
        exit;
    }

    $is_public_domain = in_array($domain, $public_domains);

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
        echo json_encode(["status" => "error", "message" => "Identity already exists in the matrix. Please sign in or use the recovery protocol."]);
        exit;
    }

    // Hash the password securely
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Determine Role & Org
    $suggested_org_name = isset($data["org_name"]) ? htmlspecialchars(strip_tags(trim($data["org_name"])), ENT_QUOTES, 'UTF-8') : null;
    $is_public_client = isset($data["is_public_client"]) ? (int)$data["is_public_client"] : 0;
    
    $role = 'tech_user';
    $org_id = null;
    $auto_assigned = false;
    $request_sent = false;

    // --- DOMAIN INTELLIGENCE PROTOCOL ---
    if (!$is_public_domain) {
        // Try to find org by domain first
        $findOrgStmt = $pdo->prepare("SELECT id, name FROM organizations WHERE domain = ? OR name = ? LIMIT 1");
        $findOrgStmt->execute([$domain, $suggested_org_name]);
        $existingOrg = $findOrgStmt->fetch();

        if ($existingOrg) {
            // Org exists. User joins as agent/worker level. Access must be granted by admin later.
            $org_id = $existingOrg['id'];
            $role = 'agent';
            $auto_assigned = true;
        } else if ($suggested_org_name) {
            // New Org creation path
            $role = 'admin'; 
            $oStmt = $pdo->prepare("INSERT INTO organizations (name, domain, is_public_client) VALUES (:name, :domain, :consent)");
            $oStmt->execute([':name' => $suggested_org_name, ':domain' => $domain, ':consent' => $is_public_client]);
            $org_id = $pdo->lastInsertId();

            // Create initial hierarchy: Global Operations Cluster
            $cStmt = $pdo->prepare("INSERT INTO clusters (org_id, name, description) VALUES (?, ?, ?)");
            $cStmt->execute([$org_id, 'Global Operations', 'Primary cluster for ' . $suggested_org_name]);
        }
    } else if ($suggested_org_name) {
        // Public domain user but provided an org name
        $checkOrgStmt = $pdo->prepare("SELECT id FROM organizations WHERE name = ?");
        $checkOrgStmt->execute([$suggested_org_name]);
        $existingOrg = $checkOrgStmt->fetch();

        if ($existingOrg) {
            // Request to join existing org (can't auto-join on public domain)
            $org_id = null;
            $request_sent = $existingOrg['id'];
        } else {
            // New Individual Org
            $role = 'admin';
            $oStmt = $pdo->prepare("INSERT INTO organizations (name, is_public_client) VALUES (:name, :consent)");
            $oStmt->execute([':name' => $suggested_org_name, ':consent' => $is_public_client]);
            $org_id = $pdo->lastInsertId();
            
            $cStmt = $pdo->prepare("INSERT INTO clusters (org_id, name, description) VALUES (?, ?, ?)");
            $cStmt->execute([$org_id, 'Personal Workspace', 'Individual node cluster']);
        }
    }

    // Set trial to 14 days from now
    $trial_expiry = date('Y-m-d H:i:s', strtotime('+14 days'));
    $otp_expiry = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, trial_ends_at, org_id, verification_otp, is_verified, otp_expires_at) VALUES (:name, :email, :password_hash, :role, :trial_expiry, :org_id, :otp, 0, :otp_expiry)");
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':password_hash', $password_hash, PDO::PARAM_STR);
    $stmt->bindValue(':role', $role, PDO::PARAM_STR);
    $stmt->bindValue(':trial_expiry', $trial_expiry, PDO::PARAM_STR);
    $stmt->bindValue(':org_id', $org_id, $org_id ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->bindValue(':otp', $otp, PDO::PARAM_STR);
    $stmt->bindValue(':otp_expiry', $otp_expiry, PDO::PARAM_STR);
    $stmt->execute();

    $newUserId = $pdo->lastInsertId();

    // Log the event
    log_audit("Identity Created", $newUserId, [
        "role" => $role,
        "org_id" => $org_id,
        "auto_sync" => $auto_assigned
    ], 'info');

    // Dispatch OTP Signal
    $signalSent = sendOTP($email, $otp, $name);

    if ($org_id && $role === 'admin') {
        // Link admin to the auto-created cluster
        $mStmt = $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES ((SELECT id FROM clusters WHERE org_id = ? LIMIT 1), ?, 'manager')");
        $mStmt->execute([$org_id, $newUserId]);
    } else if ($org_id && $role === 'agent') {
        // Automatically place agent in the global operations cluster of the detected org
        $mStmt = $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES ((SELECT id FROM clusters WHERE org_id = ? ORDER BY id ASC LIMIT 1), ?, 'member')");
        $mStmt->execute([$org_id, $newUserId]);
    } else if ($request_sent) {
        // Create request for existing org (public domain scenario)
        $pdo->prepare("INSERT INTO organization_requests (user_id, org_id, message) VALUES (?, ?, ?)")
            ->execute([$newUserId, $request_sent, "Access request for: $suggested_org_name"]);
    }

    $message = "Protocol initiated.";
    if ($auto_assigned) {
        $message = "Your identity has been synchronized with the existing organization for the '$domain' domain. You have been granted Agent-level access. Please coordinate with your administrator for elevated permissions.";
    } else if ($request_sent) {
        $message = "Organization '$suggested_org_name' detected. Membership request has been dispatched to the administrator.";
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
