import { Hono } from 'hono';
import userRoutes from '../../src/routes/user.routes';
import DatabaseService from '../../src/services/DatabaseService';
import UserService from '../../src/services/UserService';
import AuthService from '../../src/services/AuthService';

// Helper para parsear respuestas JSON
async function parseResponse(res: Response): Promise<any> {
  return await res.json();
}

describe('User Routes', () => {
  let app: Hono;
  let testUserId: string;
  let testToken: string;
  let otherUserId: string;
  let otherToken: string;

  beforeAll(async () => {
    app = new Hono();
    app.route('/api/users', userRoutes);

    // Crear usuario de prueba
    const { user } = await UserService.createUser({
      email: 'userroutes@test.com',
      password: 'password123',
      name: 'User Routes Test',
      preferences: 'Vegetarian',
      defaultDiners: 2,
    });
    testUserId = user.id;
    testToken = AuthService.generateToken({ userId: user.id, email: user.email });

    // Crear otro usuario para probar permisos
    const { user: otherUser } = await UserService.createUser({
      email: 'other@test.com',
      password: 'password123',
      name: 'Other User',
      preferences: '',
      defaultDiners: 1,
    });
    otherUserId = otherUser.id;
    otherToken = AuthService.generateToken({ userId: otherUser.id, email: otherUser.email });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUserId) {
      try {
        await DatabaseService.deleteUser(testUserId);
      } catch (e) {}
    }
    if (otherUserId) {
      try {
        await DatabaseService.deleteUser(otherUserId);
      } catch (e) {}
    }
  });

  describe('GET /api/users/:id', () => {
    it('should get user data successfully', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(testUserId);
      expect(data.user.email).toBe('userroutes@test.com');
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'GET',
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when accessing other user data', async () => {
      const req = new Request(`http://localhost/api/users/${otherUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const fakeToken = AuthService.generateToken({ userId: fakeId, email: 'fake@test.com' });

      const req = new Request(`http://localhost/api/users/${fakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${fakeToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user data successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        defaultDiners: 3,
      };

      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.user.name).toBe('Updated Name');
      expect(data.user.defaultDiners).toBe(3);
    });

    it('should update email successfully', async () => {
      const updateData = {
        email: 'newemail@test.com',
      };

      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.user.email).toBe('newemail@test.com');

      // Restaurar email original
      await UserService.updateUser(testUserId, { email: 'userroutes@test.com' });
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when updating other user', async () => {
      const req = new Request(`http://localhost/api/users/${otherUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ name: 'Hacked' }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for no fields provided', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({}),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ email: 'invalid-email' }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for duplicate email', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ email: 'other@test.com' }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('PUT /api/users/:id/preferences', () => {
    it('should update preferences successfully', async () => {
      const updateData = {
        preferences: 'Vegan, gluten-free',
      };

      const req = new Request(`http://localhost/api/users/${testUserId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.user.preferences).toBe('Vegan, gluten-free');
    });

    it('should allow empty preferences', async () => {
      const updateData = {
        preferences: '',
      };

      const req = new Request(`http://localhost/api/users/${testUserId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.user.preferences).toBe('');
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: 'Test' }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when updating other user preferences', async () => {
      const req = new Request(`http://localhost/api/users/${otherUserId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ preferences: 'Hacked' }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for missing preferences field', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({}),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      // Crear usuario temporal para eliminar
      const { user: tempUser } = await UserService.createUser({
        email: 'delete@test.com',
        password: 'password123',
        name: 'Delete Test',
        preferences: '',
        defaultDiners: 1,
      });
      const tempToken = AuthService.generateToken({ userId: tempUser.id, email: tempUser.email });

      const req = new Request(`http://localhost/api/users/${tempUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tempToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();

      // Verificar que el usuario fue eliminado
      const deletedUser = await DatabaseService.getUserById(tempUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/users/${testUserId}`, {
        method: 'DELETE',
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when deleting other user', async () => {
      const req = new Request(`http://localhost/api/users/${otherUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });
});
