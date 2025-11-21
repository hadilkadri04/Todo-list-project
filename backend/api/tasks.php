<?php
// backend/api/tasks.php

// Inclure la configuration de la base de données
require_once '../config/db.php';

// Définir le type de contenu comme JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permettre les requêtes depuis n'importe quelle origine (utile pour le dev local, à restreindre en prod)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Récupérer la méthode HTTP de la requête
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Récupérer toutes les tâches
        try {
            $stmt = $pdo->query("SELECT id, title, completed, created_at FROM tasks ORDER BY created_at DESC");
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($tasks);
        } catch (PDOException $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Créer une nouvelle tâche
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['title']) && !empty(trim($input['title']))) {
            try {
                $stmt = $pdo->prepare("INSERT INTO tasks (title) VALUES (?)");
                $stmt->execute([trim($input['title'])]);
                echo json_encode(['status' => 'success', 'message' => 'Task added successfully.']);
            } catch (PDOException $e) {
                echo json_encode(['error' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required.']);
        }
        break;

    case 'PUT':
        // Mettre à jour une tâche (ex: marquer comme complétée)
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['id']) && isset($input['completed'])) {
            try {
                $stmt = $pdo->prepare("UPDATE tasks SET completed = ? WHERE id = ?");
                $stmt->execute([$input['completed'], $input['id']]);
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['status' => 'success', 'message' => 'Task updated successfully.']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
                }
            } catch (PDOException $e) {
                echo json_encode(['error' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID and Completed status are required.']);
        }
        break;

    case 'DELETE':
        // Supprimer une tâche
        $id = $_GET['id'] ?? null;
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['status' => 'success', 'message' => 'Task deleted successfully.']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'Task not found.']);
                }
            } catch (PDOException $e) {
                echo json_encode(['error' => $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Task ID is required.']);
        }
        break;

    default:
        // Méthode non autorisée
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
        break;
}