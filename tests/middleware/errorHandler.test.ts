import { Hono } from 'hono';
import {
  errorHandler,
  notFoundHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  AIServiceError,
  DatabaseError,
} from '../../src/middleware/errorHandler';

// Helper para parsear respuestas JSON
async function parseResponse(res: Response): Promise<any> {
  return await res.json();
}

describe('Error Handler Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.onError(errorHandler);
  });

  describe('Custom Error Classes', () => {
    it('should handle ValidationError', async () => {
      app.get('/test', () => {
        throw new ValidationError('Invalid input data');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid input data');
      expect(data.error.timestamp).toBeDefined();
    });

    it('should handle AuthenticationError', async () => {
      app.get('/test', () => {
        throw new AuthenticationError('Invalid token');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
      expect(data.error.message).toBe('Invalid token');
    });

    it('should handle AuthorizationError', async () => {
      app.get('/test', () => {
        throw new AuthorizationError('Access denied');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toBe('Access denied');
    });

    it('should handle NotFoundError', async () => {
      app.get('/test', () => {
        throw new NotFoundError('Resource not found');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toBe('Resource not found');
    });

    it('should handle AIServiceError', async () => {
      app.get('/test', () => {
        throw new AIServiceError('AI service failed');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(data.error.code).toBe('AI_ERROR');
      expect(data.error.message).toBe('AI service failed');
    });

    it('should handle DatabaseError', async () => {
      app.get('/test', () => {
        throw new DatabaseError('Database connection failed');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toBe('Database connection failed');
    });
  });

  describe('Error Detection by Message', () => {
    it('should detect validation errors by message', async () => {
      app.get('/test', () => {
        throw new Error('Validation failed: email is required');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should detect authentication errors by message', async () => {
      app.get('/test', () => {
        throw new Error('Invalid credentials provided');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should detect authorization errors by message', async () => {
      app.get('/test', () => {
        throw new Error('Access denied to this resource');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should detect not found errors by message', async () => {
      app.get('/test', () => {
        throw new Error('User not found');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Generic Errors', () => {
    it('should handle generic errors as internal server error', async () => {
      app.get('/test', () => {
        throw new Error('Something went wrong');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBeDefined();
    });

    it('should include timestamp in all error responses', async () => {
      app.get('/test', () => {
        throw new Error('Test error');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(data.error.timestamp).toBeDefined();
      expect(new Date(data.error.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('Not Found Handler', () => {
    it('should handle 404 for non-existent routes', async () => {
      app.notFound(notFoundHandler);

      const req = new Request('http://localhost/non-existent-route');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('not found');
      expect(data.error.message).toContain('/non-existent-route');
    });

    it('should include request method in 404 message', async () => {
      app.notFound(notFoundHandler);

      const req = new Request('http://localhost/test', { method: 'POST' });
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.message).toContain('POST');
    });
  });

  describe('Error Response Format', () => {
    it('should have consistent error response structure', async () => {
      app.get('/test', () => {
        throw new ValidationError('Test error');
      });

      const req = new Request('http://localhost/test');
      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('timestamp');
    });
  });
});
