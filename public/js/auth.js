// API Base URL
const API_URL = 'http://localhost:3000/api';

// Utility functions
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function hideMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

// Save token to localStorage
function saveToken(token) {
    localStorage.setItem('authToken', token);
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('authToken');
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Register Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            preferences: document.getElementById('preferences').value.trim(),
            defaultDiners: parseInt(document.getElementById('defaultDiners').value)
        };

        // Client-side validation
        if (formData.password.length < 8) {
            showError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('¡Registro exitoso! Redirigiendo al login...');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showError(data.error?.message || 'Error al registrarse. Por favor, intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión. Por favor, verifica que el servidor esté corriendo.');
        }
    });
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const formData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                saveToken(data.token);
                showSuccess('¡Login exitoso! Redirigiendo...');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                showError(data.error?.message || 'Email o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión. Por favor, verifica que el servidor esté corriendo.');
        }
    });
}

// Logout function
function logout() {
    removeToken();
    window.location.href = '/index.html';
}

// Check authentication on protected pages
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
    }
}
