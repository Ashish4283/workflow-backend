<?php
header("Content-Type: application/json");

try {
    require_once '../db-config.php';
    // Simplified Auth Check for now - but we should check JWT in production
    
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data["action"]) || !isset($data["userIds"]) || !is_array($data["userIds"])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid payload. Action and user IDs required."]);
        exit;
    }

    $action = $data["action"];
    $userIds = $data["userIds"];

    if (empty($userIds)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No entities selected for batch operation."]);
        exit;
    }

    // Sanitize and validate IDs
    $validatedIds = array_filter(array_map('intval', $userIds));
    $idPlaceholders = implode(',', array_fill(0, count($validatedIds), '?'));

    switch ($action) {
        case 'terminate':
            // Batch Deletion
            $stmt = $pdo->prepare("DELETE FROM users WHERE id IN ($idPlaceholders)");
            $stmt->execute($validatedIds);
            
            $count = $stmt->rowCount();
            echo json_encode([
                "status" => "success",
                "message" => "Operation Complete: $count entities successfully terminated from the matrix."
            ]);
            break;

        case 'reassign':
            // Logic for reassignment - for now we just mark them as tech_user as a demo
            // In real app, we might need a target 'org_id' or 'manager_id'
            $newRole = $data['targetRole'] ?? 'tech_user';
            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id IN ($idPlaceholders)");
            $params = array_merge([$newRole], $validatedIds);
            $stmt->execute($params);
            
            $count = $stmt->rowCount();
            echo json_encode([
                "status" => "success",
                "message" => "Operation Complete: $count entities successfully reassigned to $newRole status."
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown batch protocol: $action"]);
            break;
    }

} catch (Throwable $e) {
    http_response_code(500);
    error_log("Bulk Action Error: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Critical failure during mass entity processing.",
        "debug" => $e->getMessage()
    ]);
}
