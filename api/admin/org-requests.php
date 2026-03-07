<?php
// api/admin/org-requests.php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $payload = authenticate_request();
    require_role($payload, ['super_admin', 'admin']);

    $role = $payload['role'];
    $orgId = $payload['org_id'];

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $query = "SELECT r.*, u.name as user_name, u.email as user_email, o.name as org_name
                  FROM organization_requests r
                  JOIN users u ON r.user_id = u.id
                  JOIN organizations o ON r.org_id = o.id
                  WHERE r.status = 'pending'";
        
        $params = [];
        if ($role === 'admin') {
            $query .= " AND r.org_id = ?";
            $params[] = $orgId;
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $requests]);
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $requestId = $data['request_id'] ?? null;
        $action = $data['action'] ?? null; // 'approve' or 'reject'

        if (!$requestId || !$action) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Request ID and action required."]);
            exit;
        }

        // Fetch request details
        $reqStmt = $pdo->prepare("SELECT * FROM organization_requests WHERE id = ?");
        $reqStmt->execute([$requestId]);
        $request = $reqStmt->fetch();

        if (!$request) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Request not found."]);
            exit;
        }

        if ($role === 'admin' && $request['org_id'] != $orgId) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Unauthorized access to this request."]);
            exit;
        }

        $pdo->beginTransaction();

        if ($action === 'approve') {
            // Update request status
            $updReq = $pdo->prepare("UPDATE organization_requests SET status = 'approved' WHERE id = ?");
            $updReq->execute([$requestId]);

            // Update user organization
            $updUser = $pdo->prepare("UPDATE users SET org_id = ? WHERE id = ?");
            $updUser->execute([$request['org_id'], $request['user_id']]);

            // Optional: assign to default cluster if it exists
            $clustStmt = $pdo->prepare("SELECT id FROM clusters WHERE org_id = ? ORDER BY created_at ASC LIMIT 1");
            $clustStmt->execute([$request['org_id']]);
            $cluster = $clustStmt->fetch();
            if ($cluster) {
                $insMem = $pdo->prepare("INSERT IGNORE INTO cluster_members (cluster_id, user_id, role) VALUES (?, ?, 'member')");
                $insMem->execute([$cluster['id'], $request['user_id']]);
            }

        } else {
            $updReq = $pdo->prepare("UPDATE organization_requests SET status = 'rejected' WHERE id = ?");
            $updReq->execute([$requestId]);
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Request " . $action . "d successfully."]);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
