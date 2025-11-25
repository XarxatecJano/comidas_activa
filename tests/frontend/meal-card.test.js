/**
 * @jest-environment jsdom
 */

// Define MealCard class for testing
class MealCard {
  constructor(meal, menuPlanId, onUpdate, familyMembers = []) {
    this.meal = meal;
    this.menuPlanId = menuPlanId;
    this.onUpdate = onUpdate;
    this.familyMembers = familyMembers;
    this.isEditing = false;
    
    // Extract diner IDs from the diners array (which contains objects with familyMemberId)
    // The backend returns diners as an array of objects: [{id, familyMemberId, name, preferences, ...}]
    const dinerIds = (meal.diners || [])
        .map(diner => diner.familyMemberId || diner.id)
        .filter(id => id); // Filter out any null/undefined values
    
    this.selectedMemberIds = new Set(dinerIds);
  }

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
          <button class="btn btn-small btn-secondary">
            ${this.isEditing ? 'Cancelar' : 'Editar'}
          </button>
          <button class="btn btn-small btn-primary">
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

  renderRevertButton() {
    if (!this.meal.hasCustomDiners) {
      return '';
    }

    return `
      <button class="btn btn-small btn-revert" title="Revertir a selección masiva">
        ↩️ Revertir
      </button>
    `;
  }

  renderEditForm() {
    if (!this.isEditing) return '';

    const diners = this.meal.diners || [];
    const numberOfDishes = this.meal.dishes?.length || 2;

    return `
      <div class="meal-edit-form">
        <div class="form-group">
          <label>Número de Comensales</label>
          <input type="number" class="meal-diners-count" value="${diners.length || 1}" min="1" max="20">
        </div>
        <div class="form-group">
          <label>Nombres de Comensales</label>
          <div class="diners-list" id="diners-${this.meal.id}">
            ${this.renderDinersList(diners)}
          </div>
        </div>
        <div class="form-group">
          <label>Número de Platos</label>
          <select class="meal-dishes-count">
            ${[1, 2, 3, 4].map(n => `<option value="${n}" ${n === numberOfDishes ? 'selected' : ''}>${n} plato${n > 1 ? 's' : ''}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary btn-full">Guardar Cambios</button>
      </div>
    `;
  }

  renderDinersList(diners) {
    const count = diners.length || 1;
    let html = '';
    
    for (let i = 0; i < count; i++) {
      const dinerName = diners[i]?.name || '';
      html += `
        <div class="diner-input-group">
          <input type="text" class="diner-name-input" placeholder="Nombre del comensal ${i + 1}" value="${dinerName}" data-index="${i}">
        </div>
      `;
    }
    
    return html;
  }

  renderDishes() {
    if (!this.meal.dishes || this.meal.dishes.length === 0) {
      return '<p class="empty-state">No hay platos disponibles</p>';
    }

    return this.meal.dishes.map(dish => `
      <div class="dish-item">
        <h5>${dish.name}</h5>
      </div>
    `).join('');
  }

  renderDinersInfo() {
    // First try to use the diners from the meal object (resolved diners from backend)
    if (this.meal.diners && this.meal.diners.length > 0) {
      const dinerNames = this.meal.diners.map(diner => diner.name).join(', ');
      return `
        <div class="diners-info">
          <strong>Comensales (${this.meal.diners.length}):</strong>
          ${dinerNames}
        </div>
      `;
    }
    
    // Fallback to using selectedMemberIds with familyMembers
    if (this.selectedMemberIds.size === 0) {
      return '<p class="diners-info">No hay comensales asignados</p>';
    }

    const selectedMembers = this.familyMembers.filter(m => this.selectedMemberIds.has(m.id));
    if (selectedMembers.length === 0) {
      return '<p class="diners-info">No hay comensales asignados</p>';
    }
    
    return `
      <div class="diners-info">
        <strong>Comensales (${selectedMembers.length}):</strong>
        ${selectedMembers.map(m => m.name).join(', ')}
      </div>
    `;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.refresh();
  }

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

  updateDishesCount(count) {
    this.pendingDishesCount = parseInt(count);
  }

  async saveMealSettings() {
    try {
      const dinerInputs = document.querySelectorAll(`#diners-${this.meal.id} .diner-name-input`);
      const diners = Array.from(dinerInputs).map((input, index) => ({
        name: input.value.trim() || `Comensal ${index + 1}`,
        preferences: ''
      }));

      const numberOfDishes = this.pendingDishesCount || this.meal.dishes?.length || 2;

      const response = await authenticatedFetch(
        `${API_URL}/menu-plans/${this.menuPlanId}/meals/${this.meal.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ diners, numberOfDishes })
        }
      );

      const data = await response.json();

      if (response.ok) {
        this.meal = data.meal;
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
          body: JSON.stringify({ diners, numberOfDishes, regenerate: true })
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

  refresh() {
    const existingCard = document.querySelector(`[data-meal-id="${this.meal.id}"]`);
    if (existingCard) {
      const newCard = this.render();
      existingCard.replaceWith(newCard);
    }
  }
}

const mealCards = new Map();

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

describe('MealCard Component', () => {
  let mockMeal, mockMenuPlanId, mockOnUpdate;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="mealsContainer"></div>
      <div id="planMessage" class="message" style="display: none;"></div>
    `;

    // Mock global functions
    global.authenticatedFetch = jest.fn();
    global.API_URL = 'http://localhost:3000/api';
    global.confirm = jest.fn();

    // Setup mock data
    mockMeal = {
      id: 'meal-1',
      dayOfWeek: 'monday',
      mealType: 'lunch',
      dishes: [
        {
          name: 'Paella',
          description: 'Arroz con mariscos',
          ingredients: ['arroz', 'gambas', 'mejillones']
        }
      ],
      diners: [
        { name: 'Juan', preferences: '' },
        { name: 'María', preferences: '' }
      ]
    };

    mockMenuPlanId = 'plan-123';
    mockOnUpdate = jest.fn();
  });

  describe('Render', () => {
    test('should render meal card with correct day and meal type', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Lunes');
      expect(element.innerHTML).toContain('Almuerzo');
    });

    test('should render dishes with only names', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Paella');
      expect(element.innerHTML).not.toContain('Arroz con mariscos');
      expect(element.innerHTML).not.toContain('arroz');
      expect(element.innerHTML).not.toContain('gambas');
      expect(element.innerHTML).not.toContain('mejillones');
    });

    test('should render edit and regenerate buttons', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Editar');
      expect(element.innerHTML).toContain('Regenerar');
    });

    test('should set correct data-meal-id attribute', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.dataset.mealId).toBe('meal-1');
    });

    test('should handle meal with no dishes', () => {
      const mealWithoutDishes = { ...mockMeal, dishes: [] };
      const card = new MealCard(mealWithoutDishes, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('No hay platos disponibles');
    });
  });

  describe('Edit Mode', () => {
    test('should not show edit form by default', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(card.isEditing).toBe(false);
      expect(element.innerHTML).not.toContain('meal-edit-form');
    });

    test('should toggle edit mode', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      mealCards.set(mockMeal.id, card);
      
      const element = card.render();
      document.body.appendChild(element);

      expect(card.isEditing).toBe(false);
      
      card.toggleEdit();
      
      expect(card.isEditing).toBe(true);
    });

    test('should show edit form when in edit mode', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();

      expect(element.innerHTML).toContain('meal-edit-form');
      expect(element.innerHTML).toContain('Número de Comensales');
      expect(element.innerHTML).toContain('Nombres de Comensales');
      expect(element.innerHTML).toContain('Número de Platos');
    });

    test('should render diners list in edit mode', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();

      expect(element.innerHTML).toContain('Juan');
      expect(element.innerHTML).toContain('María');
    });

    test('should render dishes count selector', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();

      expect(element.innerHTML).toContain('1 plato');
      expect(element.innerHTML).toContain('2 platos');
      expect(element.innerHTML).toContain('3 platos');
      expect(element.innerHTML).toContain('4 platos');
    });
  });

  describe('Update Diners Count', () => {
    test('should update diners list when count changes', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      const dinersContainer = document.getElementById(`diners-${mockMeal.id}`);
      expect(dinersContainer).toBeTruthy();

      card.updateDinersCount(3);

      const inputs = dinersContainer.querySelectorAll('.diner-name-input');
      expect(inputs.length).toBe(3);
    });

    test('should preserve existing diner names when increasing count', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      card.updateDinersCount(3);

      const dinersContainer = document.getElementById(`diners-${mockMeal.id}`);
      const inputs = dinersContainer.querySelectorAll('.diner-name-input');
      
      expect(inputs[0].value).toBe('Juan');
      expect(inputs[1].value).toBe('María');
      expect(inputs[2].value).toBe('');
    });
  });

  describe('Update Dishes Count', () => {
    test('should store pending dishes count', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      card.updateDishesCount(3);
      
      expect(card.pendingDishesCount).toBe(3);
    });
  });

  describe('Save Meal Settings', () => {
    test('should call API with correct data', async () => {
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: { ...mockMeal, id: 'meal-1' } })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      await card.saveMealSettings();

      expect(global.authenticatedFetch).toHaveBeenCalledWith(
        `${API_URL}/menu-plans/${mockMenuPlanId}/meals/${mockMeal.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String)
        })
      );
    });

    test('should call onUpdate callback on success', async () => {
      const updatedMeal = { ...mockMeal, id: 'meal-1' };
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: updatedMeal })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      await card.saveMealSettings();

      expect(mockOnUpdate).toHaveBeenCalledWith(updatedMeal);
    });

    test('should exit edit mode on success', async () => {
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: { ...mockMeal, id: 'meal-1' } })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      await card.saveMealSettings();

      expect(card.isEditing).toBe(false);
    });

    test('should show error message on API failure', async () => {
      global.authenticatedFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'API Error' } })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      await card.saveMealSettings();

      const messageDiv = document.getElementById('planMessage');
      expect(messageDiv.textContent).toContain('API Error');
      expect(messageDiv.className).toContain('error');
    });
  });

  describe('Regenerate Meal', () => {
    test('should ask for confirmation before regenerating', async () => {
      global.confirm.mockReturnValue(false);

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      await card.regenerateMeal();

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('regenerar')
      );
      expect(global.authenticatedFetch).not.toHaveBeenCalled();
    });

    test('should call API with regenerate flag when confirmed', async () => {
      global.confirm.mockReturnValue(true);
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: { ...mockMeal, id: 'meal-1' } })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      await card.regenerateMeal();

      expect(global.authenticatedFetch).toHaveBeenCalledWith(
        `${API_URL}/menu-plans/${mockMenuPlanId}/meals/${mockMeal.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"regenerate":true')
        })
      );
    });

    test('should call onUpdate callback on successful regeneration', async () => {
      global.confirm.mockReturnValue(true);
      const regeneratedMeal = { ...mockMeal, id: 'meal-1' };
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: regeneratedMeal })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      await card.regenerateMeal();

      expect(mockOnUpdate).toHaveBeenCalledWith(regeneratedMeal);
    });

    test('should show error message on regeneration failure', async () => {
      global.confirm.mockReturnValue(true);
      global.authenticatedFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Regeneration failed' } })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      await card.regenerateMeal();

      const messageDiv = document.getElementById('planMessage');
      expect(messageDiv.textContent).toContain('Regeneration failed');
      expect(messageDiv.className).toContain('error');
    });
  });

  describe('Render Diners List', () => {
    test('should render correct number of diner inputs', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const diners = [
        { name: 'Juan' },
        { name: 'María' },
        { name: 'Pedro' }
      ];

      const html = card.renderDinersList(diners);

      expect(html).toContain('Juan');
      expect(html).toContain('María');
      expect(html).toContain('Pedro');
      expect((html.match(/diner-name-input/g) || []).length).toBe(3);
    });

    test('should render at least one input when diners array is empty', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      const html = card.renderDinersList([]);

      expect((html.match(/diner-name-input/g) || []).length).toBe(1);
    });
  });

  describe('Show Notification', () => {
    test('should display success notification', () => {
      showNotification('Test success', 'success');

      const messageDiv = document.getElementById('planMessage');
      expect(messageDiv.textContent).toBe('Test success');
      expect(messageDiv.className).toBe('message success');
      expect(messageDiv.style.display).toBe('block');
    });

    test('should display error notification', () => {
      showNotification('Test error', 'error');

      const messageDiv = document.getElementById('planMessage');
      expect(messageDiv.textContent).toBe('Test error');
      expect(messageDiv.className).toBe('message error');
      expect(messageDiv.style.display).toBe('block');
    });
  });

  describe('Global MealCards Map', () => {
    test('should store meal card instances in global map', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      
      mealCards.set(mockMeal.id, card);
      
      expect(mealCards.get(mockMeal.id)).toBe(card);
    });

    test('should clear meal cards map', () => {
      const card1 = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const card2 = new MealCard({ ...mockMeal, id: 'meal-2' }, mockMenuPlanId, mockOnUpdate);
      
      mealCards.set('meal-1', card1);
      mealCards.set('meal-2', card2);
      
      expect(mealCards.size).toBe(2);
      
      mealCards.clear();
      
      expect(mealCards.size).toBe(0);
    });
  });

  describe('Override Badge', () => {
    test('should not display override badge when hasCustomDiners is false', () => {
      const mealWithoutOverride = { ...mockMeal, hasCustomDiners: false };
      const card = new MealCard(mealWithoutOverride, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).not.toContain('override-badge');
      expect(element.innerHTML).not.toContain('Personalizado');
    });

    test('should display override badge when hasCustomDiners is true', () => {
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('override-badge');
      expect(element.innerHTML).toContain('Personalizado');
    });

    test('should include tooltip text in override badge', () => {
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Esta comida tiene comensales personalizados');
    });
  });

  describe('Revert to Bulk Button', () => {
    test('should not display revert button when hasCustomDiners is false', () => {
      const mealWithoutOverride = { ...mockMeal, hasCustomDiners: false };
      const card = new MealCard(mealWithoutOverride, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).not.toContain('btn-revert');
      expect(element.innerHTML).not.toContain('Revertir');
    });

    test('should display revert button when hasCustomDiners is true', () => {
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('btn-revert');
      expect(element.innerHTML).toContain('Revertir');
    });

    test('should ask for confirmation before reverting', async () => {
      global.confirm.mockReturnValue(false);
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);

      await card.revertToBulkDiners();

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('revertir')
      );
      expect(global.authenticatedFetch).not.toHaveBeenCalled();
    });

    test('should call API to revert diners when confirmed', async () => {
      global.confirm.mockReturnValue(true);
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      const revertedMeal = { ...mealWithOverride, hasCustomDiners: false };
      
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: revertedMeal })
      });

      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);

      await card.revertToBulkDiners();

      expect(global.authenticatedFetch).toHaveBeenCalledWith(
        `${API_URL}/menu-plans/${mockMenuPlanId}/meals/${mockMeal.id}/revert-diners`,
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    test('should update meal state after successful revert', async () => {
      global.confirm.mockReturnValue(true);
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      const revertedMeal = { ...mealWithOverride, hasCustomDiners: false, dinerIds: ['diner-1', 'diner-2'] };
      
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: revertedMeal })
      });

      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);

      await card.revertToBulkDiners();

      expect(card.meal.hasCustomDiners).toBe(false);
      expect(mockOnUpdate).toHaveBeenCalledWith(revertedMeal);
    });

    test('should show error message on revert failure', async () => {
      global.confirm.mockReturnValue(true);
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      
      global.authenticatedFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Revert failed' } })
      });

      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);

      await card.revertToBulkDiners();

      const messageDiv = document.getElementById('planMessage');
      expect(messageDiv.textContent).toContain('Revert failed');
      expect(messageDiv.className).toContain('error');
    });
  });

  describe('Custom Diners Flag Update', () => {
    test('should set hasCustomDiners to true when saving meal settings', async () => {
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: { ...mockMeal, hasCustomDiners: true } })
      });

      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      card.isEditing = true;
      const element = card.render();
      document.body.appendChild(element);

      await card.saveMealSettings();

      expect(card.meal.hasCustomDiners).toBe(true);
    });

    test('should maintain hasCustomDiners flag after regeneration', async () => {
      global.confirm.mockReturnValue(true);
      const mealWithOverride = { ...mockMeal, hasCustomDiners: true };
      
      global.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ meal: { ...mealWithOverride, hasCustomDiners: true } })
      });

      const card = new MealCard(mealWithOverride, mockMenuPlanId, mockOnUpdate);

      await card.regenerateMeal();

      expect(card.meal.hasCustomDiners).toBe(true);
    });
  });

  describe('Dish Display Simplification', () => {
    // Feature: bulk-diner-selection, Property 5: Exclusión de ingredientes de la visualización
    // For any dish, the display output should contain only the dish name and should not include ingredients or description fields
    test('should display only dish names without ingredients', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Paella');
      expect(element.innerHTML).not.toContain('ingredients-list');
      expect(element.innerHTML).not.toContain('ingredient-tag');
      expect(element.innerHTML).not.toContain('arroz');
      expect(element.innerHTML).not.toContain('gambas');
      expect(element.innerHTML).not.toContain('mejillones');
    });

    test('should display only dish names without descriptions', () => {
      const card = new MealCard(mockMeal, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Paella');
      expect(element.innerHTML).not.toContain('Arroz con mariscos');
    });

    test('should render dish name for all dishes in meal', () => {
      const mealWithMultipleDishes = {
        ...mockMeal,
        dishes: [
          {
            name: 'Paella',
            description: 'Arroz con mariscos',
            ingredients: ['arroz', 'gambas', 'mejillones']
          },
          {
            name: 'Ensalada',
            description: 'Ensalada fresca',
            ingredients: ['lechuga', 'tomate', 'cebolla']
          }
        ]
      };

      const card = new MealCard(mealWithMultipleDishes, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Paella');
      expect(element.innerHTML).toContain('Ensalada');
      expect(element.innerHTML).not.toContain('Arroz con mariscos');
      expect(element.innerHTML).not.toContain('Ensalada fresca');
      expect(element.innerHTML).not.toContain('lechuga');
      expect(element.innerHTML).not.toContain('tomate');
    });

    test('should handle dishes with empty ingredients array', () => {
      const mealWithNoIngredients = {
        ...mockMeal,
        dishes: [
          {
            name: 'Plato Simple',
            description: 'Un plato sin ingredientes',
            ingredients: []
          }
        ]
      };

      const card = new MealCard(mealWithNoIngredients, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Plato Simple');
      expect(element.innerHTML).not.toContain('Un plato sin ingredientes');
      expect(element.innerHTML).not.toContain('ingredients-list');
    });

    test('should handle dishes without description field', () => {
      const mealWithoutDescription = {
        ...mockMeal,
        dishes: [
          {
            name: 'Plato Sin Descripción',
            ingredients: ['ingrediente1', 'ingrediente2']
          }
        ]
      };

      const card = new MealCard(mealWithoutDescription, mockMenuPlanId, mockOnUpdate);
      const element = card.render();

      expect(element.innerHTML).toContain('Plato Sin Descripción');
      expect(element.innerHTML).not.toContain('ingrediente1');
      expect(element.innerHTML).not.toContain('ingrediente2');
    });
  });

  describe('Diner Display', () => {
    test('should extract diner IDs from diners array with familyMemberId', () => {
      const mealWithFamilyMembers = {
        ...mockMeal,
        diners: [
          { id: 'diner-1', familyMemberId: 'member-1', name: 'Juan', preferences: '' },
          { id: 'diner-2', familyMemberId: 'member-2', name: 'María', preferences: '' }
        ]
      };

      const familyMembers = [
        { id: 'member-1', name: 'Juan', preferences: '' },
        { id: 'member-2', name: 'María', preferences: '' }
      ];

      const card = new MealCard(mealWithFamilyMembers, mockMenuPlanId, mockOnUpdate, familyMembers);
      
      // Verify that selectedMemberIds contains the familyMemberIds
      expect(card.selectedMemberIds.has('member-1')).toBe(true);
      expect(card.selectedMemberIds.has('member-2')).toBe(true);
      expect(card.selectedMemberIds.size).toBe(2);
    });

    test('should handle diners array without familyMemberId', () => {
      const mealWithoutFamilyMemberId = {
        ...mockMeal,
        diners: [
          { id: 'diner-1', name: 'Juan', preferences: '' },
          { id: 'diner-2', name: 'María', preferences: '' }
        ]
      };

      const card = new MealCard(mealWithoutFamilyMemberId, mockMenuPlanId, mockOnUpdate);
      
      // Should fall back to using id
      expect(card.selectedMemberIds.has('diner-1')).toBe(true);
      expect(card.selectedMemberIds.has('diner-2')).toBe(true);
      expect(card.selectedMemberIds.size).toBe(2);
    });

    test('should handle empty diners array', () => {
      const mealWithNoDiners = {
        ...mockMeal,
        diners: []
      };

      const card = new MealCard(mealWithNoDiners, mockMenuPlanId, mockOnUpdate);
      
      expect(card.selectedMemberIds.size).toBe(0);
    });

    test('should filter out null and undefined values from diners', () => {
      const mealWithInvalidDiners = {
        ...mockMeal,
        diners: [
          { id: 'diner-1', familyMemberId: 'member-1', name: 'Juan' },
          { id: null, familyMemberId: null, name: 'Invalid' },
          { id: 'diner-3', familyMemberId: undefined, name: 'Another' }
        ]
      };

      const card = new MealCard(mealWithInvalidDiners, mockMenuPlanId, mockOnUpdate);
      
      // Should only include valid IDs
      expect(card.selectedMemberIds.has('member-1')).toBe(true);
      expect(card.selectedMemberIds.has('diner-3')).toBe(true);
      expect(card.selectedMemberIds.size).toBe(2);
    });

    test('should display diner names from meal.diners', () => {
      const mealWithDiners = {
        ...mockMeal,
        diners: [
          { id: 'diner-1', familyMemberId: 'member-1', name: 'Juan', preferences: '' },
          { id: 'diner-2', familyMemberId: 'member-2', name: 'María', preferences: '' }
        ]
      };

      const card = new MealCard(mealWithDiners, mockMenuPlanId, mockOnUpdate);
      const dinersInfo = card.renderDinersInfo();
      
      expect(dinersInfo).toContain('Juan');
      expect(dinersInfo).toContain('María');
      expect(dinersInfo).toContain('Comensales (2)');
    });

    test('should show "No hay comensales asignados" when no diners', () => {
      const mealWithNoDiners = {
        ...mockMeal,
        diners: []
      };

      const card = new MealCard(mealWithNoDiners, mockMenuPlanId, mockOnUpdate);
      const dinersInfo = card.renderDinersInfo();
      
      expect(dinersInfo).toContain('No hay comensales asignados');
    });
  });
});
