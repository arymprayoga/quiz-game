// Admin Panel JavaScript Utilities

// Show alert messages
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertContainer.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto remove after duration
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.remove();
        }
    }, duration);
}

// Logout function
async function logout() {
    try {
        await fetch('/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin/login';
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// API request helper
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Table helper functions
function createTableRow(data, columns, actions = []) {
    const row = document.createElement('tr');
    
    // Add data columns
    columns.forEach(column => {
        const cell = document.createElement('td');
        
        if (typeof column === 'string') {
            cell.textContent = data[column] || '-';
        } else if (typeof column === 'function') {
            cell.innerHTML = column(data);
        } else if (typeof column === 'object') {
            if (column.type === 'date') {
                cell.textContent = formatDate(data[column.key]);
            } else if (column.type === 'badge') {
                cell.innerHTML = `<span class="badge bg-${column.color}">${data[column.key]}</span>`;
            } else {
                cell.textContent = data[column.key] || '-';
            }
        }
        
        row.appendChild(cell);
    });
    
    // Add actions column if provided
    if (actions.length > 0) {
        const actionsCell = document.createElement('td');
        actionsCell.className = 'action-buttons';
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `btn btn-sm btn-${action.type || 'primary'}`;
            button.innerHTML = action.icon ? `<i class="${action.icon}"></i> ${action.text}` : action.text;
            button.onclick = () => action.handler(data);
            actionsCell.appendChild(button);
        });
        
        row.appendChild(actionsCell);
    }
    
    return row;
}

function updateTable(tableId, data, columns, actions = []) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="${columns.length + (actions.length > 0 ? 1 : 0)}" class="text-center">No data found</td>`;
        tbody.appendChild(row);
        return;
    }
    
    data.forEach(item => {
        const row = createTableRow(item, columns, actions);
        tbody.appendChild(row);
    });
}

// Modal helper functions
function openModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) modal.hide();
}

// Form helper functions
function resetForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
    
    // Clear validation states
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });
    
    // Clear error messages
    form.querySelectorAll('.invalid-feedback').forEach(el => {
        el.textContent = '';
    });
}

function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    let isValid = true;
    
    for (const [fieldName, rule] of Object.entries(rules)) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (!field) continue;
        
        const value = field.value.trim();
        let fieldValid = true;
        let errorMessage = '';
        
        // Required validation
        if (rule.required && !value) {
            fieldValid = false;
            errorMessage = rule.requiredMessage || `${fieldName} is required`;
        }
        
        // Pattern validation
        if (fieldValid && rule.pattern && value && !rule.pattern.test(value)) {
            fieldValid = false;
            errorMessage = rule.patternMessage || `${fieldName} format is invalid`;
        }
        
        // Min length validation
        if (fieldValid && rule.minLength && value && value.length < rule.minLength) {
            fieldValid = false;
            errorMessage = rule.minLengthMessage || `${fieldName} must be at least ${rule.minLength} characters`;
        }
        
        // Custom validation
        if (fieldValid && rule.custom && value) {
            const customResult = rule.custom(value);
            if (customResult !== true) {
                fieldValid = false;
                errorMessage = customResult;
            }
        }
        
        // Update field state
        field.classList.remove('is-invalid', 'is-valid');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        
        if (!fieldValid) {
            field.classList.add('is-invalid');
            if (feedback) feedback.textContent = errorMessage;
            isValid = false;
        } else if (value) {
            field.classList.add('is-valid');
            if (feedback) feedback.textContent = '';
        }
    }
    
    return isValid;
}

// File upload helper
function setupFileUpload(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    const wrapper = display.parentElement;
    
    // Make wrapper clickable to trigger file input
    wrapper.addEventListener('click', function() {
        input.click();
    });
    
    // Handle file selection
    input.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            display.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            display.classList.add('has-file');
        } else {
            display.textContent = 'Click to select file or drag and drop';
            display.classList.remove('has-file');
        }
    });
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        wrapper.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    wrapper.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        wrapper.classList.add('dragover');
    }
    
    function unhighlight(e) {
        wrapper.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            input.files = files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// Export functions
async function exportData(endpoint, filename) {
    try {
        const response = await fetch(endpoint, { method: 'POST' });
        const result = await response.json();
        
        if (result.url) {
            // Create download link
            const link = document.createElement('a');
            link.href = result.url;
            link.download = filename || result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('Export completed successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        showAlert('Export failed: ' + error.message, 'danger');
    }
}

// Search and filter helpers
function setupTableSearch(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    input.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Setup tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    
    // Setup confirmation dialogs
    document.querySelectorAll('[data-confirm]').forEach(element => {
        element.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                e.preventDefault();
                return false;
            }
        });
    });
});