// frontend/app.js - Todo List v2.0.0
const API_URL = 'http://localhost:8081/api.php';
let tasks = [];
let currentFilter = 'all';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    checkBackendStatus();
});

// Setup event listeners
function setupEventListeners() {
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', handleAddTask);
}

// Load tasks from API
async function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Chargement des tâches...</p></div>';
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check for API errors
        if (data.error) {
            throw new Error(data.error);
        }
        
        tasks = data;
        renderTasks();
        updateStats();
        hideError();
        updateBackendStatus(true);
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Impossible de charger les tâches. Vérifiez que le backend est démarré.');
        updateBackendStatus(false);
        
        // Show empty state
        document.getElementById('task-list').innerHTML = '';
        document.getElementById('empty-state').style.display = 'block';
    }
}

// Add new task
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
        
        if (!response.ok) {
            throw new Error('Échec de la création de la tâche');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Clear input
            input.value = '';
            
            // Reload tasks
            await loadTasks();
            hideError();
        } else {
            throw new Error(data.error || 'Réponse inattendue');
        }
        
    } catch (error) {
        console.error('Error adding task:', error);
        showError('Impossible d\'ajouter la tâche.');
    }
}

// Toggle task completion
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
        
        if (!response.ok) {
            throw new Error('Échec de la mise à jour');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Update local task
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = isCompleted ? 0 : 1;
            }
            
            // Re-render
            renderTasks();
            updateStats();
            hideError();
        } else {
            throw new Error(data.error || 'Mise à jour échouée');
        }
        
    } catch (error) {
        console.error('Error toggling task:', error);
        showError('Impossible de mettre à jour la tâche.');
    }
}

// Delete task
async function deleteTask(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?id=${id}`, { 
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Échec de la suppression');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Remove from local array
            tasks = tasks.filter(t => t.id !== id);
            
            // Re-render
            renderTasks();
            updateStats();
            hideError();
        } else {
            throw new Error(data.error || 'Suppression échouée');
        }
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Impossible de supprimer la tâche.');
    }
}

// Render tasks based on current filter
function renderTasks() {
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    
    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Render task HTML
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
                    ${task.completed ? '↩️ Réactiver' : '✓ Terminer'}
                </button>
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

// Update statistics
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

// Filter tasks
function filterTasks(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Re-render with filter
    renderTasks();
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorContainer.style.display = 'flex';
}

// Hide error message
function hideError() {
    const errorContainer = document.getElementById('error-container');
    errorContainer.style.display = 'none';
}

// Update backend status indicator
function updateBackendStatus(isOnline) {
    const statusIndicator = document.getElementById('backend-status');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (isOnline) {
        statusDot.style.background = 'var(--success)';
        statusText.textContent = 'Backend: Connecté';
    } else {
        statusDot.style.background = 'var(--danger)';
        statusText.textContent = 'Backend: Déconnecté';
    }
}

// Check backend status periodically
function checkBackendStatus() {
    setInterval(async () => {
        try {
            const response = await fetch(API_URL, { method: 'HEAD' });
            updateBackendStatus(response.ok);
        } catch (error) {
            updateBackendStatus(false);
        }
    }, 30000); // Check every 30 seconds
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global for onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.filterTasks = filterTasks;
window.hideError = hideError;