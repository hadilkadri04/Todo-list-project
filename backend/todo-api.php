<?php
// backend/api.php - API REST Todo List (MySQL Compatible)

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php-error.log');

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

// Configuration base de données
$host = getenv('DB_HOST') ?: 'db';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'todolist';
$user = getenv('DB_USER') ?: 'devops';
$pass = getenv('DB_PASS') ?: 'securepassword';

// Connexion avec retry
$maxRetries = 10;
$retryDelay = 2;
$pdo = null;

for ($i = 0; $i < $maxRetries; $i++) {
    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $user, $pass, $options);
        error_log("✅ Database connected successfully");
        break;
        
    } catch (PDOException $e) {
        error_log("❌ DB connection attempt " . ($i + 1) . " failed: " . $e->getMessage());
        
        if ($i < $maxRetries - 1) {
            sleep($retryDelay);
        } else {
            http_response_code(503);
            echo json_encode([
                'error' => 'Database unavailable',
                'message' => 'Could not connect after ' . $maxRetries . ' attempts'
            ]);
            exit();
        }
    }
}

// Créer la table si elle n'existe pas
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            completed TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_completed (completed),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Ajouter des tâches de démo si la table est vide
    $count = $pdo->query("SELECT COUNT(*) FROM tasks")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("
            INSERT INTO tasks (title, completed) VALUES
            ('Bienvenue dans votre Todo List! 🎉', 0),
            ('Configurer le pipeline Jenkins', 0),
            ('Tester les 3 workflows Git', 0),
            ('Créer la présentation PowerPoint', 0),
            ('Préparer la démonstration', 0)
        ");
        error_log("✅ Demo tasks inserted");
    }
} catch (PDOException $e) {
    error_log("⚠️ Table creation warning: " . $e->getMessage());
}

// Parse la requête
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Router
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
            
            error_log("📋 GET: Returning " . count($tasks) . " tasks");
            echo json_encode($tasks);
            break;

        case 'POST':
            // Créer une nouvelle tâche
            $title = trim($input['title'] ?? '');
            
            if (empty($title)) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                exit();
            }
            
            $stmt = $pdo->prepare("INSERT INTO tasks (title, completed) VALUES (?, 0)");
            $stmt->execute([$title]);
            
            $newId = $pdo->lastInsertId();
            
            // Récupérer la tâche créée
            $stmt = $pdo->prepare("
                SELECT 
                    id, 
                    title, 
                    completed,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
                FROM tasks 
                WHERE id = ?
            ");
            $stmt->execute([$newId]);
            $task = $stmt->fetch();
            
            http_response_code(201);
            error_log("✅ POST: Task created - ID: $newId, Title: $title");
            echo json_encode([
                'status' => 'success',
                'message' => 'Task created successfully',
                'task' => $task
            ]);
            break;

        case 'PUT':
            // Mettre à jour une tâche
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Task ID is required']);
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
            
            // Récupérer la tâche mise à jour
            $stmt = $pdo->prepare("
                SELECT 
                    id, 
                    title, 
                    completed,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
                FROM tasks 
                WHERE id = ?
            ");
            $stmt->execute([$taskId]);
            $task = $stmt->fetch();
            
            error_log("✅ PUT: Task updated - ID: $taskId");
            echo json_encode([
                'status' => 'success',
                'message' => 'Task updated successfully',
                'task' => $task
            ]);
            break;

        case 'DELETE':
            // Supprimer une tâche
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Task ID is required']);
                exit();
            }
            
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Task not found']);
                exit();
            }
            
            error_log("🗑️ DELETE: Task deleted - ID: $id");
            echo json_encode([
                'status' => 'success',
                'message' => 'Task deleted successfully',
                'id' => $id
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    error_log("❌ Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Database operation failed',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("❌ General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
?>