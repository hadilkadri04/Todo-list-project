// frontend/js/app.js - Todo List v2.0.0

const API_URL = 'http://localhost:8085/api/tasks.php';
let tasks = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Todo List v2.0.0 initialized');
    loadTasks();
    setupEventListeners();
    checkBackendStatus();
});

function setupEventListeners() {
    document.getElementById('task-form').addEventListener('submit', handleAddTask);
}

async function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748B;">⏳ Chargement...</div>';
    
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
        console.error('❌ Error:', error);
        showError(`Impossible de charger les tâches: ${error.message}`);
        updateBackendStatus(false);
        document.getElementById('empty-state').style.display = 'block';
    }
}

async function handleAddTask(e) {
    e.preventDefault();
    
    const input = document.getElementById('new-task');
    const title = input.value.trim();
    if (!title) return;
    
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Ajout...';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.status === 'success' && data.task) {
            input.value = '';
            tasks.unshift(data.task);
            renderTasks();
            updateStats();
            hideError();
        }
    } catch (error) {
        console.error('❌ Add error:', error);
        showError(`Impossible d'ajouter: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'Ajouter';
    }
}

async function toggleTask(id, isCompleted) {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: id,
                completed: isCompleted ? 0 : 1
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.status === 'success' && data.task) {
            const index = tasks.findIndex(t => t.id === id);
            if (index !== -1) tasks[index] = data.task;
            renderTasks();
            updateStats();
            hideError();
        }
    } catch (error) {
        console.error('❌ Toggle error:', error);
        showError(`Erreur: ${error.message}`);
        setTimeout(loadTasks, 1000);
    }
}

async function deleteTask(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    
    try {
        const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.status === 'success') {
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
            updateStats();
            hideError();
        }
    } catch (error) {
        console.error('❌ Delete error:', error);
        showError(`Erreur: ${error.message}`);
        setTimeout(loadTasks, 1000);
    }
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    
    let filteredTasks = tasks;
    if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.completed);
    else if (currentFilter === 'completed') filteredTasks = tasks.filter(t => t.completed);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'block';
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
                <button class="btn-toggle" onclick="toggleTask(${task.id}, ${task.completed})" title="${task.completed ? 'Réactiver' : 'Terminer'}">
                    ${task.completed ? '↩️' : '✓'}
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})" title="Supprimer">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

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

function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    document.getElementById('error-text').textContent = message;
    errorContainer.style.display = 'flex';
}

function hideError() {
    document.getElementById('error-container').style.display = 'none';
}

function updateBackendStatus(isOnline) {
    const statusIndicator = document.getElementById('backend-status');
    const dot = statusIndicator.querySelector('.status-dot');
    const text = statusIndicator.querySelector('.status-text');
    
    if (isOnline) {
        dot.style.background = '#B5EAD7';
        dot.style.boxShadow = '0 0 5px #B5EAD7';
        text.textContent = 'Backend: Connecté';
        text.style.color = '#2F855A';
    } else {
        dot.style.background = '#FFB7B2';
        dot.style.boxShadow = '0 0 5px #FFB7B2';
        text.textContent = 'Backend: Déconnecté';
        text.style.color = '#9B2C2C';
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

// Global functions
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.filterTasks = filterTasks;
window.hideError = hideError;