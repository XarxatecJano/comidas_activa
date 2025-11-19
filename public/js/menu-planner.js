// Require authentication
requireAuth();

let currentMenuPlan = null;

// Set minimum date to today and load user defaults
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').setAttribute('min', today);
    document.getElementById('endDate').setAttribute('min', today);
    
    // Update end date minimum when start date changes
    document.getElementById('startDate').addEventListener('change', (e) => {
        document.getElementById('endDate').setAttribute('min', e.target.value);
    });
    
    // Setup "Select All Days" functionality
    setupSelectAllDays();
    
    // Load user's default diners
    loadUserDefaults();
});

// Setup select all days checkbox
function setupSelectAllDays() {
    const selectAllCheckbox = document.getElementById('selectAllDays');
    const dayCheckboxes = document.querySelectorAll('input[name="days"]');
    
    if (selectAllCheckbox && dayCheckboxes.length > 0) {
        // Handle select all checkbox change
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            dayCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
        
        // Handle individual day checkbox changes to update select all state
        dayCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(dayCheckboxes).every(cb => cb.checked);
                const someChecked = Array.from(dayCheckboxes).some(cb => cb.checked);
                
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = someChecked && !allChecked;
            });
        });
    }
}

// Load user's default settings
async function loadUserDefaults() {
    try {
        const userData = getUserData();
        if (userData && userData.id) {
            const response = await authenticatedFetch(`${API_URL}/users/${userData.id}`);
            const data = await response.json();
            
            if (response.ok && data.user.defaultDiners) {
                document.getElementById('defaultDiners').value = data.user.defaultDiners;
            }
        }
    } catch (error) {
        console.error('Error loading user defaults:', error);
        // Continue with default value if error
    }
}

// Menu plan form handler
const menuPlanForm = document.getElementById('menuPlanForm');
if (menuPlanForm) {
    menuPlanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const defaultDiners = parseInt(document.getElementById('defaultDiners').value);
        
        const daysCheckboxes = document.querySelectorAll('input[name="days"]:checked');
        const days = Array.from(daysCheckboxes).map(cb => cb.value);
        
        const mealTypesCheckboxes = document.querySelectorAll('input[name="mealTypes"]:checked');
        const mealTypes = Array.from(mealTypesCheckboxes).map(cb => cb.value);
        
        // Validation
        if (!startDate || !endDate) {
            showPlanMessage('Por favor, selecciona las fechas', 'error');
            return;
        }
        
        if (days.length === 0) {
            showPlanMessage('Por favor, selecciona al menos un día', 'error');
            return;
        }
        
        if (mealTypes.length === 0) {
            showPlanMessage('Por favor, selecciona al menos un tipo de comida', 'error');
            return;
        }
        
        if (!defaultDiners || defaultDiners < 1 || defaultDiners > 20) {
            showPlanMessage('El número de comensales debe estar entre 1 y 20', 'error');
            return;
        }
        
        // Show loading
        toggleLoading(true);
        
        try {
            const response = await authenticatedFetch(`${API_URL}/menu-plans`, {
                method: 'POST',
                body: JSON.stringify({
                    startDate,
                    endDate,
                    days,
                    mealTypes,
                    customDiners: defaultDiners
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentMenuPlan = data.menuPlan;
                displayMenuPlan(data.menuPlan);
                showPlanMessage('¡Planificación generada exitosamente!', 'success');
            } else {
                showPlanMessage(data.error?.message || 'Error al generar planificación', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showPlanMessage('Error de conexión', 'error');
        } finally {
            toggleLoading(false);
        }
    });
}

// Show/hide loading state
function toggleLoading(isLoading) {
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    const submitBtn = menuPlanForm.querySelector('button[type="submit"]');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show message
function showPlanMessage(message, type = 'success') {
    const container = document.getElementById('planMessage');
    if (container) {
        container.textContent = message;
        container.className = `message ${type}`;
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }
}

// Display menu plan using MealCard components
function displayMenuPlan(menuPlan) {
    const resultDiv = document.getElementById('menuPlanResult');
    const mealsContainer = document.getElementById('mealsContainer');
    
    if (!resultDiv || !mealsContainer) return;
    
    // Clear previous content and meal cards
    mealsContainer.innerHTML = '';
    mealCards.clear();
    
    // Create MealCard for each meal
    menuPlan.meals.forEach(meal => {
        const mealCard = new MealCard(meal, menuPlan.id, (updatedMeal) => {
            // Update the meal in currentMenuPlan
            const mealIndex = currentMenuPlan.meals.findIndex(m => m.id === updatedMeal.id);
            if (mealIndex !== -1) {
                currentMenuPlan.meals[mealIndex] = updatedMeal;
            }
        });
        
        // Store reference to meal card
        mealCards.set(meal.id, mealCard);
        
        // Render and append to container
        mealsContainer.appendChild(mealCard.render());
    });
    
    resultDiv.style.display = 'block';
}

// Confirm plan
async function confirmPlan() {
    if (!currentMenuPlan) {
        showPlanMessage('No hay planificación para confirmar', 'error');
        return;
    }
    
    // Ask for confirmation
    if (!confirm('¿Deseas confirmar esta planificación? Una vez confirmada, no podrás editarla.')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/menu-plans/${currentMenuPlan.id}/confirm`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update current menu plan status
            currentMenuPlan.status = 'confirmed';
            
            // Show success message
            showPlanMessage('¡Planificación confirmada exitosamente!', 'success');
            
            // Disable editing
            disableEditing();
            
            // Show shopping list button
            showShoppingListButton();
        } else {
            showPlanMessage(data.error?.message || 'Error al confirmar planificación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showPlanMessage('Error de conexión', 'error');
    }
}

// Disable editing after confirmation
function disableEditing() {
    // Disable all edit and regenerate buttons in meal cards
    const editButtons = document.querySelectorAll('.meal-card-actions button');
    editButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    });
    
    // Hide confirm button and show message
    const confirmButton = document.querySelector('.plan-actions button.btn-primary');
    if (confirmButton) {
        confirmButton.style.display = 'none';
    }
    
    // Add confirmed badge
    const resultDiv = document.getElementById('menuPlanResult');
    if (resultDiv) {
        const badge = document.createElement('div');
        badge.className = 'confirmed-badge';
        badge.innerHTML = '✓ Planificación Confirmada';
        resultDiv.insertBefore(badge, resultDiv.firstChild);
    }
}

// Show shopping list button
function showShoppingListButton() {
    const planActions = document.querySelector('.plan-actions');
    if (planActions) {
        // Clear existing buttons
        planActions.innerHTML = '';
        
        // Add shopping list button
        const shoppingListBtn = document.createElement('button');
        shoppingListBtn.className = 'btn btn-primary';
        shoppingListBtn.innerHTML = '🛒 Generar Lista de Compra';
        shoppingListBtn.onclick = () => {
            window.location.href = `/shopping-list.html?planId=${currentMenuPlan.id}`;
        };
        
        // Add new plan button
        const newPlanBtn = document.createElement('button');
        newPlanBtn.className = 'btn btn-secondary';
        newPlanBtn.innerHTML = 'Nueva Planificación';
        newPlanBtn.onclick = () => {
            window.location.href = '/menu-planner.html';
        };
        
        planActions.appendChild(shoppingListBtn);
        planActions.appendChild(newPlanBtn);
    }
}

// Reset plan
function resetPlan() {
    currentMenuPlan = null;
    document.getElementById('menuPlanResult').style.display = 'none';
    menuPlanForm.reset();
}
