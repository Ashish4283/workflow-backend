<?php
// By centralizing the DB connection, you only need to update credentials in one place.
require_once 'db-config.php';
require_once 'auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$authPayload = authenticate_request();
$currentUserId = $authPayload['id'];
$currentUserRole = $authPayload['role'] ?? 'worker';

error_log("GetWorkflows: User $currentUserId (Role: $currentUserRole) requesting list.");

try {
  // --- AUTO-MIGRATION ---
  $checkColumn = $pdo->query("SHOW COLUMNS FROM workflows LIKE 'group_id'");
  if ($checkColumn->rowCount() == 0) {
      $pdo->exec("ALTER TABLE workflows ADD COLUMN group_id INT DEFAULT NULL");
  }

  $targetUserId = filter_var($_GET["user_id"] ?? $currentUserId, FILTER_VALIDATE_INT);
  $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
  $limit = filter_var($_GET['limit'] ?? 50, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1, "max_range" => 100]]);
  
  $offset = ($page - 1) * $limit;

  // Logic: 
  // 1. Admins see everything.
  // 2. Others see workflows in their ORG or theirs personally.
  // 3. Optional org_id filter for Switching Orgs.

  $orgId = $_GET['org_id'] ?? null;
  $env = $_GET['env'] ?? null;
  $status = $_GET['status'] ?? null;

  $query = "
    SELECT 
        w.id, w.name, w.builder_json, w.updated_at, w.user_id, w.group_id, 
        w.cluster_id, w.org_id, w.environment, w.version, w.parent_id,
        w.is_public, w.hearts,
        u.name as creator_name, u.avatar_url as creator_avatar
    FROM workflows w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE ";
  $params = [];

  if ($currentUserRole === 'super_admin') {
      $query .= "1=1 ";
  } else {
      // User can see what belongs to their Org OR they created
      $uStmt = $pdo->prepare("SELECT org_id FROM users WHERE id = ?");
      $uStmt->execute([$currentUserId]);
      $myOrgId = $uStmt->fetchColumn();

      $query .= "(w.org_id = ? OR w.user_id = ?) ";
      $params[] = $myOrgId;
      $params[] = $currentUserId;
  }

  if ($orgId === 'personal') {
      $query .= " AND w.org_id IS NULL ";
  } elseif ($orgId) {
      $query .= " AND w.org_id = ? ";
      $params[] = (int)$orgId;
  }

  if ($env) {
      $query .= " AND w.environment = ? ";
      $params[] = $env;
  }

  if ($status) {
      $query .= " AND w.status = ? ";
      $params[] = $status;
  }

  $query .= " ORDER BY w.updated_at DESC LIMIT ? OFFSET ?";
  
  $stmt = $pdo->prepare($query);
  foreach ($params as $i => $val) {
      $stmt->bindValue($i + 1, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
  }
  $stmt->bindValue(count($params) + 1, $limit, PDO::PARAM_INT);
  $stmt->bindValue(count($params) + 2, $offset, PDO::PARAM_INT);
  $stmt->execute();
  
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($rows as &$r) {
    if (isset($r["builder_json"])) {
        $r["builder_json"] = json_decode($r["builder_json"], true);
    }
  }
  
  // Debug: Count total rows in table regardless of filter
  $countAll = $pdo->query("SELECT COUNT(*) FROM workflows")->fetchColumn();

  echo json_encode([
      "status" => "success",
      "data" => $rows,
      "debug_info" => [
          "user_id" => $currentUserId,
          "role" => $currentUserRole,
          "org_id_filter" => $orgId,
          "total_rows_in_db" => $countAll,
          "query_used" => $query
      ]
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
