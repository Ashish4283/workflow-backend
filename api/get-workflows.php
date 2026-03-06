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
  // 1. Admins see everything if they want, or a specific user.
  // 2. Managers see their group's workflows.
  // 3. Users/Workers see their own OR their group's workflows.

  // Get current user's group_id
  $uStmt = $pdo->prepare("SELECT group_id FROM users WHERE id = ?");
  $uStmt->execute([$currentUserId]);
  $myGroupId = $uStmt->fetchColumn();

  $env = $_GET['env'] ?? null;
  $query = "SELECT id, name, builder_json, updated_at, user_id, group_id, cluster_id, environment, version, parent_id FROM workflows WHERE ";
  $params = [];

  if ($currentUserRole === 'admin' || $currentUserRole === 'super_admin') {
      $query .= "1=1 "; 
  } else {
      $query .= "(user_id = ? OR group_id = ?) ";
      $params[] = $currentUserId;
      $params[] = $myGroupId;
  }

  if ($env) {
      $query .= " AND environment = ? ";
      $params[] = $env;
  }

  $query .= "ORDER BY updated_at DESC LIMIT ? OFFSET ?";
  
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
  
  echo json_encode([
      "status" => "success",
      "data" => $rows
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
