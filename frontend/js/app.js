// frontend/js/app.js

// Ajustez cette URL selon l'adresse de votre backend (dans le conteneur ou en local)
const API_URL = 'http://localhost:8080/api/tasks.php'; // Modifiez si nécessaire (IP du conteneur, port, etc.)

document.addEventListener('DOMContentLoaded', function () {
    const taskForm = document.getElementById('task-form');
    const newTaskInput = document.getElementById('new-task');
    const taskList = document.getElementById('task-list');

    // Charger les tâches au démarrage
    loadTasks();

    // Gestion de l'ajout d'une tâche
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            addTask(taskText);
            newTaskInput.value = '';
        }
    });

    // Fonction pour charger les tâches depuis le backend
    function loadTasks() {
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(tasks => {
                taskList.innerHTML = ''; // Effacer la liste actuelle
                tasks.forEach(task => {
                    addTaskToDOM(task);
                });
            })
            .catch(error => {
                console.error('Erreur lors du chargement des tâches:', error);
                taskList.innerHTML = '<p class="error">Erreur de chargement des tâches.</p>';
            });
    }

    // Fonction pour ajouter une tâche à l'interface
    function addTaskToDOM(task) {
        const div = document.createElement('div');
        div.className = `task ${task.completed ? 'completed' : ''}`;
        div.dataset.id = task.id; // Stocker l'ID dans un attribut data
        div.innerHTML = `
            <span>${task.title}</span>
            <div class="task-actions">
                <button class="toggle-btn" onclick="toggleTask(${task.id}, ${task.completed})">${task.completed ? 'Undo' : 'Done'}</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        taskList.appendChild(div);
    }

    // Fonction pour envoyer une tâche au backend
    function addTask(title) {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                loadTasks(); // Recharger la liste après ajout
            } else {
                console.error('Erreur backend:', data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Erreur réseau:', error);
        });
    }

    // Fonction globale pour marquer une tâche comme faite/non-faite
    window.toggleTask = function (id, isCompleted) {
        fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, completed: !isCompleted })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                loadTasks(); // Recharger la liste après modification
            } else {
                console.error('Erreur backend:', data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Erreur réseau:', error);
        });
    };

    // Fonction globale pour supprimer une tâche
    window.deleteTask = function (id) {
        fetch(`${API_URL}?id=${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                loadTasks(); // Recharger la liste après suppression
            } else {
                console.error('Erreur backend:', data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Erreur réseau:', error);
        });
    };
});