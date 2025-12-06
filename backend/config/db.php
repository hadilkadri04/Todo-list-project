<?php
// backend/config/db.php - Configuration MySQL

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Configuration depuis les variables d'environnement
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
        error_log("✅ Database connected");
        break;
        
    } catch (PDOException $e) {
        error_log("❌ Connection attempt " . ($i + 1) . " failed: " . $e->getMessage());
        
        if ($i < $maxRetries - 1) {
            sleep($retryDelay);
        } else {
            header('Content-Type: application/json');
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
    
    // Ajouter des données de démo si vide
    $count = $pdo->query("SELECT COUNT(*) FROM tasks")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("
            INSERT INTO tasks (title, completed) VALUES
            ('Bienvenue dans votre Todo List! 🎉', 0),
            ('Configurer Docker et Jenkins', 0),
            ('Créer les 3 pipelines CI/CD', 0),
            ('Tester les workflows Git', 0),
            ('Préparer la présentation', 0)
        ");
    }
} catch (PDOException $e) {
    error_log("Table creation warning: " . $e->getMessage());
}
?>