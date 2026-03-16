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
          // If role is 'tech_user' or 'agent' AND has no manager -> check trial
          if (in_array($userDb['role'], ['tech_user', 'agent']) && empty($userDb['manager_id'])) {
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
  $clusterId = $data['cluster_id'] ?? null;
  if (!$clusterId) {
      $cStmt = $pdo->prepare("SELECT cluster_id FROM cluster_members WHERE user_id = ? LIMIT 1");
      $cStmt->execute([$userId]);
      $clusterId = $cStmt->fetchColumn() ?: null;
  }

  $env     = $data['environment'] ?? 'draft';
  $version = filter_var($data['version'] ?? 1, FILTER_VALIDATE_INT);
  $isPublic = isset($data['is_public']) ? (int)$data['is_public'] : 0;

  // ── PATH 1: Explicit ID → update that exact row ──────────────────────────
  if (!empty($data['id'])) {
      $id = filter_var($data['id'], FILTER_VALIDATE_INT);

      // 🔒 LOCK CHECK: Fetch current environment from DB
      $lockStmt = $pdo->prepare("SELECT environment FROM workflows WHERE id = ? LIMIT 1");
      $lockStmt->execute([$id]);
      $currentRow = $lockStmt->fetch(PDO::FETCH_ASSOC);

      if ($currentRow && in_array($currentRow['environment'], ['test', 'prod'])) {
          // Only allow if the incoming save is explicitly reverting back to draft
          if ($env !== 'draft') {
              http_response_code(423); // 423 Locked
              echo json_encode([
                  "status"  => "error",
                  "code"    => "WORKFLOW_LOCKED",
                  "message" => "This workflow is locked in '" . $currentRow['environment'] . "' environment. Revert it to Draft first before making changes."
              ]);
              exit;
          }
          // If env === 'draft' on incoming request → user is reverting, allow it through
      }

      $stmt = $pdo->prepare(
          "UPDATE workflows
           SET name = :name, builder_json = :builder_json, cluster_id = :cluster_id,
               environment = :env, version = :version, is_public = :is_public, updated_at = NOW()
           WHERE id = :id
             AND (user_id = :user_id OR cluster_id IN (
                 SELECT cluster_id FROM cluster_members WHERE user_id = :uid2 AND role = 'manager'
             ))"
      );
      $stmt->bindValue(':name',         $name,             PDO::PARAM_STR);
      $stmt->bindValue(':builder_json', $builderJsonString, PDO::PARAM_STR);
      $stmt->bindValue(':cluster_id',   $clusterId,        PDO::PARAM_INT);
      $stmt->bindValue(':env',          $env,              PDO::PARAM_STR);
      $stmt->bindValue(':version',      $version,          PDO::PARAM_INT);
      $stmt->bindValue(':is_public',    $isPublic,         PDO::PARAM_INT);
      $stmt->bindValue(':id',           $id,               PDO::PARAM_INT);
      $stmt->bindValue(':user_id',      $userId,           PDO::PARAM_INT);
      $stmt->bindValue(':uid2',         $userId,           PDO::PARAM_INT);
      $stmt->execute();

      echo json_encode(["status" => "success", "id" => $id, "action" => "updated", "environment" => $env]);
      exit;
  }

  // ── PATH 2: No ID → check for duplicate name, overwrite if found ─────────
  $dupStmt = $pdo->prepare(
      "SELECT id FROM workflows
       WHERE name = :name
         AND (user_id = :uid OR cluster_id IN (
             SELECT cluster_id FROM cluster_members WHERE user_id = :uid2 AND role = 'manager'
         ))
       LIMIT 1"
  );
  $dupStmt->bindValue(':name', $name,   PDO::PARAM_STR);
  $dupStmt->bindValue(':uid',  $userId, PDO::PARAM_INT);
  $dupStmt->bindValue(':uid2', $userId, PDO::PARAM_INT);
  $dupStmt->execute();
  $existing = $dupStmt->fetch(PDO::FETCH_ASSOC);

  if ($existing) {
      // ⚠️ NAME CONFLICT: A NEW workflow (no ID) is trying to use an existing name
      // → Reject with 409 Conflict. User must open the existing one or choose a different name.
      http_response_code(409);
      echo json_encode([
          "status"  => "error",
          "code"    => "NAME_CONFLICT",
          "message" => "A workflow named \"" . $name . "\" already exists. Please open the existing workflow to make changes, or choose a different name."
      ]);
      exit;
  }

  // ── PATH 3: Brand-new workflow → INSERT ───────────────────────────────────
  $insStmt = $pdo->prepare(
      "INSERT INTO workflows (user_id, name, builder_json, cluster_id, environment, version, is_public)
       VALUES (:user_id, :name, :builder_json, :cluster_id, :env, :version, :is_public)"
  );
  $insStmt->bindValue(':user_id',      $userId,            PDO::PARAM_INT);
  $insStmt->bindValue(':name',         $name,              PDO::PARAM_STR);
  $insStmt->bindValue(':builder_json', $builderJsonString,  PDO::PARAM_STR);
  $insStmt->bindValue(':cluster_id',   $clusterId,         PDO::PARAM_INT);
  $insStmt->bindValue(':env',          $env,               PDO::PARAM_STR);
  $insStmt->bindValue(':version',      $version,           PDO::PARAM_INT);
  $insStmt->bindValue(':is_public',    $isPublic,          PDO::PARAM_INT);
  $insStmt->execute();

  echo json_encode(["status" => "success", "id" => $pdo->lastInsertId(), "action" => "created"]);

} catch (Exception $e) {
  http_response_code(500);
  error_log("Save Workflow Error: " . $e->getMessage());
  echo json_encode([
    "status" => "error", 
    "message" => "Could not save the workflow.",
    "debug" => $e->getMessage()
  ]);
}
?>