// Require authentication
requireAuth();

let currentMenuPlan = null;

// Set minimum date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').setAttribute('min', today);
    document.getElementById('endDate').setAttribute('min', today);
    
    // Update end date minimum when start date changes
    document.getElementById('startDate').addEventListener('change', (e) => {
        document.getElementById('endDate').setAttribute('min', e.target.value);
    });
});

// Menu plan form handler
const menuPlanForm = document.getElementById('menuPlanForm');
if (menuPlanForm) {
    menuPlanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
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
        
        // Show loading
        toggleLoading(true);
        
        try {
            const response = await authenticatedFetch(`${API_URL}/menu-plans`, {
                method: 'POST',
                body: JSON.stringify({
                    startDate,
                    endDate,
                    days,
                    mealTypes
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

// Display menu plan
function displayMenuPlan(menuPlan) {
    const resultDiv = document.getElementById('menuPlanResult');
    const mealsContainer = document.getElementById('mealsContainer');
    
    if (!resultDiv || !mealsContainer) return;
    
    // Clear previous content
    mealsContainer.innerHTML = '';
    
    // Group meals by day and type
    const dayNames = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
    };
    
    const mealTypeNames = {
        lunch: 'Almuerzo',
        dinner: 'Cena'
    };
    
    menuPlan.meals.forEach(meal => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        
        const dayName = dayNames[meal.dayOfWeek] || meal.dayOfWeek;
        const mealTypeName = mealTypeNames[meal.mealType] || meal.mealType;
        
        let dishesHTML = '';
        meal.dishes.forEach(dish => {
            const ingredientsHTML = dish.ingredients
                .map(ing => `<span class="ingredient-tag">${ing}</span>`)
                .join('');
            
            dishesHTML += `
                <div class="dish-item">
                    <h5>${dish.name}</h5>
                    <p>${dish.description}</p>
                    <div class="ingredients-list">${ingredientsHTML}</div>
                </div>
            `;
        });
        
        mealCard.innerHTML = `
            <h4>${dayName} - ${mealTypeName}</h4>
            ${dishesHTML}
        `;
        
        mealsContainer.appendChild(mealCard);
    });
    
    resultDiv.style.display = 'block';
}

// Confirm plan
async function confirmPlan() {
    if (!currentMenuPlan) {
        alert('No hay planificación para confirmar');
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/menu-plans/${currentMenuPlan.id}/confirm`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('¡Planificación confirmada! Ahora puedes generar tu lista de compra.');
            // Redirect to shopping list generation
            window.location.href = `/shopping-list.html?planId=${currentMenuPlan.id}`;
        } else {
            alert(data.error?.message || 'Error al confirmar planificación');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Reset plan
function resetPlan() {
    currentMenuPlan = null;
    document.getElementById('menuPlanResult').style.display = 'none';
    menuPlanForm.reset();
}
