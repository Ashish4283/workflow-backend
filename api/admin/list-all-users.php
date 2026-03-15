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
    $role = $payload['role'] ?? 'tech_user';
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
                u.org_id,
                CASE 
                    WHEN u.role = 'super_admin' THEN 'Super Admin'
                    WHEN o.name IS NOT NULL THEN o.name
                    ELSE (
                        SELECT GROUP_CONCAT(DISTINCT org.name SEPARATOR ', ') 
                        FROM cluster_members cm 
                        JOIN clusters c ON cm.cluster_id = c.id 
                        JOIN organizations org ON c.org_id = org.id 
                        WHERE cm.user_id = u.id
                    )
                END as org_name,
                m.name as manager_name,
                (SELECT COUNT(*) FROM workflows WHERE user_id = u.id) as workflow_count,
                (SELECT GROUP_CONCAT(COALESCE(cm.cluster_id, '') SEPARATOR ',') FROM cluster_members cm WHERE cm.user_id = u.id) as cluster_ids,
                (SELECT GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') FROM cluster_members cm JOIN clusters c ON cm.cluster_id = c.id WHERE cm.user_id = u.id) as clusters
              FROM users u
              LEFT JOIN users m ON u.manager_id = m.id
              LEFT JOIN organizations o ON u.org_id = o.id
              WHERE 1=1";

    $params = [];

    if ($role === 'super_admin') {
        // Super admin sees all users across all organizations
    } elseif ($role === 'admin') {
        // Admins see everyone in their organization OR users they manage directly
        $query .= " AND (u.org_id = ? OR u.manager_id = ? OR u.id = ?)";
        $params[] = $org_id;
        $params[] = $user_id;
        $params[] = $user_id;
    } elseif ($role === 'manager') {
        $query .= " AND (u.id = ? OR u.manager_id = ? OR u.id IN (
            SELECT cm2.user_id FROM cluster_members cm1
            JOIN cluster_members cm2 ON cm1.cluster_id = cm2.cluster_id
            WHERE cm1.user_id = ?
        ))";
        $params[] = $user_id;
        $params[] = $user_id;
        $params[] = $user_id;
    } else {
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
