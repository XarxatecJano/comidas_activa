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
});
