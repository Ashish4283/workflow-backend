<?php
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

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!isset($data['id']) || !isset($data['target_env'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing workflow ID or target environment"]);
        exit;
    }

    $sourceId = filter_var($data['id'], FILTER_VALIDATE_INT);
    $targetEnv = $data['target_env']; // 'test' or 'prod'

    if (!in_array($targetEnv, ['test', 'prod'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid target environment"]);
        exit;
    }

    // 1. Fetch Source Workflow
    $stmt = $pdo->prepare("SELECT * FROM workflows WHERE id = ?");
    $stmt->execute([$sourceId]);
    $source = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$source) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Source workflow not found"]);
        exit;
    }

    // --- RBAC CHECK ---
    $role = $authPayload['role'];
    $orgId = $authPayload['org_id'];

    if ($role === 'super_admin') {
        // Full access
    } elseif ($role === 'admin') {
        // Admin must be in the same org as the workflow's cluster
        if ($source['cluster_id']) {
            $cStmt = $pdo->prepare("SELECT org_id FROM clusters WHERE id = ?");
            $cStmt->execute([$source['cluster_id']]);
            $workflowOrg = $cStmt->fetchColumn();
            if ($workflowOrg != $orgId) {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "Permission denied. Workflow belongs to another organization."]);
                exit;
            }
        }
    } elseif (in_array($role, ['manager', 'tech_user'])) {
        // Must be member of the cluster
        if (!$source['cluster_id']) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Permission denied. Workflow has no cluster assignment."]);
            exit;
        }
        $cmStmt = $pdo->prepare("SELECT 1 FROM cluster_members WHERE user_id = ? AND cluster_id = ?");
        $cmStmt->execute([$userId, $source['cluster_id']]);
        if (!$cmStmt->fetch()) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Permission denied. You are not a member of this workflow's cluster."]);
            exit;
        }
    } else {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Deployment restricted to Tech Users and above."]);
        exit;
    }

    // 2. Determine Parent ID (the original draft)
    $parentId = $source['parent_id'] ?: $source['id'];

    // 3. Look for an existing instance in the target environment
    $tStmt = $pdo->prepare("SELECT id, version FROM workflows WHERE parent_id = ? AND environment = ?");
    $tStmt->execute([$parentId, $targetEnv]);
    $existingTarget = $tStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingTarget) {
        $pdo->beginTransaction();
        try {
            // Backup current target to history
            $hStmt = $pdo->prepare("INSERT INTO workflow_history (workflow_id, builder_json, version) VALUES (?, ?, ?)");
            // Fetch current target content again for backup (already fetched but let's be sure)
            $backupStmt = $pdo->prepare("SELECT builder_json, version FROM workflows WHERE id = ?");
            $backupStmt->execute([$existingTarget['id']]);
            $backup = $backupStmt->fetch();

            $hStmt->execute([$existingTarget['id'], $backup['builder_json'], $backup['version']]);

            // Update with new source JSON
            $newVersion = $existingTarget['version'] + 1;
            $uStmt = $pdo->prepare("UPDATE workflows SET builder_json = :json, name = :name, version = :v, updated_at = NOW() WHERE id = :id");
            $uStmt->execute([
                ':json' => $source['builder_json'],
                ':name' => $source['name'],
                ':v' => $newVersion,
                ':id' => $existingTarget['id']
            ]);
            $pdo->commit();
            $targetId = $existingTarget['id'];
        } catch (Exception $ex) {
            $pdo->rollBack();
            throw $ex;
        }
    } else {
        // Create new instance for this environment
        $iStmt = $pdo->prepare("INSERT INTO workflows (user_id, cluster_id, name, builder_json, environment, version, parent_id) VALUES (:uid, :cid, :name, :json, :env, 1, :pid)");
        $iStmt->execute([
            ':uid' => $source['user_id'],
            ':cid' => $source['cluster_id'],
            ':name' => $source['name'],
            ':json' => $source['builder_json'],
            ':env' => $targetEnv,
            ':pid' => $parentId
        ]);
        $targetId = $pdo->lastInsertId();
    }

    echo json_encode([
        "status" => "success",
        "message" => "Workflow successfully pushed to " . ucfirst($targetEnv),
        "data" => [
            "id" => $targetId,
            "environment" => $targetEnv
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
