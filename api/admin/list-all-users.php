<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Only admins can access this list
$payload = authenticate_request();
require_role($payload, 'admin');

try {
    // Fetch all users with basic stats
    // We join with workflows to get a count, and include manager info
    $query = "SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at, 
                u.trial_ends_at, 
                u.manager_id,
                m.name as manager_name,
                (SELECT COUNT(*) FROM workflows WHERE user_id = u.id) as workflow_count
              FROM users u
              LEFT JOIN users m ON u.manager_id = m.id
              ORDER BY u.created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $users
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Could not fetch users: " . $e->getMessage()
    ]);
}
?>
