<?php
// backend/api/tasks.php - API REST Todo List

// Inclure la configuration
require_once __DIR__ . '/../config/db.php';

// Headers CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Parse requête
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        case 'GET':
            // Récupérer toutes les tâches
            $stmt = $pdo->query("
                SELECT 
                    id, 
                    title, 
                    completed,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
                FROM tasks 
                ORDER BY created_at DESC
            ");
            $tasks = $stmt->fetchAll();
            echo json_encode($tasks);
            break;

        case 'POST':
            // Créer une tâche
            $title = trim($input['title'] ?? '');
            
            if (empty($title)) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                exit();
            }
            
            $stmt = $pdo->prepare("INSERT INTO tasks (title, completed) VALUES (?, 0)");
            $stmt->execute([$title]);
            
            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$newId]);
            $task = $stmt->fetch();
            
            http_response_code(201);
            echo json_encode([
                'status' => 'success',
                'message' => 'Task created',
                'task' => $task
            ]);
            break;

        case 'PUT':
            // Mettre à jour
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                exit();
            }
            
            $taskId = (int)$input['id'];
            $updates = [];
            $params = [];
            
            if (isset($input['title'])) {
                $updates[] = 'title = ?';
                $params[] = trim($input['title']);
            }
            
            if (isset($input['completed'])) {
                $updates[] = 'completed = ?';
                $params[] = filter_var($input['completed'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit();
            }
            
            $params[] = $taskId;
            $sql = "UPDATE tasks SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Task not found']);
                exit();
            }
            
            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$taskId]);
            $task = $stmt->fetch();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task updated',
                'task' => $task
            ]);
            break;

        case 'DELETE':
            // Supprimer
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                exit();
            }
            
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Task not found']);
                exit();
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task deleted',
                'id' => $id
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
}
?>