<?php
// api/admin/infrastructure-map.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
require_role($payload, ['manager', 'admin']); 

try {
    $role = $payload['role'];
    $org_id = $payload['org_id'] ?? null;
    $user_id = $payload['id'];

    $infrastructure = [];

    // 1. Fetch Clusters based on role
    if ($role === 'super_admin') {
        $stmt = $pdo->query("SELECT c.id, c.name, c.description, c.org_id, o.name as org_name 
                            FROM clusters c 
                            LEFT JOIN organizations o ON c.org_id = o.id
                            ORDER BY c.name ASC");
        $clusters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($role === 'admin' && $org_id) {
        $stmt = $pdo->prepare("SELECT c.id, c.name, c.description, c.org_id, o.name as org_name 
                              FROM clusters c 
                              LEFT JOIN organizations o ON c.org_id = o.id
                              WHERE c.org_id = ?
                              ORDER BY c.name ASC");
        $stmt->execute([$org_id]);
        $clusters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } elseif ($role === 'manager') {
        $stmt = $pdo->prepare("SELECT c.id, c.name, c.description, c.org_id, o.name as org_name 
                              FROM clusters c 
                              JOIN cluster_members cm ON c.id = cm.cluster_id 
                              LEFT JOIN organizations o ON c.org_id = o.id
                              WHERE cm.user_id = ?
                              ORDER BY c.name ASC");
        $stmt->execute([$user_id]);
        $clusters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $clusters = [];
    }

    // 2. Map Workflows and Members to Each Cluster
    $wfCols = $pdo->query("SHOW COLUMNS FROM workflows")->fetchAll(PDO::FETCH_COLUMN);
    $hasStatus = in_array('status', $wfCols);
    $wfSelect = $hasStatus ? "id, name, status" : "id, name, 'active' as status";

    foreach ($clusters as $cluster) {
        $wfStmt = $pdo->prepare("SELECT $wfSelect FROM workflows WHERE cluster_id = ?");
        $wfStmt->execute([$cluster['id']]);
        $cluster['workflows'] = $wfStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $memStmt = $pdo->prepare("SELECT u.id, u.name, u.role FROM users u 
                                  JOIN cluster_members cm ON u.id = cm.user_id 
                                  WHERE cm.cluster_id = ?");
        $memStmt->execute([$cluster['id']]);
        $cluster['members'] = $memStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $infrastructure[] = $cluster;
    }

    // 3. Add a "System Common" cluster for Detached/Unassigned items
    $detWfQuery = "SELECT $wfSelect FROM workflows WHERE cluster_id IS NULL";
    $detWfParams = [];
    $detMemQuery = "SELECT u.id, u.name, u.role FROM users u WHERE u.id NOT IN (SELECT user_id FROM cluster_members)";
    $detMemParams = [];

    if ($role === 'admin' && $org_id) {
        $detWfQuery .= " AND org_id = ?"; // workflows usually have org_id if assigned to org
        $detWfParams[] = $org_id;
        $detMemQuery .= " AND u.org_id = ?";
        $detMemParams[] = $org_id;
    } elseif ($role === 'manager') {
        // Managers usually only see their clusters, so maybe no detached view or only self
        $detWfQuery = null; 
        $detMemQuery = null;
    }

    if ($detWfQuery) {
        $stmt = $pdo->prepare($detWfQuery);
        $stmt->execute($detWfParams);
        $detWorkflows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare($detMemQuery);
        $stmt->execute($detMemParams);
        $detMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($detWorkflows) > 0 || count($detMembers) > 0) {
            $infrastructure[] = [
                'id' => 'system_common',
                'name' => 'Standalone Entities',
                'description' => 'Resources and personnel operating outside of specific mission clusters.',
                'org_name' => 'Root Layer',
                'workflows' => $detWorkflows,
                'members' => $detMembers,
                'is_system' => true
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $infrastructure
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
