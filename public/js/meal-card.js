// MealCard Component
// Handles individual meal display and editing

class MealCard {
    constructor(meal, menuPlanId, onUpdate) {
        this.meal = meal;
        this.menuPlanId = menuPlanId;
        this.onUpdate = onUpdate;
        this.isEditing = false;
    }

    // Render the meal card
    render() {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.dataset.mealId = this.meal.id;

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

        const dayName = dayNames[this.meal.dayOfWeek] || this.meal.dayOfWeek;
        const mealTypeName = mealTypeNames[this.meal.mealType] || this.meal.mealType;

        card.innerHTML = `
            <div class="meal-card-header">
                <h4>${dayName} - ${mealTypeName}</h4>
                <div class="meal-card-actions">
                    <button class="btn btn-small btn-secondary" onclick="mealCards.get('${this.meal.id}').toggleEdit()">
                        ${this.isEditing ? 'Cancelar' : 'Editar'}
                    </button>
                    <button class="btn btn-small btn-primary" onclick="mealCards.get('${this.meal.id}').regenerateMeal()">
                        🔄 Regenerar
                    </button>
                </div>
            </div>

            <div class="meal-card-body">
                ${this.renderEditForm()}
                ${this.renderDishes()}
            </div>
        `;

        return card;
    }

    // Render edit form for meal settings
    renderEditForm() {
        if (!this.isEditing) return '';

        const diners = this.meal.diners || [];
        const numberOfDishes = this.meal.dishes?.length || 2;

        return `
            <div class="meal-edit-form">
                <div class="form-group">
                    <label>Número de Comensales</label>
                    <input type="number" 
                           class="meal-diners-count" 
                           value="${diners.length || 1}" 
                           min="1" 
                           max="20"
                           onchange="mealCards.get('${this.meal.id}').updateDinersCount(this.value)">
                </div>

                <div class="form-group">
                    <label>Nombres de Comensales</label>
                    <div class="diners-list" id="diners-${this.meal.id}">
                        ${this.renderDinersList(diners)}
                    </div>
                </div>

                <div class="form-group">
                    <label>Número de Platos</label>
                    <select class="meal-dishes-count" onchange="mealCards.get('${this.meal.id}').updateDishesCount(this.value)">
                        ${[1, 2, 3, 4].map(n => `
                            <option value="${n}" ${n === numberOfDishes ? 'selected' : ''}>${n} plato${n > 1 ? 's' : ''}</option>
                        `).join('')}
                    </select>
                </div>

                <button class="btn btn-primary btn-full" onclick="mealCards.get('${this.meal.id}').saveMealSettings()">
                    Guardar Cambios
                </button>
            </div>
        `;
    }

    // Render list of diners
    renderDinersList(diners) {
        const count = diners.length || 1;
        let html = '';
        
        for (let i = 0; i < count; i++) {
            const dinerName = diners[i]?.name || '';
            html += `
                <div class="diner-input-group">
                    <input type="text" 
                           class="diner-name-input" 
                           placeholder="Nombre del comensal ${i + 1}"
                           value="${dinerName}"
                           data-index="${i}">
                </div>
            `;
        }
        
        return html;
    }

    // Render dishes
    renderDishes() {
        if (!this.meal.dishes || this.meal.dishes.length === 0) {
            return '<p class="empty-state">No hay platos disponibles</p>';
        }

        return this.meal.dishes.map(dish => `
            <div class="dish-item">
                <h5>${dish.name}</h5>
                <p>${dish.description || ''}</p>
                ${dish.ingredients && dish.ingredients.length > 0 ? `
                    <div class="ingredients-list">
                        ${dish.ingredients.map(ing => `
                            <span class="ingredient-tag">${ing}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Toggle edit mode
    toggleEdit() {
        this.isEditing = !this.isEditing;
        this.refresh();
    }

    // Update diners count
    updateDinersCount(count) {
        const dinersContainer = document.getElementById(`diners-${this.meal.id}`);
        if (dinersContainer) {
            const currentDiners = this.meal.diners || [];
            const newDiners = [];
            
            for (let i = 0; i < parseInt(count); i++) {
                newDiners.push(currentDiners[i] || { name: '' });
            }
            
            dinersContainer.innerHTML = this.renderDinersList(newDiners);
        }
    }

    // Update dishes count
    updateDishesCount(count) {
        this.pendingDishesCount = parseInt(count);
    }

    // Save meal settings
    async saveMealSettings() {
        try {
            // Get diners from inputs
            const dinerInputs = document.querySelectorAll(`#diners-${this.meal.id} .diner-name-input`);
            const diners = Array.from(dinerInputs).map((input, index) => ({
                name: input.value.trim() || `Comensal ${index + 1}`,
                preferences: ''
            }));

            const numberOfDishes = this.pendingDishesCount || this.meal.dishes?.length || 2;

            // Update meal via API
            const response = await authenticatedFetch(
                `${API_URL}/menu-plans/${this.menuPlanId}/meals/${this.meal.id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        diners,
                        numberOfDishes
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.meal = data.meal;
                this.isEditing = false;
                this.refresh();
                
                if (this.onUpdate) {
                    this.onUpdate(data.meal);
                }
                
                showNotification('Comida actualizada exitosamente', 'success');
            } else {
                showNotification(data.error?.message || 'Error al actualizar comida', 'error');
            }
        } catch (error) {
            console.error('Error saving meal settings:', error);
            showNotification('Error de conexión', 'error');
        }
    }

    // Regenerate meal
    async regenerateMeal() {
        if (!confirm('¿Deseas regenerar esta comida? Se perderán los platos actuales.')) {
            return;
        }

        try {
            const diners = this.meal.diners || [];
            const numberOfDishes = this.meal.dishes?.length || 2;

            const response = await authenticatedFetch(
                `${API_URL}/menu-plans/${this.menuPlanId}/meals/${this.meal.id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        diners,
                        numberOfDishes,
                        regenerate: true
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.meal = data.meal;
                this.refresh();
                
                if (this.onUpdate) {
                    this.onUpdate(data.meal);
                }
                
                showNotification('Comida regenerada exitosamente', 'success');
            } else {
                showNotification(data.error?.message || 'Error al regenerar comida', 'error');
            }
        } catch (error) {
            console.error('Error regenerating meal:', error);
            showNotification('Error de conexión', 'error');
        }
    }

    // Refresh the card in the DOM
    refresh() {
        const existingCard = document.querySelector(`[data-meal-id="${this.meal.id}"]`);
        if (existingCard) {
            const newCard = this.render();
            existingCard.replaceWith(newCard);
        }
    }
}

// Global map to store meal card instances
const mealCards = new Map();

// Helper function to show notifications
function showNotification(message, type = 'success') {
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
