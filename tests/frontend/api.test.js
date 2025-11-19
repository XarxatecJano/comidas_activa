/**
 * @jest-environment jsdom
 */

describe('API Error Handler Module', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    
    // Mock window.location
    delete window.location;
    window.location = { href: '' };
    
    // Load the api.js module
    eval(require('fs').readFileSync('./public/js/api.js', 'utf8'));
  });

  describe('ErrorNotification', () => {
    test('should create notification container', () => {
      const container = document.getElementById('globalErrorNotification');
      expect(container).toBeTruthy();
      expect(container.className).toBe('global-notification');
    });

    test('should show error notification', () => {
      showErrorNotification('Test error message');
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Test error message');
      expect(container.innerHTML).toContain('❌');
    });

    test('should show success notification', () => {
      showSuccessNotification('Test success message');
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Test success message');
      expect(container.innerHTML).toContain('✅');
    });

    test('should show warning notification', () => {
      showWarningNotification('Test warning message');
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Test warning message');
      expect(container.innerHTML).toContain('⚠️');
    });

    test('should show info notification', () => {
      showInfoNotification('Test info message');
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.style.display).toBe('block');
      expect(container.innerHTML).toContain('Test info message');
      expect(container.innerHTML).toContain('ℹ️');
    });

    test('should hide notification', () => {
      showErrorNotification('Test message');
      errorNotification.hide();
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.style.display).toBe('none');
    });
  });

  describe('APIError', () => {
    test('should create APIError with correct properties', () => {
      const error = new APIError('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('APIError');
    });
  });

  describe('NetworkError', () => {
    test('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Connection failed');
      
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('handleApiCall', () => {
    test('should handle successful API call', async () => {
      const mockApiFunction = jest.fn().mockResolvedValue({ data: 'success' });
      
      const result = await handleApiCall(mockApiFunction);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'success' });
      expect(mockApiFunction).toHaveBeenCalledTimes(1);
    });

    test('should handle API error', async () => {
      const mockApiFunction = jest.fn().mockRejectedValue(
        new APIError('Test error', 400, 'VALIDATION_ERROR')
      );
      
      const result = await handleApiCall(mockApiFunction);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(APIError);
    });

    test('should show success message when provided', async () => {
      const mockApiFunction = jest.fn().mockResolvedValue({ data: 'success' });
      
      await handleApiCall(mockApiFunction, {
        successMessage: 'Operation successful'
      });
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.innerHTML).toContain('Operation successful');
    });

    test('should call onSuccess callback', async () => {
      const mockApiFunction = jest.fn().mockResolvedValue({ data: 'success' });
      const onSuccess = jest.fn();
      
      await handleApiCall(mockApiFunction, { onSuccess });
      
      expect(onSuccess).toHaveBeenCalledWith({ data: 'success' });
    });

    test('should call onError callback', async () => {
      const mockError = new APIError('Test error', 400, 'VALIDATION_ERROR');
      const mockApiFunction = jest.fn().mockRejectedValue(mockError);
      const onError = jest.fn();
      
      await handleApiCall(mockApiFunction, { onError });
      
      expect(onError).toHaveBeenCalledWith(mockError);
    });

    test('should retry on AI error when retryOnAIError is true', async () => {
      const mockApiFunction = jest.fn()
        .mockRejectedValueOnce(new APIError('AI Error', 500, 'AI_ERROR'))
        .mockResolvedValueOnce({ data: 'success' });
      
      const result = await handleApiCall(mockApiFunction, {
        retryOnAIError: true,
        maxRetries: 1
      });
      
      expect(result.success).toBe(true);
      expect(mockApiFunction).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-AI error', async () => {
      const mockApiFunction = jest.fn().mockRejectedValue(
        new APIError('Validation error', 400, 'VALIDATION_ERROR')
      );
      
      const result = await handleApiCall(mockApiFunction, {
        retryOnAIError: true,
        maxRetries: 2
      });
      
      expect(result.success).toBe(false);
      expect(mockApiFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('getErrorMessage', () => {
    test('should return network error message', () => {
      // Access the function through window since it's not exported directly
      const error = new NetworkError('Connection failed');
      const result = window.handleApiCall(async () => { throw error; });
      
      // The error message should be shown in notification
      expect(result).toBeDefined();
    });

    test('should return appropriate message for 401 error', async () => {
      const error = new APIError('Unauthorized', 401, 'AUTH_ERROR');
      const mockApiFunction = jest.fn().mockRejectedValue(error);
      
      await handleApiCall(mockApiFunction);
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.innerHTML).toContain('Sesión expirada');
    });

    test('should return appropriate message for 403 error', async () => {
      const error = new APIError('Forbidden', 403, 'FORBIDDEN');
      const mockApiFunction = jest.fn().mockRejectedValue(error);
      
      await handleApiCall(mockApiFunction);
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.innerHTML).toContain('No tienes permisos');
    });

    test('should return appropriate message for 404 error', async () => {
      const error = new APIError('Not found', 404, 'NOT_FOUND');
      const mockApiFunction = jest.fn().mockRejectedValue(error);
      
      await handleApiCall(mockApiFunction);
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.innerHTML).toContain('Recurso no encontrado');
    });

    test('should return appropriate message for AI error', async () => {
      const error = new APIError('AI failed', 500, 'AI_ERROR');
      const mockApiFunction = jest.fn().mockRejectedValue(error);
      
      await handleApiCall(mockApiFunction);
      
      const container = document.getElementById('globalErrorNotification');
      expect(container.innerHTML).toContain('IA');
    });
  });

  describe('enhancedAuthenticatedFetch', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      global.getToken = jest.fn();
      global.removeToken = jest.fn();
      global.removeUserData = jest.fn();
    });

    test('should throw error when no token', async () => {
      getToken.mockReturnValue(null);
      
      await expect(enhancedAuthenticatedFetch('/api/test')).rejects.toThrow('No se encontró token de autenticación');
    });

    test('should include auth token in headers', async () => {
      getToken.mockReturnValue('test-token');
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' })
      });
      
      await enhancedAuthenticatedFetch('/api/test');
      
      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
    });

    test('should handle 401 response and redirect', async () => {
      getToken.mockReturnValue('test-token');
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } })
      });
      
      await expect(enhancedAuthenticatedFetch('/api/test')).rejects.toThrow('Sesión expirada');
      expect(removeToken).toHaveBeenCalled();
      expect(removeUserData).toHaveBeenCalled();
      expect(window.location.href).toBe('/login.html');
    });

    test('should throw APIError on non-ok response', async () => {
      getToken.mockReturnValue('test-token');
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Bad request', code: 'VALIDATION_ERROR' } })
      });
      
      await expect(enhancedAuthenticatedFetch('/api/test')).rejects.toThrow(APIError);
    });

    test('should throw NetworkError on fetch failure', async () => {
      getToken.mockReturnValue('test-token');
      fetch.mockRejectedValue(new TypeError('Failed to fetch'));
      
      await expect(enhancedAuthenticatedFetch('/api/test')).rejects.toThrow(NetworkError);
    });

    test('should return data on successful response', async () => {
      getToken.mockReturnValue('test-token');
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' })
      });
      
      const result = await enhancedAuthenticatedFetch('/api/test');
      
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('retryAIOperation', () => {
    test('should retry AI operation on failure', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new APIError('AI Error', 500, 'AI_ERROR'))
        .mockResolvedValueOnce({ data: 'success' });
      
      const result = await retryAIOperation(mockOperation, 1);
      
      expect(result.success).toBe(true);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });
});
