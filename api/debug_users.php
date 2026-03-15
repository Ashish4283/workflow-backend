<?php
require_once 'db-config.php';
require_once 'auth-guard.php';

header("Content-Type: application/json");

try {
    $payload = authenticate_request();
    
    $stmt = $pdo->query("SELECT 
        u.id, 
        u.name, 
        u.email,
        (SELECT GROUP_CONCAT(c.name SEPARATOR ', ') FROM cluster_members cm JOIN clusters c ON cm.cluster_id = c.id WHERE cm.user_id = u.id) as cluster_name,
        (SELECT GROUP_CONCAT(cm.cluster_id SEPARATOR ',') FROM cluster_members cm WHERE cm.user_id = u.id) as cluster_ids
    FROM users u LIMIT 10");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $users
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
