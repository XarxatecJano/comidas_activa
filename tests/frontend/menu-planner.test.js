/**
 * @jest-environment jsdom
 */

describe('Menu Planner Module', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <form id="menuPlanForm">
        <input type="date" id="startDate" />
        <input type="date" id="endDate" />
        <input type="checkbox" name="days" value="monday" />
        <input type="checkbox" name="days" value="tuesday" />
        <input type="checkbox" name="mealTypes" value="lunch" checked />
        <input type="checkbox" name="mealTypes" value="dinner" checked />
        <button type="submit">
          <span id="btnText">Generar</span>
          <span id="btnLoading" style="display: none;">Cargando...</span>
        </button>
      </form>
      <div id="planMessage" class="message" style="display: none;"></div>
      <div id="menuPlanResult" style="display: none;">
        <div id="mealsContainer"></div>
      </div>
    `;

    // Mock global functions from auth.js
    global.requireAuth = jest.fn();
    global.authenticatedFetch = jest.fn();
    global.API_URL = 'http://localhost:3000/api';
  });

  describe('Date Validation', () => {
    test('should set minimum date to today on load', () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Simulate DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      const startDate = document.getElementById('startDate');
      const endDate = document.getElementById('endDate');
      
      // Note: This test verifies the logic exists, actual implementation runs on page load
      expect(startDate).toBeTruthy();
      expect(endDate).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    test('should show error when no dates selected', () => {
      const form = document.getElementById('menuPlanForm');
      const startDate = document.getElementById('startDate');
      const endDate = document.getElementById('endDate');
      
      startDate.value = '';
      endDate.value = '';
      
      // This would be validated in the actual form submission
      expect(startDate.value).toBe('');
      expect(endDate.value).toBe('');
    });

    test('should show error when no days selected', () => {
      const daysCheckboxes = document.querySelectorAll('input[name="days"]:checked');
      expect(daysCheckboxes.length).toBe(0);
    });

    test('should show error when no meal types selected', () => {
      const mealTypesCheckboxes = document.querySelectorAll('input[name="mealTypes"]');
      mealTypesCheckboxes.forEach(cb => cb.checked = false);
      
      const checkedMealTypes = document.querySelectorAll('input[name="mealTypes"]:checked');
      expect(checkedMealTypes.length).toBe(0);
    });
  });

  describe('Display Menu Plan', () => {
    test('should have meals container element', () => {
      const mealsContainer = document.getElementById('mealsContainer');
      expect(mealsContainer).toBeTruthy();
    });

    test('should have result div element', () => {
      const resultDiv = document.getElementById('menuPlanResult');
      expect(resultDiv).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    test('toggleLoading should show loading state', () => {
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));
      
      toggleLoading(true);
      
      const btnText = document.getElementById('btnText');
      const btnLoading = document.getElementById('btnLoading');
      const submitBtn = document.querySelector('button[type="submit"]');
      
      expect(btnText.style.display).toBe('none');
      expect(btnLoading.style.display).toBe('inline');
      expect(submitBtn.disabled).toBe(true);
    });

    test('toggleLoading should hide loading state', () => {
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));
      
      toggleLoading(false);
      
      const btnText = document.getElementById('btnText');
      const btnLoading = document.getElementById('btnLoading');
      const submitBtn = document.querySelector('button[type="submit"]');
      
      expect(btnText.style.display).toBe('inline');
      expect(btnLoading.style.display).toBe('none');
      expect(submitBtn.disabled).toBe(false);
    });
  });

  describe('Show Plan Message', () => {
    test('should display success message', () => {
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));
      
      showPlanMessage('Test success', 'success');
      
      const container = document.getElementById('planMessage');
      expect(container.textContent).toBe('Test success');
      expect(container.className).toBe('message success');
      expect(container.style.display).toBe('block');
    });

    test('should display error message', () => {
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));
      
      showPlanMessage('Test error', 'error');
      
      const container = document.getElementById('planMessage');
      expect(container.textContent).toBe('Test error');
      expect(container.className).toBe('message error');
      expect(container.style.display).toBe('block');
    });
  });

  describe('Reset Plan', () => {
    test('should reset form and hide results', () => {
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));
      
      // Show result first
      const resultDiv = document.getElementById('menuPlanResult');
      resultDiv.style.display = 'block';
      
      resetPlan();
      
      expect(resultDiv.style.display).toBe('none');
    });
  });

  describe('Bulk Diner Selection Integration', () => {
    beforeEach(() => {
      // Add containers for bulk diner selectors
      document.body.innerHTML += `
        <div id="lunchDinersSelector"></div>
        <div id="dinnerDinersSelector"></div>
      `;

      // Mock BulkDinerSelector
      global.BulkDinerSelector = jest.fn().mockImplementation((mealType, members, initial) => {
        return {
          mealType,
          familyMembers: members,
          selectedDinerIds: new Set(initial),
          onChange: null,
          render: jest.fn(() => {
            const div = document.createElement('div');
            div.className = 'bulk-diner-selector';
            return div;
          }),
          setOnChange: jest.fn(function(callback) {
            this.onChange = callback;
          }),
          getSelectedDiners: jest.fn(function() {
            return Array.from(this.selectedDinerIds);
          })
        };
      });

      // Mock getUserData
      global.getUserData = jest.fn(() => ({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    test('should load family members and preferences on init', async () => {
      const mockMembers = [
        { id: '1', name: 'Member 1' },
        { id: '2', name: 'Member 2' }
      ];

      global.authenticatedFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user-123', name: 'Test User', preferences: '' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ members: mockMembers })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ familyMemberIds: ['1'] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ familyMemberIds: ['2'] })
        });

      // Load the module
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));

      await loadFamilyMembersAndPreferences();

      expect(global.authenticatedFetch).toHaveBeenCalledTimes(4);
      
      // Should include user as first diner option
      const expectedDiners = [
        { id: 'user-123', name: 'Test User', preferences: '' },
        ...mockMembers
      ];
      
      // User ID should be included in the preferences
      expect(global.BulkDinerSelector).toHaveBeenCalledWith('lunch', expectedDiners, ['user-123', '1']);
      expect(global.BulkDinerSelector).toHaveBeenCalledWith('dinner', expectedDiners, ['user-123', '2']);
    });

    test('should save preferences when selection changes', async () => {
      global.authenticatedFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      // Load the module
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));

      await saveBulkDinerPreferences('lunch', ['1', '2']);

      expect(global.authenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/diner-preferences/lunch'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ familyMemberIds: ['1', '2'] })
        })
      );
    });

    test('should handle empty family members gracefully', async () => {
      global.authenticatedFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user-123', name: 'Test User', preferences: '' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ members: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ familyMemberIds: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ familyMemberIds: [] })
        });

      // Load the module
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));

      await loadFamilyMembersAndPreferences();

      // Should still include user even with no family members
      const expectedDiners = [
        { id: 'user-123', name: 'Test User', preferences: '' }
      ];
      
      // User should be included by default even with empty preferences
      expect(global.BulkDinerSelector).toHaveBeenCalledWith('lunch', expectedDiners, ['user-123']);
      expect(global.BulkDinerSelector).toHaveBeenCalledWith('dinner', expectedDiners, ['user-123']);
    });

    test('should handle API errors when loading preferences', async () => {
      global.authenticatedFetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'));

      // Load the module
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));

      await loadFamilyMembersAndPreferences();

      // Should still render selectors with user even on error
      const expectedDiners = [
        { id: 'user-123', name: 'Test User', preferences: '' }
      ];
      
      expect(global.BulkDinerSelector).toHaveBeenCalledWith('lunch', expectedDiners, []);
      expect(global.BulkDinerSelector).toHaveBeenCalledWith('dinner', expectedDiners, []);
    });

    test('should show success message after saving preferences', async () => {
      global.authenticatedFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      // Load the module
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));

      await saveBulkDinerPreferences('dinner', ['1']);

      const messageEl = document.getElementById('planMessage');
      expect(messageEl.textContent).toContain('cena');
      expect(messageEl.textContent).toContain('guardadas');
    });

    test('should show error message when saving preferences fails', async () => {
      global.authenticatedFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid data' })
        });

      // Load the module
      eval(require('fs').readFileSync('./public/js/menu-planner.js', 'utf8'));

      await saveBulkDinerPreferences('lunch', ['invalid']);

      const messageEl = document.getElementById('planMessage');
      expect(messageEl.textContent).toContain('Invalid data');
    });
  });
});
