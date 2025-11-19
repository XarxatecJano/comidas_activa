// API Error Handler Module
// Centralizes API calls and error handling for the frontend

// Error notification system
class ErrorNotification {
    constructor() {
        this.container = null;
        this.createContainer();
    }

    createContainer() {
        // Check if container already exists
        if (document.getElementById('globalErrorNotification')) {
            this.container = document.getElementById('globalErrorNotification');
            return;
        }

        // Create notification container
        this.container = document.createElement('div');
        this.container.id = 'globalErrorNotification';
        this.container.className = 'global-notification';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: none;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(this.container);
    }

    show(message, type = 'error', duration = 5000) {
        const colors = {
            error: { bg: '#ffe5e5', text: '#cf2e2e', border: '#cf2e2e' },
            success: { bg: '#e5f9f0', text: '#00d084', border: '#00d084' },
            warning: { bg: '#fff8e1', text: '#fcb900', border: '#fcb900' },
            info: { bg: '#e3f2fd', text: '#0693e3', border: '#0693e3' }
        };

        const color = colors[type] || colors.error;

        this.container.style.backgroundColor = color.bg;
        this.container.style.color = color.text;
        this.container.style.borderLeft = `4px solid ${color.border}`;
        this.container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2em;">${this.getIcon(type)}</span>
                <span style="flex: 1;">${message}</span>
                <button onclick="errorNotification.hide()" style="
                    background: none;
                    border: none;
                    color: ${color.text};
                    font-size: 1.2em;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                ">×</button>
            </div>
        `;
        this.container.style.display = 'block';

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => this.hide(), duration);
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    getIcon(type) {
        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.error;
    }
}

// Create global instance
const errorNotification = new ErrorNotification();

// Show error notification (global function)
function showErrorNotification(message, duration = 5000) {
    errorNotification.show(message, 'error', duration);
}

// Show success notification (global function)
function showSuccessNotification(message, duration = 3000) {
    errorNotification.show(message, 'success', duration);
}

// Show warning notification (global function)
function showWarningNotification(message, duration = 4000) {
    errorNotification.show(message, 'warning', duration);
}

// Show info notification (global function)
function showInfoNotification(message, duration = 3000) {
    errorNotification.show(message, 'info', duration);
}

// API Error Handler
class APIError extends Error {
    constructor(message, statusCode, errorCode, details = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
    }
}

// Network Error Handler
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

// Centralized API call handler
async function handleApiCall(apiFunction, options = {}) {
    const {
        showLoading = false,
        loadingMessage = 'Cargando...',
        successMessage = null,
        errorMessage = null,
        retryOnAIError = false,
        maxRetries = 2,
        onSuccess = null,
        onError = null
    } = options;

    let retries = 0;

    while (retries <= maxRetries) {
        try {
            // Show loading if requested
            if (showLoading && retries === 0) {
                showInfoNotification(loadingMessage, 0);
            }

            // Execute API function
            const result = await apiFunction();

            // Hide loading notification
            if (showLoading) {
                errorNotification.hide();
            }

            // Show success message if provided
            if (successMessage) {
                showSuccessNotification(successMessage);
            }

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(result);
            }

            return { success: true, data: result };

        } catch (error) {
            console.error('API Error:', error);

            // Check if it's an AI error and we should retry
            const isAIError = error instanceof APIError && 
                             (error.errorCode === 'AI_ERROR' || 
                              error.message.includes('IA') ||
                              error.message.includes('ChatGPT'));

            if (isAIError && retryOnAIError && retries < maxRetries) {
                retries++;
                showWarningNotification(`Reintentando... (${retries}/${maxRetries})`, 2000);
                await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
                continue;
            }

            // Hide loading notification
            if (showLoading) {
                errorNotification.hide();
            }

            // Determine error message
            let displayMessage = errorMessage || getErrorMessage(error);

            // Show error notification
            showErrorNotification(displayMessage);

            // Call error callback if provided
            if (onError) {
                onError(error);
            }

            return { success: false, error };
        }
    }
}

// Get user-friendly error message
function getErrorMessage(error) {
    // Network errors
    if (error instanceof NetworkError || error.message.includes('Failed to fetch')) {
        return 'Error de conexión. Por favor, verifica tu conexión a internet y que el servidor esté corriendo.';
    }

    // API errors
    if (error instanceof APIError) {
        switch (error.statusCode) {
            case 400:
                return error.message || 'Datos inválidos. Por favor, verifica la información ingresada.';
            case 401:
                return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
            case 403:
                return 'No tienes permisos para realizar esta acción.';
            case 404:
                return 'Recurso no encontrado.';
            case 429:
                return 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.';
            case 500:
                if (error.errorCode === 'AI_ERROR') {
                    return 'Error al comunicarse con la IA. Por favor, intenta de nuevo.';
                }
                return 'Error del servidor. Por favor, intenta de nuevo más tarde.';
            default:
                return error.message || 'Ha ocurrido un error inesperado.';
        }
    }

    // Generic errors
    return error.message || 'Ha ocurrido un error inesperado.';
}

// Enhanced authenticatedFetch with better error handling
async function enhancedAuthenticatedFetch(url, options = {}) {
    const token = getToken();
    
    if (!token) {
        throw new APIError('No se encontró token de autenticación', 401, 'AUTH_ERROR');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Handle different status codes
        if (response.status === 401) {
            removeToken();
            removeUserData();
            window.location.href = '/login.html';
            throw new APIError('Sesión expirada', 401, 'AUTH_ERROR');
        }
        
        // Try to parse JSON response
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // If response is not JSON, create error object
            data = { error: { message: 'Respuesta inválida del servidor' } };
        }
        
        // If response is not ok, throw APIError
        if (!response.ok) {
            throw new APIError(
                data.error?.message || 'Error en la solicitud',
                response.status,
                data.error?.code || 'UNKNOWN_ERROR',
                data.error?.details
            );
        }
        
        return data;
        
    } catch (error) {
        // If it's already an APIError, rethrow it
        if (error instanceof APIError) {
            throw error;
        }
        
        // Network error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new NetworkError('Error de conexión con el servidor');
        }
        
        // Unknown error
        throw new APIError(error.message, 500, 'UNKNOWN_ERROR');
    }
}

// Retry wrapper for AI operations
async function retryAIOperation(operation, maxRetries = 2) {
    return handleApiCall(operation, {
        retryOnAIError: true,
        maxRetries,
        errorMessage: 'Error al comunicarse con la IA después de varios intentos'
    });
}

// Export functions to global scope
window.errorNotification = errorNotification;
window.showErrorNotification = showErrorNotification;
window.showSuccessNotification = showSuccessNotification;
window.showWarningNotification = showWarningNotification;
window.showInfoNotification = showInfoNotification;
window.handleApiCall = handleApiCall;
window.enhancedAuthenticatedFetch = enhancedAuthenticatedFetch;
window.retryAIOperation = retryAIOperation;
window.APIError = APIError;
window.NetworkError = NetworkError;
