<?php
// api/orgs/list.php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $authPayload = authenticate_request();
    $currentUserId = $authPayload['id'];
    $currentUserRole = $authPayload['role'] ?? 'worker';

    if ($currentUserRole === 'super_admin') {
        $stmt = $pdo->query("SELECT id, name, logo_url FROM organizations ORDER BY name ASC");
    } else {
        // Only return the user's assigned organization
        $stmt = $pdo->prepare("
            SELECT o.id, o.name, o.logo_url 
            FROM organizations o
            JOIN users u ON u.org_id = o.id
            WHERE u.id = ?
        ");
        $stmt->execute([$currentUserId]);
    }
    
    $orgs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $orgs]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
