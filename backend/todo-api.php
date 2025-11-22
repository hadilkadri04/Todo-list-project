<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ✅ MySQL connection via environment variables
$host = getenv('DB_HOST') ?: 'db';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'todolist';
$user = getenv('DB_USER') ?: 'devops';
$pass = getenv('DB_PASS') ?: 'securepassword';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed", "detail" => $e->getMessage()]);
    exit;
}

// ✅ Create table if not exists (idempotent)
$pdo->exec("
    CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        done BOOLEAN NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

// Seed initial data (only if empty)
$taskCount = $pdo->query("SELECT COUNT(*) FROM tasks")->fetchColumn();
if ($taskCount == 0) {
    $stmt = $pdo->prepare("INSERT INTO tasks (title, done) VALUES (?, ?), (?, ?)");
    $stmt->execute(['Acheter du pain', false, 'Réviser DevOps', true]);
}

// Helper: get JSON input
function getJsonInput() {
    $json = file_get_contents('php://input');
    return $json ? json_decode($json, true) : [];
}

$action = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($action) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch();
                if ($task) {
                    echo json_encode($task);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Task not found"]);
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM tasks ORDER BY created_at DESC");
                echo json_encode($stmt->fetchAll());
            }
            break;

        case 'POST':
            $input = getJsonInput();
            $title = trim($input['title'] ?? '');
            if (!$title) {
                http_response_code(400);
                echo json_encode(["error" => "Task title is required"]);
                exit;
            }
            $stmt = $pdo->prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
            $stmt->execute([$title, false]);
            echo json_encode(["status" => "created", "id" => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "Task ID required"]);
                break;
            }
            $input = getJsonInput();
            $done = filter_var($input['done'] ?? null, FILTER_VALIDATE_BOOLEAN);
            $stmt = $pdo->prepare("UPDATE tasks SET done = ? WHERE id = ?");
            $updated = $stmt->execute([$done, $id]);
            echo json_encode(["status" => $updated ? "updated" : "no change"]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "Task ID required"]);
                break;
            }
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $deleted = $stmt->execute([$id]);
            echo json_encode(["status" => $deleted ? "deleted" : "not found"]);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed", "detail" => $e->getMessage()]);
}
?>