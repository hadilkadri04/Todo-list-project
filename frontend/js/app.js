// frontend/script.js
// ✅ Backend endpoint (as exposed by docker-compose: backend on port 8081)
const API_URL = 'http://localhost:8081/api.php';

document.addEventListener('DOMContentLoaded', function () {
    const taskForm = document.getElementById('task-form');
    const newTaskInput = document.getElementById('new-task');
    const taskList = document.getElementById('task-list');

    // Charger les tâches au démarrage
    loadTasks();

    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            addTask(taskText);
            newTaskInput.value = '';
        }
    });

    // === API Functions ===

    function loadTasks() {
        taskList.innerHTML = '<p>Chargement...</p>';
        fetch(API_URL)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(tasks => {
                taskList.innerHTML = '';
                if (tasks.error) {
                    taskList.innerHTML = `<p class="error">⚠️ ${tasks.error}</p>`;
                    return;
                }
                if (tasks.length === 0) {
                    taskList.innerHTML = '<p>Aucune tâche.</p>';
                    return;
                }
                tasks.forEach(task => addTaskToDOM(task));
            })
            .catch(error => {
                console.error('❌ Erreur chargement tâches:', error);
                taskList.innerHTML = `<p class="error">❌ Erreur réseau ou API indisponible.</p>`;
            });
    }

    function addTask(title) {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'created' && data.id) {
                loadTasks();
            } else {
                throw new Error(data.error || 'Réponse inattendue');
            }
        })
        .catch(error => {
            console.error('❌ Erreur ajout tâche:', error);
            alert(`Échec ajout : ${error.message}`);
        });
    }

    function toggleTask(id, isDone) {
        fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, done: !isDone })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'updated') {
                loadTasks();
            } else {
                throw new Error(data.error || 'Mise à jour échouée');
            }
        })
        .catch(error => {
            console.error('❌ Erreur toggle tâche:', error);
            alert(`Échec mise à jour : ${error.message}`);
        });
    }

    function deleteTask(id) {
        fetch(`${API_URL}?id=${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'deleted') {
                loadTasks();
            } else {
                throw new Error(data.error || 'Suppression échouée');
            }
        })
        .catch(error => {
            console.error('❌ Erreur suppression tâche:', error);
            alert(`Échec suppression : ${error.message}`);
        });
    }

    // === DOM Functions ===

    function addTaskToDOM(task) {
        const div = document.createElement('div');
        div.className = `task ${task.done ? 'completed' : ''}`;
        div.innerHTML = `
            <span>${escapeHtml(task.title)}</span>
            <div class="task-actions">
                <button class="btn-toggle" onclick="toggleTask(${task.id}, ${task.done})">
                    ${task.done ? '↩️ Annuler' : '✅ Terminer'}
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">🗑️ Supprimer</button>
            </div>
        `;
        taskList.appendChild(div);
    }

    // 🔒 Sécurité : échapper le HTML (évite XSS basique)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ✅ Exposer les fonctions globalement (nécessaire pour onclick inline)
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
});