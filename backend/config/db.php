<?php
// backend/config/db.php

// Chemin vers la base de données SQLite
$dbPath = __DIR__ . '/../data/tasks.db';

// Créer le dossier data s'il n'existe pas
$dataDir = dirname($dbPath);
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

try {
    // Connexion à la base de données SQLite
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Création de la table tasks si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // echo "Connexion à la base de données réussie.\n"; // Utile pour déboguer localement

} catch (PDOException $e) {
    // En cas d'erreur, on affiche un message JSON pour que le frontend puisse le comprendre
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}