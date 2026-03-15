<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
$user_id = $payload['id'];
$role = $payload['role'] ?? 'tech_user';
$org_id = $payload['org_id'] ?? null;

try {
    // Relational Join Query - much more robust than subqueries for Hostinger
    $query = "SELECT 
            u.id, 
            u.name, 
            u.email, 
            u.role, 
            u.created_at, 
            u.org_id,
            u.manager_id,
            m.name as manager_name,
            o.name as direct_org_name,
            GROUP_CONCAT(DISTINCT c.id SEPARATOR ',') as cluster_ids,
            GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as clusters,
            GROUP_CONCAT(DISTINCT org.name SEPARATOR ', ') as cluster_org_names,
            (SELECT COUNT(*) FROM workflows WHERE user_id = u.id) as workflow_count
          FROM users u
          LEFT JOIN users m ON u.manager_id = m.id
          LEFT JOIN organizations o ON u.org_id = o.id
          LEFT JOIN cluster_members cm ON u.id = cm.user_id
          LEFT JOIN clusters c ON cm.cluster_id = c.id
          LEFT JOIN organizations org ON c.org_id = org.id
          WHERE 1=1";

    $params = [];

    if ($role === 'super_admin') {
        // Super admin sees all
    } elseif ($role === 'admin') {
        $query .= " AND (u.org_id = ? OR u.manager_id = ? OR u.id = ?)";
        $params[] = $org_id;
        $params[] = $user_id;
        $params[] = $user_id;
    } else {
        $query .= " AND u.id = ?";
        $params[] = $user_id;
    }

    $query .= " GROUP BY u.id ORDER BY u.created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Clean up result for the frontend
    foreach ($users as &$u) {
        if ($u['role'] === 'super_admin') {
            $u['org_name'] = 'Super Admin';
        } else {
            $u['org_name'] = $u['direct_org_name'] ?: ($u['cluster_org_names'] ?: 'Direct Enrollment');
        }
        // Ensure cluster_name is available for the table
        $u['cluster_name'] = $u['clusters'];
    }

    echo json_encode([
        "status" => "success",
        "data" => $users
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Sync Failed: " . $e->getMessage()
    ]);
}
?>
