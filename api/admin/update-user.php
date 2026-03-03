<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Only admins can update users
$current_user = authenticate_request();
require_role($current_user, 'admin');

$data = json_decode(file_get_contents("php://input"));

if (empty($data->user_id) || empty($data->role)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID and Role are required."]);
    exit;
}

// Special case: Only ashish.jiwa@gmail.com can change other admins or create admins
$is_super_admin = ($current_user['email'] === 'ashish.jiwa@gmail.com');

try {
    // Check target user current role
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
    if (!$is_super_admin) {
        if ($target_user['role'] === 'admin') {
            echo json_encode(["status" => "error", "message" => "Only the Super-Admin can modify other Admins."]);
            exit;
        }
        if ($data->role === 'admin') {
            echo json_encode(["status" => "error", "message" => "You cannot promote users to Admin. Contact Super-Admin."]);
            exit;
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
