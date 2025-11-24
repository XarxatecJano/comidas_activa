// BulkDinerSelector Component
// Handles bulk selection of diners for a specific meal type (lunch or dinner)

class BulkDinerSelector {
    /**
     * @param {string} mealType - 'lunch' or 'dinner'
     * @param {Array<{id: string, name: string}>} familyMembers - Array of family members
     * @param {Array<string>} initialSelection - Array of initially selected family member IDs
     */
    constructor(mealType, familyMembers = [], initialSelection = []) {
        if (mealType !== 'lunch' && mealType !== 'dinner') {
            throw new Error('mealType must be "lunch" or "dinner"');
        }
        
        this.mealType = mealType;
        this.familyMembers = familyMembers;
        this.selectedDinerIds = new Set(initialSelection);
        this.onChange = null;
        this.container = null;
    }

    /**
     * Render the bulk diner selector
     * @returns {HTMLElement} The rendered selector element
     */
    render() {
        const container = document.createElement('div');
        container.className = 'bulk-diner-selector';
        container.dataset.mealType = this.mealType;
        
        const mealTypeLabel = this.mealType === 'lunch' ? 'Almuerzo' : 'Cena';
        
        container.innerHTML = `
            <div class="bulk-diner-selector-header">
                <h4>${mealTypeLabel}</h4>
                <p class="bulk-diner-selector-description">
                    Selecciona los comensales que comerán ${mealTypeLabel.toLowerCase()} por defecto
                </p>
            </div>
            <div class="bulk-diner-selector-list">
                ${this.renderFamilyMembers()}
            </div>
        `;
        
        this.container = container;
        this.attachEventListeners();
        
        return container;
    }

    /**
     * Render family members as checkboxes
     * @returns {string} HTML string with checkboxes
     */
    renderFamilyMembers() {
        if (this.familyMembers.length === 0) {
            return `
                <div class="bulk-diner-selector-empty">
                    <p>No hay miembros de familia disponibles.</p>
                    <p>Añade miembros de familia en tu perfil para poder seleccionarlos.</p>
                </div>
            `;
        }
        
        return this.familyMembers.map(member => {
            const isChecked = this.selectedDinerIds.has(member.id);
            return `
                <div class="bulk-diner-checkbox">
                    <label>
                        <input 
                            type="checkbox" 
                            value="${member.id}"
                            ${isChecked ? 'checked' : ''}
                            data-member-id="${member.id}"
                        />
                        <span class="checkbox-label">${member.name}</span>
                    </label>
                </div>
            `;
        }).join('');
    }

    /**
     * Attach event listeners to checkboxes
     */
    attachEventListeners() {
        if (!this.container) return;
        
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const memberId = e.target.value;
                
                if (e.target.checked) {
                    this.selectedDinerIds.add(memberId);
                } else {
                    this.selectedDinerIds.delete(memberId);
                }
                
                if (this.onChange) {
                    this.onChange(this.getSelectedDiners());
                }
            });
        });
    }

    /**
     * Get the currently selected diner IDs
     * @returns {Array<string>} Array of selected family member IDs
     */
    getSelectedDiners() {
        return Array.from(this.selectedDinerIds);
    }

    /**
     * Set the selected diner IDs
     * @param {Array<string>} dinerIds - Array of family member IDs to select
     */
    setSelectedDiners(dinerIds) {
        this.selectedDinerIds = new Set(dinerIds);
        
        if (this.container) {
            const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.selectedDinerIds.has(checkbox.value);
            });
        }
    }

    /**
     * Set the onChange callback
     * @param {Function} callback - Function to call when selection changes
     */
    setOnChange(callback) {
        this.onChange = callback;
    }

    /**
     * Update family members and re-render
     * @param {Array<{id: string, name: string}>} familyMembers - New array of family members
     */
    updateFamilyMembers(familyMembers) {
        this.familyMembers = familyMembers;
        
        if (this.container) {
            const listContainer = this.container.querySelector('.bulk-diner-selector-list');
            if (listContainer) {
                listContainer.innerHTML = this.renderFamilyMembers();
                this.attachEventListeners();
            }
        }
    }

    /**
     * Destroy the component and clean up
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.onChange = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BulkDinerSelector;
}
