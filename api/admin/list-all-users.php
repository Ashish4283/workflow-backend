<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Only admins can access this list
$payload = authenticate_request();
    $user_id = $payload['id'];
    $role = $payload['role'] ?? 'user';
    $org_id = $payload['org_id'] ?? null;
    
    try {
        $query = "SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at, 
                u.trial_ends_at, 
                u.manager_id,
                u.group_id as cluster_id, -- Mapping for UI
                u.org_id,
                g.name as group_name,
                m.name as manager_name,
                (SELECT COUNT(*) FROM workflows WHERE user_id = u.id) as workflow_count
              FROM users u
              LEFT JOIN users m ON u.manager_id = m.id
              LEFT JOIN user_groups g ON u.group_id = g.id
              WHERE 1=1";

    $params = [];

    if ($role === 'super_admin') {
        // sees everyone
    } elseif ($role === 'admin') {
        // sees their own organization's users
        if ($org_id) {
            $query .= " AND u.org_id = ?";
            $params[] = $org_id;
        } else {
            // fallback: only see self and those they manage
            $query .= " AND (u.id = ? OR u.manager_id = ?)";
            $params[] = $user_id;
            $params[] = $user_id;
        }
    } elseif ($role === 'manager') {
        // only sees people they manage
        $query .= " AND (u.id = ? OR u.manager_id = ?)";
        $params[] = $user_id;
        $params[] = $user_id;
    } else {
        // others only see themselves
        $query .= " AND u.id = ?";
        $params[] = $user_id;
    }

    $query .= " ORDER BY u.created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
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
