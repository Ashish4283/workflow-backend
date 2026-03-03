<?php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$authPayload = authenticate_request();
$userId = $authPayload['id'];
$userRole = $authPayload['role'];

try {
    // 1. Check for specific filters (status, cluster, org)
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    $cluster_id = isset($_GET['cluster_id']) ? (int)$_GET['cluster_id'] : null;

    // 2. Fetch User Context for Visibility
    $uStmt = $pdo->prepare("SELECT org_id, id FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    // 3. Build Query based on Role
    $sql = "SELECT t.*, w.name as workflowName, u.name as assignedToName
            FROM tasks t
            LEFT JOIN workflows w ON t.workflow_id = w.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1";
    $params = [];

    if ($userRole === 'admin') {
        $sql .= " AND t.org_id = ?";
        $params[] = $user['org_id'];
    } elseif ($userRole !== 'super_admin') {
        // Find user clusters
        $cmStmt = $pdo->prepare("SELECT cluster_id FROM cluster_members WHERE user_id = ?");
        $cmStmt->execute([$userId]);
        $clusters = $cmStmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($clusters)) {
            $placeholders = implode(',', array_fill(0, count($clusters), '?'));
            $sql .= " AND t.cluster_id IN ($placeholders)";
            foreach ($clusters as $c) $params[] = $c;
        } else {
            // No clusters assigned -> return empty if not super/admin
            echo json_encode(["status" => "success", "data" => []]);
            exit;
        }
    }

    if ($status) {
        $sql .= " AND t.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY t.created_at DESC LIMIT 100";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode JSON blobs
    foreach ($tasks as &$task) {
        $task['input_data'] = json_decode($task['input_data'], true);
        $task['output_data'] = json_decode($task['output_data'], true);
    }

    echo json_encode([
        "status" => "success",
        "data" => $tasks
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
