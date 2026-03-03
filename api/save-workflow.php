<?php
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

// Authenticate via JWT
$authPayload = authenticate_request();
$userId = $authPayload['id'];

// Limit payload size
$max_size = 2 * 1024 * 1024;
if (isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > $max_size) {
    http_response_code(413);
    echo json_encode(["status" => "error", "message" => "Payload too large. Maximum size is 2MB."]);
    exit;
}

try {
  $rawInput = file_get_contents("php://input");
  $data = json_decode($rawInput, true);

  if (json_last_error() !== JSON_ERROR_NONE || !isset($data["builder_json"])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload"]);
    exit;
  }

  $name = htmlspecialchars(strip_tags($data["name"] ?? "Untitled Workflow"), ENT_QUOTES, 'UTF-8');
  $builderJsonString = json_encode($data["builder_json"]);

  // --- TRIAL & LIMIT CHECKS ---
  $isInsert = !isset($data['id']) || empty($data['id']);

  if ($isInsert) {
      // Get user trial info
      $uStmt = $pdo->prepare("SELECT role, trial_ends_at, manager_id FROM users WHERE id = :id");
      $uStmt->execute([':id' => $userId]);
      $userDb = $uStmt->fetch();

      if ($userDb) {
          // If role is 'user' AND has no manager -> check trial
          if ($userDb['role'] === 'user' && empty($userDb['manager_id'])) {
              // Check trial expiry
              if ($userDb['trial_ends_at'] && strtotime($userDb['trial_ends_at']) < time()) {
                  http_response_code(403);
                  echo json_encode(["status" => "error", "message" => "Trial expired. Please contact a manager to upgrade/link your account."]);
                  exit;
              }
              // Check workflow count
              $countStmt = $pdo->prepare("SELECT COUNT(*) FROM workflows WHERE user_id = :uid");
              $countStmt->execute([':uid' => $userId]);
              if ($countStmt->fetchColumn() >= 1) {
                  http_response_code(403);
                  echo json_encode(["status" => "error", "message" => "Free trial limit reached (1 workflow max)."]);
                  exit;
              }
          }
      }
  }

  // --- CLUSTER SCOPING ---
  // Get user's active cluster (defaulting to the first membership if not specified)
  $clusterId = $data['cluster_id'] ?? null;
  
  if (!$clusterId) {
      $cStmt = $pdo->prepare("SELECT cluster_id FROM cluster_members WHERE user_id = ? LIMIT 1");
      $cStmt->execute([$userId]);
      $clusterId = $cStmt->fetchColumn() ?: null;
  }

  if (!$isInsert) {
      $id = filter_var($data['id'], FILTER_VALIDATE_INT);
      
      $stmt = $pdo->prepare(
        "UPDATE workflows SET name = :name, builder_json = :builder_json, cluster_id = :cluster_id, updated_at = NOW() WHERE id = :id AND (user_id = :user_id OR cluster_id IN (SELECT cluster_id FROM cluster_members WHERE user_id = :user_id AND role = 'manager'))"
      );
      $stmt->bindValue(':name', $name, PDO::PARAM_STR);
      $stmt->bindValue(':builder_json', $builderJsonString, PDO::PARAM_STR);
      $stmt->bindValue(':cluster_id', $clusterId, PDO::PARAM_INT);
      $stmt->bindValue(':id', $id, PDO::PARAM_INT);
      $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
      $stmt->execute();
      
      echo json_encode(["status" => "success", "id" => $id]);
  } else {
      $stmt = $pdo->prepare(
        "INSERT INTO workflows (user_id, name, builder_json, cluster_id) VALUES (:user_id, :name, :builder_json, :cluster_id)"
      );
      $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
      $stmt->bindValue(':name', $name, PDO::PARAM_STR);
      $stmt->bindValue(':builder_json', $builderJsonString, PDO::PARAM_STR);
      $stmt->bindValue(':cluster_id', $clusterId, PDO::PARAM_INT);
      $stmt->execute();
      
      echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
  }
} catch (Exception $e) {
  http_response_code(500);
  error_log("Save Workflow Error: " . $e->getMessage());
  echo json_encode(["status" => "error", "message" => "Could not save the workflow."]);
}
?>