<?php
require_once 'db-config.php';
require_once 'auth-guard.php';

header("Content-Type: application/json");

// Optional: Auth to see hearts they've liked
$authPayload = null;
try {
    $authPayload = authenticate_request();
} catch (Exception $e) {
    // Public repo might be visible to non-logged in users later? 
    // For now, let's keep it restricted to logged in users to handle likes.
}

$userId = $authPayload ? $authPayload['id'] : null;

try {
    // Fetch public workflows with creator details and check if liked by current user
    $query = "
        SELECT 
            w.id, w.name, w.builder_json, w.category, w.hearts, w.updated_at,
            u.name as creator_name, u.avatar_url as creator_avatar,
            (SELECT COUNT(*) FROM workflow_likes WHERE workflow_id = w.id AND user_id = ?) as is_liked
        FROM workflows w
        JOIN users u ON w.user_id = u.id
        WHERE w.is_public = 1
        ORDER BY w.hearts DESC, w.updated_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$r) {
        if (isset($r["builder_json"])) {
            $r["builder_json"] = json_decode($r["builder_json"], true);
        }
        $r["is_liked"] = (bool)$r["is_liked"];
    }

    echo json_encode(["status" => "success", "data" => $rows]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
