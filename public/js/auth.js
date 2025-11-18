// API Base URL - Use environment variable or default to localhost
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

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

// Save user data to localStorage
function saveUserData(user) {
    localStorage.setItem('userData', JSON.stringify(user));
}

// Get user data from localStorage
function getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
}

// Remove user data from localStorage
function removeUserData() {
    localStorage.removeItem('userData');
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Debe contener al menos una letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Debe contener al menos una letra mayúscula');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Debe contener al menos un número');
    }
    
    return errors;
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
        if (!formData.name || formData.name.length < 2) {
            showError('El nombre debe tener al menos 2 caracteres');
            return;
        }

        if (!isValidEmail(formData.email)) {
            showError('Por favor, ingresa un email válido');
            return;
        }

        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            showError(passwordErrors.join('. '));
            return;
        }

        if (formData.defaultDiners < 1 || formData.defaultDiners > 20) {
            showError('El número de comensales debe estar entre 1 y 20');
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
                saveUserData(data.user);
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
    removeUserData();
    window.location.href = '/index.html';
}

// Make API call with authentication
async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
        removeToken();
        removeUserData();
        window.location.href = '/login.html';
        throw new Error('Session expired');
    }
    
    return response;
}

// Check authentication on protected pages
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
    }
}
