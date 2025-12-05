// frontend/app.js - Todo List v2.0.0 (Vibrant Edition)
const API_URL = 'http://localhost:8081/api.php';
let tasks = [];
let currentFilter = 'all';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    checkBackendStatus();
});

function setupEventListeners() {
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', handleAddTask);
}

// Chargement des tâches
async function loadTasks() {
    const taskList = document.getElementById('task-list');
    // Loader avec ton nouveau style
    taskList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>🔮 Chargement de vos tâches magiques...</p>
        </div>`;
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        tasks = data;
        renderTasks();
        updateStats();
        hideError();
        updateBackendStatus(true);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Impossible de charger les tâches. Le backend semble éteint 😴');
        updateBackendStatus(false);
        taskList.innerHTML = '';
        document.getElementById('empty-state').style.display = 'block';
    }
}

// Ajouter une tâche
async function handleAddTask(e) {
    e.preventDefault();
    const input = document.getElementById('new-task');
    const title = input.value.trim();
    
    if (!title) return;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            input.value = '';
            await loadTasks();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showError('Oups ! Impossible d\'ajouter la tâche 🌪️');
    }
}

// Basculer l'état (Terminé/En cours)
async function toggleTask(id, isCompleted) {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, completed: isCompleted ? 0 : 1 })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            const task = tasks.find(t => t.id === id);
            if (task) task.completed = isCompleted ? 0 : 1;
            renderTasks();
            updateStats();
        }
    } catch (error) {
        showError('Impossible de mettre à jour la tâche 🔒');
    }
}

// Supprimer une tâche
async function deleteTask(id) {
    if (!confirm('Voulez-vous vraiment faire disparaître cette tâche ? ✨')) return;
    
    try {
        const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.status === 'success') {
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
            updateStats();
        }
    } catch (error) {
        showError('La suppression a échoué 🛑');
    }
}

// Affichage des tâches (Rendu HTML compatible avec ton CSS)
function renderTasks() {
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    
    let filteredTasks = tasks;
    if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.completed);
    else if (currentFilter === 'completed') filteredTasks = tasks.filter(t => t.completed);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'block';
        // Mise à jour du texte vide selon le filtre
        const emptyTitle = document.querySelector('#empty-state h3');
        if(currentFilter === 'completed') emptyTitle.textContent = "Aucune tâche terminée 💤";
        else if(currentFilter === 'active') emptyTitle.textContent = "Aucune tâche en cours 🎉";
        else emptyTitle.textContent = "🎈 Aucune tâche pour le moment !";
        return;
    }
    
    emptyState.style.display = 'none';
    
    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-content">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTask(${task.id}, ${task.completed})"
                >
                <span class="task-title">${escapeHtml(task.title)}</span>
            </div>
            <div class="task-actions">
                <button class="btn-toggle" onclick="toggleTask(${task.id}, ${task.completed})">
                    ${task.completed ? '↩️' : '✨'}
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// Mettre à jour les statistiques
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    document.getElementById('total-count').textContent = total;
    document.getElementById('active-count').textContent = active;
    document.getElementById('completed-count').textContent = completed;
    
    document.getElementById('filter-all-count').textContent = total;
    document.getElementById('filter-active-count').textContent = active;
    document.getElementById('filter-completed-count').textContent = completed;
}

// Filtrer
function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) btn.classList.add('active');
    });
    renderTasks();
}

function showError(message) {
    const container = document.getElementById('error-container');
    document.getElementById('error-text').textContent = message;
    container.style.display = 'flex';
}

function hideError() {
    document.getElementById('error-container').style.display = 'none';
}

// Indicateur de statut avec Emojis
function updateBackendStatus(isOnline) {
    const indicator = document.getElementById('backend-status');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');
    
    if (isOnline) {
        dot.style.background = 'var(--success)';
        dot.style.boxShadow = '0 0 15px var(--success)';
        text.textContent = '🟢 Backend Connecté';
    } else {
        dot.style.background = 'var(--danger)';
        dot.style.boxShadow = '0 0 15px var(--danger)';
        text.textContent = '🔴 Backend Déconnecté';
    }
}

function checkBackendStatus() {
    setInterval(async () => {
        try {
            const response = await fetch(API_URL, { method: 'HEAD' });
            updateBackendStatus(response.ok);
        } catch {
            updateBackendStatus(false);
        }
    }, 30000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exposition globale
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.filterTasks = filterTasks;
window.hideError = hideError;