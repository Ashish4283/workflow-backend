<?php
// api/admin/clusters.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

$payload = authenticate_request();
require_role($payload, ['admin', 'manager']);

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            $role = $payload['role'];
            $org_id = $payload['org_id'];
            $userId = $payload['id'];

            if ($role === 'super_admin') {
                $stmt = $pdo->query("
                    SELECT c.*, o.name as org_name,
                    (SELECT COUNT(*) FROM cluster_members WHERE cluster_id = c.id) as user_count,
                    (SELECT COUNT(*) FROM workflows WHERE cluster_id = c.id) as workflow_count
                    FROM clusters c 
                    LEFT JOIN organizations o ON c.org_id = o.id
                    ORDER BY c.name ASC
                ");
                $clusters = $stmt->fetchAll();
            } elseif ($role === 'admin') {
                $stmt = $pdo->prepare("
                    SELECT c.*, 
                    (SELECT COUNT(*) FROM cluster_members WHERE cluster_id = c.id) as user_count,
                    (SELECT COUNT(*) FROM workflows WHERE cluster_id = c.id) as workflow_count
                    FROM clusters c 
                    WHERE c.org_id = ?
                    ORDER BY c.name ASC
                ");
                $stmt->execute([$org_id]);
                $clusters = $stmt->fetchAll();
            } elseif ($role === 'manager') {
                // Return only clusters where this user is a member/manager
                $stmt = $pdo->prepare("
                    SELECT c.*, 
                    (SELECT COUNT(*) FROM cluster_members WHERE cluster_id = c.id) as user_count,
                    (SELECT COUNT(*) FROM workflows WHERE cluster_id = c.id) as workflow_count
                    FROM clusters c 
                    JOIN cluster_members cm ON c.id = cm.cluster_id
                    WHERE cm.user_id = ?
                    ORDER BY c.name ASC
                ");
                $stmt->execute([$userId]);
                $clusters = $stmt->fetchAll();
            } else {
                $clusters = [];
            }
            echo json_encode(["status" => "success", "data" => $clusters]);
            break;

        case 'POST':
            require_role($payload, ['admin']); // Only Admin/SuperAdmin can create clusters
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Cluster name is required"]);
                break;
            }

            $org_id = ($payload['role'] === 'super_admin') ? ($data['org_id'] ?? null) : $payload['org_id'];

            if (!$org_id && $payload['role'] !== 'super_admin') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Organization context required"]);
                break;
            }

            $stmt = $pdo->prepare("INSERT INTO clusters (name, description, org_id) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $data['description'] ?? '', $org_id]);
            $clusterId = $pdo->lastInsertId();
            
            // Auto-assign the creator as a manager of this cluster
            $stmt = $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'manager')");
            $stmt->execute([$clusterId, $payload['id']]);
            
            echo json_encode(["status" => "success", "id" => (int)$clusterId]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            $id = $data['id'] ?? null;
            if (!$id || empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID and Name are required"]);
                break;
            }

            // Authorization check
            if ($payload['role'] !== 'super_admin') {
                $stmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch();
                if (!$existing || ($payload['role'] === 'admin' && $existing['org_id'] != $payload['org_id'])) {
                    http_response_code(403);
                    echo json_encode(["status" => "error", "message" => "Access denied to this cluster"]);
                    break;
                }
                if ($payload['role'] === 'manager') {
                    $mCheck = $pdo->prepare("SELECT id FROM cluster_members WHERE cluster_id = ? AND user_id = ? AND role = 'manager'");
                    $mCheck->execute([$id, $payload['id']]);
                    if (!$mCheck->fetch()) {
                        http_response_code(403);
                        echo json_encode(["status" => "error", "message" => "Only cluster managers can edit"]);
                        break;
                    }
                }
            }

            $stmt = $pdo->prepare("UPDATE clusters SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['description'] ?? '', $id]);
            echo json_encode(["status" => "success", "message" => "Cluster protocol updated"]);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Cluster ID is required"]);
                break;
            }

            // Authorization check
            if ($payload['role'] !== 'super_admin') {
                $stmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch();
                if (!$existing || ($payload['role'] === 'admin' && $existing['org_id'] != $payload['org_id'])) {
                    http_response_code(403);
                    echo json_encode(["status" => "error", "message" => "Access denied"]);
                    break;
                }
                if ($payload['role'] === 'manager') {
                     // Managers can't delete clusters? User said: "Admin: Can create and manage clusters... Manager: Can manage their assigned clusters."
                     // Usually delete is an Admin action.
                     http_response_code(403);
                     echo json_encode(["status" => "error", "message" => "Only Admins can decommission clusters"]);
                     break;
                }
            }

            $stmt = $pdo->prepare("DELETE FROM clusters WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Cluster decommissioned"]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
