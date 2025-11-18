/**
 * @jest-environment jsdom
 */

describe('Shopping List Module', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="shoppingListContent">
        <div class="loading">Cargando...</div>
      </div>
    `;

    // Mock global functions from auth.js
    global.requireAuth = jest.fn();
    global.authenticatedFetch = jest.fn();
    global.API_URL = 'http://localhost:3000/api';
    
    // Mock window.location.search
    delete window.location;
    window.location = { search: '?planId=123' };
  });

  describe('Get Plan ID from URL', () => {
    test('should extract planId from URL parameters', () => {
      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      const planId = getPlanIdFromURL();
      expect(planId).toBe('123');
    });

    test('should return null when no planId in URL', () => {
      window.location.search = '';
      
      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      const planId = getPlanIdFromURL();
      expect(planId).toBeNull();
    });
  });

  describe('Display Shopping List', () => {
    test('should display shopping list items correctly', () => {
      const mockShoppingList = {
        id: 1,
        items: [
          { ingredient: 'Arroz', quantity: '500', unit: 'g' },
          { ingredient: 'Tomate', quantity: '3', unit: 'unidades' },
          { ingredient: 'Cebolla', quantity: '2', unit: 'unidades' }
        ]
      };

      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      displayShoppingList(mockShoppingList);
      
      const container = document.getElementById('shoppingListContent');
      expect(container.innerHTML).toContain('Arroz');
      expect(container.innerHTML).toContain('500 g');
      expect(container.innerHTML).toContain('Tomate');
      expect(container.innerHTML).toContain('3 unidades');
    });

    test('should show empty state when no items', () => {
      const mockShoppingList = {
        id: 1,
        items: []
      };

      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      displayShoppingList(mockShoppingList);
      
      const container = document.getElementById('shoppingListContent');
      expect(container.innerHTML).toContain('No hay items en la lista de compra');
    });
  });

  describe('Show Error', () => {
    test('should display error message with link to dashboard', () => {
      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      showError('Test error message');
      
      const container = document.getElementById('shoppingListContent');
      expect(container.innerHTML).toContain('Test error message');
      expect(container.innerHTML).toContain('Volver al Dashboard');
      expect(container.innerHTML).toContain('/dashboard.html');
    });
  });

  describe('Load Shopping List', () => {
    test('should load shopping list successfully', async () => {
      const mockResponse = {
        shoppingList: {
          id: 1,
          items: [
            { ingredient: 'Arroz', quantity: '500', unit: 'g' }
          ]
        }
      };

      authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      await loadShoppingList();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/shopping-lists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ menuPlanId: '123' })
        })
      );
    });

    test('should show error when no planId provided', async () => {
      window.location.search = '';

      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      await loadShoppingList();

      const container = document.getElementById('shoppingListContent');
      expect(container.innerHTML).toContain('No se especificó una planificación');
    });

    test('should handle API error', async () => {
      authenticatedFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'API Error' } })
      });

      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      await loadShoppingList();

      const container = document.getElementById('shoppingListContent');
      expect(container.innerHTML).toContain('API Error');
    });
  });

  describe('Print List', () => {
    test('should call window.print', () => {
      window.print = jest.fn();

      eval(require('fs').readFileSync('./public/js/shopping-list.js', 'utf8'));
      
      printList();

      expect(window.print).toHaveBeenCalled();
    });
  });
});
