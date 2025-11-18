// Require authentication
requireAuth();

let currentUserId = null;

// Load user profile data
async function loadProfile() {
    try {
        const userData = getUserData();
        if (!userData || !userData.id) {
            throw new Error('No user data found');
        }

        currentUserId = userData.id;

        const response = await authenticatedFetch(`${API_URL}/users/${currentUserId}`);
        const data = await response.json();

        if (response.ok) {
            // Populate profile form
            document.getElementById('name').value = data.user.name || '';
            document.getElementById('email').value = data.user.email || '';
            document.getElementById('defaultDiners').value = data.user.defaultDiners || 1;
            
            // Populate preferences form
            document.getElementById('preferences').value = data.user.preferences || '';
        } else {
            showMessage('profileMessage', data.error?.message || 'Error al cargar perfil', 'error');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('profileMessage', 'Error al cargar perfil', 'error');
    }
}

// Show message in specific container
function showMessage(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = message;
        container.className = `message ${type}`;
        container.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }
}

// Update profile form handler
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            defaultDiners: parseInt(document.getElementById('defaultDiners').value)
        };

        // Validation
        if (!formData.name || formData.name.length < 2) {
            showMessage('profileMessage', 'El nombre debe tener al menos 2 caracteres', 'error');
            return;
        }

        if (!isValidEmail(formData.email)) {
            showMessage('profileMessage', 'Por favor, ingresa un email válido', 'error');
            return;
        }

        if (formData.defaultDiners < 1 || formData.defaultDiners > 20) {
            showMessage('profileMessage', 'El número de comensales debe estar entre 1 y 20', 'error');
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_URL}/users/${currentUserId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Update stored user data
                saveUserData(data.user);
                showMessage('profileMessage', '¡Perfil actualizado exitosamente!', 'success');
            } else {
                showMessage('profileMessage', data.error?.message || 'Error al actualizar perfil', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('profileMessage', 'Error de conexión', 'error');
        }
    });
}

// Update preferences form handler
const preferencesForm = document.getElementById('preferencesForm');
if (preferencesForm) {
    preferencesForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const preferences = document.getElementById('preferences').value.trim();

        try {
            const response = await authenticatedFetch(`${API_URL}/users/${currentUserId}/preferences`, {
                method: 'PUT',
                body: JSON.stringify({ preferences })
            });

            const data = await response.json();

            if (response.ok) {
                // Update stored user data
                saveUserData(data.user);
                showMessage('preferencesMessage', '¡Preferencias actualizadas exitosamente!', 'success');
            } else {
                showMessage('preferencesMessage', data.error?.message || 'Error al actualizar preferencias', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('preferencesMessage', 'Error de conexión', 'error');
        }
    });
}

// Delete account function
async function deleteAccount() {
    if (!confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        return;
    }

    if (!confirm('¿Realmente deseas eliminar tu cuenta? Se perderán todos tus datos.')) {
        return;
    }

    try {
        const response = await authenticatedFetch(`${API_URL}/users/${currentUserId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Cuenta eliminada exitosamente');
            logout();
        } else {
            const data = await response.json();
            alert(data.error?.message || 'Error al eliminar cuenta');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', loadProfile);
