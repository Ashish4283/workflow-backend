<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Only admins can update users
$current_user = authenticate_request();
require_role($current_user, ['admin', 'manager']);

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id) || empty($data->role)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID and Role are required."]);
    exit;
}

// roles: super_admin, admin, manager, tech_user, worker
$current_role = $current_user['role'];
$is_super_admin = ($current_role === 'super_admin');
$current_org_id = $current_user['org_id'];
$current_user_id = $current_user['id'];

if ($current_role !== 'super_admin' && $current_role !== 'admin' && $current_role !== 'manager') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden - Insufficient permissions to update roles."]);
    exit;
}

try {
    // Check target user current role and org
    $check_query = "SELECT role, email, org_id FROM users WHERE id = :id";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->bindParam(":id", $data->user_id);
    $check_stmt->execute();
    $target_user = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$target_user) {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    // Role safety logic
    if (!$is_super_admin) {
        // Admins can only update users within their own organization
        if ($current_role === 'admin') {
            if ($target_user['org_id'] != $current_org_id) {
                echo json_encode(["status" => "error", "message" => "You can only manage users within your organization."]);
                exit;
            }
            // Admins can manage manager, tech_user, worker
            $allowed_to_change = ['manager', 'tech_user', 'worker'];
            if (!in_array($target_user['role'], $allowed_to_change) && $target_user['role'] !== 'admin') {
                 // if target is super_admin, block
                 echo json_encode(["status" => "error", "message" => "Insufficient permission to modify this user."]);
                 exit;
            }
            // Admins cannot create super_admins or other admins (as per existing logic, though they ARE admins)
            // Actually, usually an Admin can't make someone else an Admin unless they are a Super Admin.
            if ($data->role === 'admin' || $data->role === 'super_admin') {
                echo json_encode(["status" => "error", "message" => "Permission denied to assign Admin/Super-Admin roles."]);
                exit;
            }
        } 
        elseif ($current_role === 'manager') {
            // Managers can only update tech_user or worker
            $allowed_to_set = ['tech_user', 'worker'];
            if (!in_array($data->role, $allowed_to_set)) {
                echo json_encode(["status" => "error", "message" => "Managers can only assign Operational roles (Tech User, Worker)."]);
                exit;
            }
            
            // Check if target user is in manager's cluster
            $cluster_check = $pdo->prepare("
                SELECT 1 FROM cluster_members cm1
                JOIN cluster_members cm2 ON cm1.cluster_id = cm2.cluster_id
                WHERE cm1.user_id = ? AND cm2.user_id = ?
            ");
            $cluster_check->execute([$current_user_id, $data->user_id]);
            if (!$cluster_check->fetch()) {
                echo json_encode(["status" => "error", "message" => "You can only manage users within your assigned clusters."]);
                exit;
            }
            
            // Cannot modify admins or higher
            if ($target_user['role'] === 'admin' || $target_user['role'] === 'super_admin' || $target_user['role'] === 'manager') {
                 if ($target_user['id'] != $current_user_id) {
                    echo json_encode(["status" => "error", "message" => "Managers cannot modify other Managers or Admins."]);
                    exit;
                 }
            }
        }
    }

    $query = "UPDATE users SET role = :role WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":role", $data->role);
    $stmt->bindParam(":id", $data->user_id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "User role updated to " . $data->role]);
    } else {
        echo json_encode(["status" => "error", "message" => "Unable to update user role."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
