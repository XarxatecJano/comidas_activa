// MealCard Component
// Handles individual meal display and editing

class MealCard {
    constructor(meal, menuPlanId, onUpdate, familyMembers = []) {
        this.meal = meal;
        this.menuPlanId = menuPlanId;
        this.onUpdate = onUpdate;
        this.familyMembers = familyMembers;
        this.isEditing = false;
        this.selectedMemberIds = new Set(meal.dinerIds || []);
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
                <h4>
                    ${dayName} - ${mealTypeName}
                    ${this.renderOverrideBadge()}
                </h4>
                <div class="meal-card-actions">
                    ${this.renderRevertButton()}
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

    // Render override badge
    renderOverrideBadge() {
        if (!this.meal.hasCustomDiners) {
            return '';
        }

        return `
            <span class="override-badge" title="Esta comida tiene comensales personalizados que difieren de la selección masiva">
                ✏️ Personalizado
            </span>
        `;
    }

    // Render revert to bulk button
    renderRevertButton() {
        if (!this.meal.hasCustomDiners) {
            return '';
        }

        return `
            <button class="btn btn-small btn-revert" onclick="mealCards.get('${this.meal.id}').revertToBulkDiners()" title="Revertir a selección masiva">
                ↩️ Revertir
            </button>
        `;
    }

    // Render edit form for meal settings
    renderEditForm() {
        if (!this.isEditing) return '';

        const numberOfDishes = this.meal.dishes?.length || 2;

        return `
            <div class="meal-edit-form">
                <div class="form-group">
                    <label>Comensales (${this.selectedMemberIds.size} seleccionados)</label>
                    ${this.familyMembers.length > 0 ? `
                        <div class="family-members-selector" id="members-${this.meal.id}">
                            ${this.renderFamilyMembersSelector()}
                        </div>
                        <small>Selecciona quiénes comerán en esta comida</small>
                    ` : `
                        <p class="info-message">No tienes miembros de familia añadidos. 
                        <a href="/family-members.html">Añadir miembros</a></p>
                    `}
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

    // Render family members selector
    renderFamilyMembersSelector() {
        return this.familyMembers.map(member => `
            <label class="family-member-checkbox">
                <input type="checkbox" 
                       value="${member.id}"
                       ${this.selectedMemberIds.has(member.id) ? 'checked' : ''}
                       onchange="mealCards.get('${this.meal.id}').toggleMember('${member.id}', this.checked)">
                <span class="member-name">${member.name}</span>
                ${member.dietary_restrictions ? `
                    <span class="member-restrictions">(${member.dietary_restrictions})</span>
                ` : ''}
            </label>
        `).join('');
    }

    // Toggle member selection
    toggleMember(memberId, isSelected) {
        if (isSelected) {
            this.selectedMemberIds.add(memberId);
        } else {
            this.selectedMemberIds.delete(memberId);
        }
    }

    // Render diners info (read-only display)
    renderDinersInfo() {
        if (this.selectedMemberIds.size === 0) {
            return '<p class="diners-info">No hay comensales asignados</p>';
        }

        const selectedMembers = this.familyMembers.filter(m => this.selectedMemberIds.has(m.id));
        return `
            <div class="diners-info">
                <strong>Comensales (${selectedMembers.length}):</strong>
                ${selectedMembers.map(m => m.name).join(', ')}
            </div>
        `;
    }

    // Render dishes
    renderDishes() {
        let html = '';
        
        // Show diners info when not editing
        if (!this.isEditing && this.familyMembers.length > 0) {
            html += this.renderDinersInfo();
        }
        
        if (!this.meal.dishes || this.meal.dishes.length === 0) {
            html += '<p class="empty-state">No hay platos disponibles</p>';
            return html;
        }

        html += this.meal.dishes.map(dish => `
            <div class="dish-item">
                <h5>${dish.name}</h5>
            </div>
        `).join('');
        
        return html;
    }

    // Toggle edit mode
    toggleEdit() {
        this.isEditing = !this.isEditing;
        this.refresh();
    }



    // Update dishes count
    updateDishesCount(count) {
        this.pendingDishesCount = parseInt(count);
    }

    // Save meal settings
    async saveMealSettings() {
        try {
            const numberOfDishes = this.pendingDishesCount || this.meal.dishes?.length || 2;
            const familyMemberIds = Array.from(this.selectedMemberIds);

            // Update meal via API
            const response = await authenticatedFetch(
                `${API_URL}/menu-plans/${this.menuPlanId}/meals/${this.meal.id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        familyMemberIds,
                        numberOfDishes
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.meal = data.meal;
                this.meal.dinerIds = familyMemberIds;
                this.meal.hasCustomDiners = true;
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
            const numberOfDishes = this.meal.dishes?.length || 2;
            const familyMemberIds = Array.from(this.selectedMemberIds);

            const response = await authenticatedFetch(
                `${API_URL}/menu-plans/${this.menuPlanId}/meals/${this.meal.id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        familyMemberIds,
                        numberOfDishes,
                        regenerate: true
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.meal = data.meal;
                this.meal.dinerIds = familyMemberIds;
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

    // Revert to bulk diners
    async revertToBulkDiners() {
        if (!confirm('¿Deseas revertir esta comida a la selección masiva? Se perderán los comensales personalizados.')) {
            return;
        }

        try {
            const response = await authenticatedFetch(
                `${API_URL}/menu-plans/${this.menuPlanId}/meals/${this.meal.id}/revert-diners`,
                {
                    method: 'POST'
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.meal = data.meal;
                this.meal.hasCustomDiners = false;
                this.selectedMemberIds = new Set(this.meal.dinerIds || []);
                this.refresh();
                
                if (this.onUpdate) {
                    this.onUpdate(data.meal);
                }
                
                showNotification('Comida revertida a selección masiva exitosamente', 'success');
            } else {
                showNotification(data.error?.message || 'Error al revertir comida', 'error');
            }
        } catch (error) {
            console.error('Error reverting to bulk diners:', error);
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
