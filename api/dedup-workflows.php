<?php
/**
 * dedup-workflows.php
 * Removes duplicate workflow entries (same name, same user/cluster).
 * Keeps the LOWEST id (earliest created) and deletes the rest.
 * Only callable by authenticated users (cleans their own workflows).
 */
require_once 'db-config.php';
require_once 'auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$authPayload = authenticate_request();
$userId = $authPayload['id'];
$userRole = $authPayload['role'] ?? 'agent';

try {
    // Find all name groups that have duplicates for this user
    $findStmt = $pdo->prepare(
        "SELECT name, COUNT(*) as cnt, MIN(id) as keep_id
         FROM workflows
         WHERE user_id = :uid
           OR cluster_id IN (
               SELECT cluster_id FROM cluster_members
               WHERE user_id = :uid2 AND role IN ('manager', 'admin')
           )
         GROUP BY name
         HAVING COUNT(*) > 1"
    );
    $findStmt->bindValue(':uid',  $userId, PDO::PARAM_INT);
    $findStmt->bindValue(':uid2', $userId, PDO::PARAM_INT);
    $findStmt->execute();
    $duplicateGroups = $findStmt->fetchAll(PDO::FETCH_ASSOC);

    $deletedTotal = 0;
    $details = [];

    foreach ($duplicateGroups as $group) {
        $name    = $group['name'];
        $keepId  = $group['keep_id'];
        $count   = (int)$group['cnt'];

        // Delete all but the one we want to keep
        $delStmt = $pdo->prepare(
            "DELETE FROM workflows
             WHERE name = :name
               AND id != :keep_id
               AND (
                   user_id = :uid
                   OR cluster_id IN (
                       SELECT cluster_id FROM cluster_members
                       WHERE user_id = :uid2 AND role IN ('manager', 'admin')
                   )
               )"
        );
        $delStmt->bindValue(':name',    $name,   PDO::PARAM_STR);
        $delStmt->bindValue(':keep_id', $keepId, PDO::PARAM_INT);
        $delStmt->bindValue(':uid',     $userId, PDO::PARAM_INT);
        $delStmt->bindValue(':uid2',    $userId, PDO::PARAM_INT);
        $delStmt->execute();

        $removed = $count - 1;
        $deletedTotal += $removed;
        $details[] = [
            'name'    => $name,
            'kept_id' => $keepId,
            'removed' => $removed
        ];
    }

    echo json_encode([
        'status'        => 'success',
        'message'       => "Deduplication complete. Removed {$deletedTotal} duplicate workflow(s).",
        'deleted_count' => $deletedTotal,
        'details'       => $details
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
