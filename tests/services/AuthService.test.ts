import AuthService from '../../src/services/AuthService';
import DatabaseService from '../../src/services/DatabaseService';
import UserService from '../../src/services/UserService';
import pool from '../../src/config/database';
import { CreateUserDTO } from '../../src/models';

describe('AuthService', () => {
  let testUserId: string;
  const testEmail = 'auth@test.com';
  const testPassword = 'password123';

  beforeAll(async () => {
    // Crear usuario de prueba
    const userData: CreateUserDTO = {
      email: testEmail,
      password: testPassword,
      name: 'Auth Test User',
      preferences: 'Test preferences',
      defaultDiners: 2,
    };

    const { user } = await UserService.createUser(userData);
    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUserId) {
      await pool.query('DELETE FROM "User" WHERE id = $1', [testUserId]);
    }
    // No cerrar el pool aquí, se cierra en setup.ts
  });

  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      const result = await AuthService.login(testEmail, testPassword);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    test('should fail login with invalid email', async () => {
      await expect(
        AuthService.login('nonexistent@test.com', testPassword)
      ).rejects.toThrow('Invalid credentials');
    });

    test('should fail login with invalid password', async () => {
      await expect(
        AuthService.login(testEmail, 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = AuthService.generateToken({
        userId: testUserId,
        email: testEmail,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tiene 3 partes
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token', () => {
      const token = AuthService.generateToken({
        userId: testUserId,
        email: testEmail,
      });

      const decoded = AuthService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
    });

    test('should fail to verify an invalid token', () => {
      expect(() => {
        AuthService.verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    test('should fail to verify a malformed token', () => {
      expect(() => {
        AuthService.verifyToken('not-a-jwt-token');
      }).toThrow('Invalid or expired token');
    });
  });

  describe('getUserFromToken', () => {
    test('should get user from valid token', async () => {
      const token = AuthService.generateToken({
        userId: testUserId,
        email: testEmail,
      });

      const user = await AuthService.getUserFromToken(token);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe(testEmail);
      expect(user).not.toHaveProperty('passwordHash');
    });

    test('should return null for invalid token', async () => {
      const user = await AuthService.getUserFromToken('invalid.token.here');
      expect(user).toBeNull();
    });

    test('should return null for token with non-existent user', async () => {
      const token = AuthService.generateToken({
        userId: '00000000-0000-0000-0000-000000000000',
        email: 'nonexistent@test.com',
      });

      const user = await AuthService.getUserFromToken(token);
      expect(user).toBeNull();
    });
  });

  describe('logout', () => {
    test('should return logout message', () => {
      const result = AuthService.logout();

      expect(result).toBeDefined();
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('refreshToken', () => {
    test('should refresh a valid token', async () => {
      const oldToken = AuthService.generateToken({
        userId: testUserId,
        email: testEmail,
      });

      const newToken = await AuthService.refreshToken(oldToken);

      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
      expect(newToken).not.toBe(oldToken);

      // Verificar que el nuevo token es válido
      const decoded = AuthService.verifyToken(newToken);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
    });

    test('should fail to refresh invalid token', async () => {
      await expect(
        AuthService.refreshToken('invalid.token.here')
      ).rejects.toThrow('Invalid or expired token');
    });

    test('should fail to refresh token for deleted user', async () => {
      // Crear y eliminar un usuario temporal
      const tempUserData: CreateUserDTO = {
        email: 'temp@test.com',
        password: 'password123',
        name: 'Temp User',
      };

      const { user: tempUser } = await UserService.createUser(tempUserData);
      const token = AuthService.generateToken({
        userId: tempUser.id,
        email: tempUser.email,
      });

      // Eliminar usuario
      await DatabaseService.deleteUser(tempUser.id);

      // Intentar refrescar token
      await expect(
        AuthService.refreshToken(token)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Integration: Full auth flow', () => {
    test('should complete full authentication flow', async () => {
      // 1. Login
      const loginResult = await AuthService.login(testEmail, testPassword);
      expect(loginResult.token).toBeDefined();

      // 2. Verificar token
      const decoded = AuthService.verifyToken(loginResult.token);
      expect(decoded.userId).toBe(testUserId);

      // 3. Obtener usuario desde token
      const user = await AuthService.getUserFromToken(loginResult.token);
      expect(user?.id).toBe(testUserId);

      // 4. Refrescar token
      const newToken = await AuthService.refreshToken(loginResult.token);
      expect(newToken).toBeDefined();

      // 5. Verificar nuevo token
      const newDecoded = AuthService.verifyToken(newToken);
      expect(newDecoded.userId).toBe(testUserId);

      // 6. Logout
      const logoutResult = AuthService.logout();
      expect(logoutResult.message).toBe('Logged out successfully');
    });
  });
});
