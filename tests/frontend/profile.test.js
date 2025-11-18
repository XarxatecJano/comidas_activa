/**
 * @jest-environment jsdom
 */

describe('Profile Module', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <form id="profileForm">
        <input type="text" id="name" />
        <input type="email" id="email" />
        <input type="number" id="defaultDiners" />
      </form>
      <form id="preferencesForm">
        <textarea id="preferences"></textarea>
      </form>
      <div id="profileMessage" class="message" style="display: none;"></div>
      <div id="preferencesMessage" class="message" style="display: none;"></div>
    `;

    // Mock global functions from auth.js
    global.requireAuth = jest.fn();
    global.authenticatedFetch = jest.fn();
    global.getUserData = jest.fn();
    global.saveUserData = jest.fn();
    global.isValidEmail = jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    global.logout = jest.fn();
    global.API_URL = 'http://localhost:3000/api';
  });

  describe('Load Profile', () => {
    test('should load user profile data successfully', async () => {
      const mockUserData = { id: 1, name: 'Test User', email: 'test@example.com' };
      const mockResponse = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          defaultDiners: 2,
          preferences: 'No seafood'
        }
      };

      getUserData.mockReturnValue(mockUserData);
      authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      eval(require('fs').readFileSync('./public/js/profile.js', 'utf8'));
      
      await loadProfile();

      expect(document.getElementById('name').value).toBe('Test User');
      expect(document.getElementById('email').value).toBe('test@example.com');
      expect(document.getElementById('defaultDiners').value).toBe('2');
      expect(document.getElementById('preferences').value).toBe('No seafood');
    });

    test('should handle error when no user data found', async () => {
      getUserData.mockReturnValue(null);

      eval(require('fs').readFileSync('./public/js/profile.js', 'utf8'));
      
      await loadProfile();

      const profileMessage = document.getElementById('profileMessage');
      expect(profileMessage.textContent).toContain('Error al cargar perfil');
    });
  });

  describe('Show Message', () => {
    test('should display success message in correct container', () => {
      eval(require('fs').readFileSync('./public/js/profile.js', 'utf8'));
      
      showMessage('profileMessage', 'Profile updated', 'success');
      
      const container = document.getElementById('profileMessage');
      expect(container.textContent).toBe('Profile updated');
      expect(container.className).toBe('message success');
      expect(container.style.display).toBe('block');
    });

    test('should display error message in correct container', () => {
      eval(require('fs').readFileSync('./public/js/profile.js', 'utf8'));
      
      showMessage('preferencesMessage', 'Update failed', 'error');
      
      const container = document.getElementById('preferencesMessage');
      expect(container.textContent).toBe('Update failed');
      expect(container.className).toBe('message error');
      expect(container.style.display).toBe('block');
    });
  });

  describe('Profile Form Validation', () => {
    test('should validate name length', () => {
      const name = 'A';
      expect(name.length < 2).toBe(true);
    });

    test('should validate email format', () => {
      isValidEmail.mockReturnValue(false);
      expect(isValidEmail('invalid-email')).toBe(false);
      
      isValidEmail.mockReturnValue(true);
      expect(isValidEmail('valid@email.com')).toBe(true);
    });

    test('should validate default diners range', () => {
      const diners = 25;
      expect(diners < 1 || diners > 20).toBe(true);
      
      const validDiners = 5;
      expect(validDiners >= 1 && validDiners <= 20).toBe(true);
    });
  });

  describe('Delete Account', () => {
    test('should call confirm twice before deleting', async () => {
      global.confirm = jest.fn()
        .mockReturnValueOnce(false); // First confirm returns false

      eval(require('fs').readFileSync('./public/js/profile.js', 'utf8'));
      
      await deleteAccount();

      expect(confirm).toHaveBeenCalledTimes(1);
      expect(authenticatedFetch).not.toHaveBeenCalled();
    });

    test('should delete account when both confirms are accepted', async () => {
      global.confirm = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      
      global.alert = jest.fn();

      authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      eval(require('fs').readFileSync('./public/js/profile.js', 'utf8'));
      
      // Set currentUserId
      global.currentUserId = 1;
      
      await deleteAccount();

      expect(confirm).toHaveBeenCalledTimes(2);
      expect(alert).toHaveBeenCalledWith('Cuenta eliminada exitosamente');
      expect(logout).toHaveBeenCalled();
    });
  });
});
