<?php
require_once 'db-config.php';
require_once 'auth-guard.php';

header("Content-Type: application/json");

// Authenticate via JWT
$authPayload = authenticate_request();
$userId = $authPayload['id'];
$userRole = $authPayload['role'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sectionId = $_GET['section_id'] ?? null;
    
    if ($sectionId) {
        $stmt = $pdo->prepare("SELECT * FROM knowledge_base WHERE section_id = ?");
        $stmt->execute([$sectionId]);
        $result = $stmt->fetch();
        echo json_encode(["status" => "success", "data" => $result]);
    } else {
        $stmt = $pdo->query("SELECT * FROM knowledge_base");
        $results = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => $results]);
    }
} 

elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Only super_admin can edit Knowledge Base
    if ($userRole !== 'super_admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Unauthorized. Only Super Admins can edit the Knowledge Base."]);
        exit;
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data["section_id"]) || !isset($data["content"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
        exit;
    }

    $sectionId = $data["section_id"];
    $content = json_encode($data["content"]);

    $stmt = $pdo->prepare("INSERT INTO knowledge_base (section_id, content_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_json = ?");
    $stmt->execute([$sectionId, $content, $content]);

    echo json_encode(["status" => "success", "message" => "Knowledge Base updated."]);
}
?>
