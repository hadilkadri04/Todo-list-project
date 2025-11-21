document.addEventListener('DOMContentLoaded', function () {
    const taskForm = document.getElementById('task-form');
    const newTaskInput = document.getElementById('new-task');
    const taskList = document.getElementById('task-list');

    // Charger les tâches depuis le backend (à implémenter plus tard)
    loadTasks();

    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            // Envoyer la tâche au backend (à implémenter plus tard)
            addTaskToBackend(taskText);
            newTaskInput.value = '';
        }
    });

    function loadTasks() {
        // À implémenter
        console.log("Chargement des tâches...");
    }

    function addTaskToBackend(taskText) {
        // À implémenter
        console.log("Ajout de la tâche:", taskText);
    }
});