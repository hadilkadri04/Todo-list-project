<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Retourner une liste de tâches (ex: en dur pour le moment)
    $tasks = [
        ['id' => 1, 'text' => 'Première tâche'],
        ['id' => 2, 'text' => 'Deuxième tâche'],
    ];
    echo json_encode($tasks);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $task = $input['task'] ?? null;
    if ($task) {
        // Ici, vous pouvez sauvegarder dans une base de données
        echo json_encode(['status' => 'success', 'task' => $task]);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Task is required']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?> 
