import { Hono } from 'hono';
import authRoutes from '../../src/routes/auth.routes';
import DatabaseService from '../../src/services/DatabaseService';
import UserService from '../../src/services/UserService';

// Helper para parsear respuestas JSON
async function parseResponse(res: Response): Promise<any> {
  return await res.json();
}

describe('Auth Routes', () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    app.route('/api/auth', authRoutes);
  });

  afterEach(async () => {
    // Limpiar usuarios de prueba
    const testEmails = [
      'register@test.com',
      'login@test.com',
      'duplicate@test.com',
    ];

    for (const email of testEmails) {
      const user = await DatabaseService.getUserByEmail(email);
      if (user) {
        await DatabaseService.deleteUser(user.id);
      }
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'register@test.com',
        password: 'password123',
        name: 'Test User',
        preferences: 'Vegetarian',
        defaultDiners: 2,
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(userData.email);
      expect(data.user.name).toBe(userData.name);
      expect(data.user.preferences).toBe(userData.preferences);
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.token).toBeDefined();
    });

    it('should register user with default values', async () => {
      const userData = {
        email: 'register@test.com',
        password: 'password123',
        name: 'Test User',
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(data.user.preferences).toBe('');
      expect(data.user.defaultDiners).toBe(1);
    });

    it('should return 400 for missing email', async () => {
      const userData = {
        password: 'password123',
        name: 'Test User',
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('required');
    });

    it('should return 400 for missing password', async () => {
      const userData = {
        email: 'register@test.com',
        name: 'Test User',
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing name', async () => {
      const userData = {
        email: 'register@test.com',
        password: 'password123',
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'register@test.com',
        password: '123',
        name: 'Test User',
      };

      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        name: 'Test User',
      };

      // Crear primer usuario
      await UserService.createUser(userData);

      // Intentar crear segundo usuario con mismo email
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario para login
      await UserService.createUser({
        email: 'login@test.com',
        password: 'password123',
        name: 'Login Test User',
        preferences: '',
        defaultDiners: 1,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password123',
      };

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(loginData.email);
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.token).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'password123',
      };

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'login@test.com',
      };

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword',
      };

      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const req = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
    });
  });
});
