<?php
// backend/index.php

// Option 1: Rediriger vers l'API
// header('Location: api/tasks.php');
// exit;

// Option 2: Afficher un message simple
echo "<h1>Backend de la Todo List est actif.</h1>";
echo "<p>Accédez à l'API via <a href='api/tasks.php'>/api/tasks.php</a></p>";
?>