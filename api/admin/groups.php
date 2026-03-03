<?php
// api/admin/groups.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db-config.php';
require_once '../auth-guard.php';

// Auth Check
$payload = authenticate_request();
require_role($payload, ['admin', 'manager']);

$method = $_SERVER['REQUEST_METHOD'];

try {
    // --- AUTO-MIGRATION CHECK ---
    // This ensures the table and column exist when the endpoint is first called
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $checkColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'group_id'");
    if ($checkColumn->rowCount() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN group_id INT DEFAULT NULL;");
        $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_user_group FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE SET NULL;");
    }

    // --- END AUTO-MIGRATION ---

    switch($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT g.*, (SELECT COUNT(*) FROM users WHERE group_id = g.id) as user_count FROM user_groups g ORDER BY g.name ASC");
            $groups = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $groups]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Group name is required"]);
                break;
            }
            $stmt = $pdo->prepare("INSERT INTO user_groups (name, description) VALUES (?, ?)");
            $stmt->execute([$data['name'], $data['description'] ?? '']);
            echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id']) || empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID and Name are required"]);
                break;
            }
            $stmt = $pdo->prepare("UPDATE user_groups SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['description'] ?? '', $data['id']]);
            echo json_encode(["status" => "success", "message" => "Group updated"]);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID is required"]);
                break;
            }
            $stmt = $pdo->prepare("DELETE FROM user_groups WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Group deleted"]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
