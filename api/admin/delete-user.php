<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Only admins can delete users
$current_user = authenticate_request();
require_role($current_user, 'admin');

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

// Security: Prevent self-deletion
if ($current_user['id'] == $data->user_id) {
    echo json_encode(["status" => "error", "message" => "You cannot delete your own account."]);
    exit;
}

$is_super_admin = ($current_user['email'] === 'ashish.jiwa@gmail.com');

try {
    // Check target user
    $check_query = "SELECT role, email FROM users WHERE id = :id";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->bindParam(":id", $data->user_id);
    $check_stmt->execute();
    $target_user = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$target_user) {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    // Role safety logic
    if ($target_user['role'] === 'admin' && !$is_super_admin) {
        echo json_encode(["status" => "error", "message" => "Only the Super-Admin can delete other Admins."]);
        exit;
    }

    $pdo->beginTransaction();

    // 1. Clear manager_id from users who were managed by this user
    $clear_manager_query = "UPDATE users SET manager_id = NULL WHERE manager_id = :id";
    $cm_stmt = $pdo->prepare($clear_manager_query);
    $cm_stmt->bindParam(":id", $data->user_id);
    $cm_stmt->execute();

    // 2. Delete workflows
    $del_wf_query = "DELETE FROM workflows WHERE user_id = :id";
    $wf_stmt = $pdo->prepare($del_wf_query);
    $wf_stmt->bindParam(":id", $data->user_id);
    $wf_stmt->execute();

    // 3. Delete user
    $query = "DELETE FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":id", $data->user_id);

    if ($stmt->execute()) {
        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "User and associated data deleted successfully."]);
    } else {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Unable to delete user."]);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
