import UserService from '../../src/services/UserService';
import DatabaseService from '../../src/services/DatabaseService';
import pool from '../../src/config/database';
import { CreateUserDTO } from '../../src/models';

describe('UserService', () => {
  let testUserId: string;

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUserId) {
      await pool.query('DELETE FROM "User" WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('createUser', () => {
    test('should create a new user with hashed password', async () => {
      const userData: CreateUserDTO = {
        email: 'userservice@test.com',
        password: 'password123',
        name: 'User Service Test',
        preferences: 'No seafood',
        defaultDiners: 2,
      };

      const result = await UserService.createUser(userData);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.preferences).toBe(userData.preferences);
      expect(result.user.defaultDiners).toBe(userData.defaultDiners);
      expect(result.user.passwordHash).toBeDefined();
      expect(result.user.passwordHash).not.toBe(userData.password);

      testUserId = result.user.id;
    });

    test('should throw error for invalid email', async () => {
      const userData: CreateUserDTO = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('Invalid email format');
    });

    test('should throw error for short password', async () => {
      const userData: CreateUserDTO = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('at least 8 characters');
    });

    test('should throw error for duplicate email', async () => {
      const userData: CreateUserDTO = {
        email: 'userservice@test.com',
        password: 'password123',
        name: 'Duplicate User',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('Email already exists');
    });

    test('should throw error for empty name', async () => {
      const userData: CreateUserDTO = {
        email: 'test2@example.com',
        password: 'password123',
        name: '',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow('Name is required');
    });
  });

  describe('getUserById', () => {
    test('should return user by id', async () => {
      const user = await UserService.getUserById(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('userservice@test.com');
    });

    test('should return null for non-existent user', async () => {
      const user = await UserService.getUserById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    test('should return user by email', async () => {
      const user = await UserService.getUserByEmail('userservice@test.com');

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('userservice@test.com');
    });

    test('should throw error for invalid email format', async () => {
      await expect(UserService.getUserByEmail('invalid-email')).rejects.toThrow(
        'Invalid email format'
      );
    });

    test('should return null for non-existent email', async () => {
      const user = await UserService.getUserByEmail('nonexistent@test.com');
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    test('should update user data', async () => {
      const updateData = {
        name: 'Updated Name',
        preferences: 'No dairy',
        defaultDiners: 3,
      };

      const updatedUser = await UserService.updateUser(testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.preferences).toBe(updateData.preferences);
      expect(updatedUser.defaultDiners).toBe(updateData.defaultDiners);
    });

    test('should throw error for non-existent user', async () => {
      await expect(
        UserService.updateUser('00000000-0000-0000-0000-000000000000', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });

    test('should throw error for invalid email format', async () => {
      await expect(
        UserService.updateUser(testUserId, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });

    test('should throw error for duplicate email', async () => {
      // Crear otro usuario
      const anotherUser = await DatabaseService.createUser({
        email: 'another@test.com',
        password: 'password',
        passwordHash: 'hashedpassword',
        name: 'Another User',
      });

      // Intentar actualizar el primer usuario con el email del segundo
      await expect(
        UserService.updateUser(testUserId, { email: 'another@test.com' })
      ).rejects.toThrow('Email already exists');

      // Limpiar
      await DatabaseService.deleteUser(anotherUser.id);
    });
  });

  describe('updatePreferences', () => {
    test('should update user preferences', async () => {
      const newPreferences = 'Vegan diet, no gluten';
      const updatedUser = await UserService.updatePreferences(testUserId, newPreferences);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.preferences).toBe(newPreferences);
    });

    test('should throw error for non-existent user', async () => {
      await expect(
        UserService.updatePreferences('00000000-0000-0000-0000-000000000000', 'Test')
      ).rejects.toThrow('User not found');
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      const isValid = await UserService.verifyPassword(testUserId, 'password123');
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const isValid = await UserService.verifyPassword(testUserId, 'wrongpassword');
      expect(isValid).toBe(false);
    });

    test('should return false for non-existent user', async () => {
      const isValid = await UserService.verifyPassword(
        '00000000-0000-0000-0000-000000000000',
        'password123'
      );
      expect(isValid).toBe(false);
    });
  });

  describe('verifyPasswordByEmail', () => {
    test('should verify correct password by email', async () => {
      const isValid = await UserService.verifyPasswordByEmail('userservice@test.com', 'password123');
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password by email', async () => {
      const isValid = await UserService.verifyPasswordByEmail(
        'userservice@test.com',
        'wrongpassword'
      );
      expect(isValid).toBe(false);
    });

    test('should return false for non-existent email', async () => {
      const isValid = await UserService.verifyPasswordByEmail('nonexistent@test.com', 'password123');
      expect(isValid).toBe(false);
    });
  });

  describe('deleteUser', () => {
    test('should throw error for non-existent user', async () => {
      await expect(
        UserService.deleteUser('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('User not found');
    });

    test('should delete user successfully', async () => {
      const result = await UserService.deleteUser(testUserId);
      expect(result).toBe(true);

      const user = await UserService.getUserById(testUserId);
      expect(user).toBeNull();

      testUserId = ''; // Clear para que afterAll no intente eliminar
    });
  });
});
