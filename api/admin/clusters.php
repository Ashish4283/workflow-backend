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
            // List clusters with member counts and shared workflow counts
            $stmt = $pdo->query("
                SELECT c.*, 
                (SELECT COUNT(*) FROM cluster_members WHERE cluster_id = c.id) as user_count,
                (SELECT COUNT(*) FROM workflows WHERE cluster_id = c.id) as workflow_count
                FROM clusters c 
                ORDER BY c.name ASC
            ");
            $clusters = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $clusters]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Cluster name is required"]);
                break;
            }
            $stmt = $pdo->prepare("INSERT INTO clusters (name, description, org_id) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $data['description'] ?? '', $data['org_id'] ?? null]);
            $clusterId = $pdo->lastInsertId();
            
            // Auto-assign the creator as a manager of this cluster
            $stmt = $pdo->prepare("INSERT INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'manager')");
            $stmt->execute([$clusterId, $payload['id']]);
            
            echo json_encode(["status" => "success", "id" => $clusterId]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id']) || empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID and Name are required"]);
                break;
            }
            $stmt = $pdo->prepare("UPDATE clusters SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['description'] ?? '', $data['id']]);
            echo json_encode(["status" => "success", "message" => "Cluster protocol updated"]);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Cluster ID is required"]);
                break;
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
