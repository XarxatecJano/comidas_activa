import bcrypt from 'bcrypt';
import DatabaseService from './DatabaseService';
import { CreateUserDTO, UpdateUserDTO, User } from '../models';
import { validateCreateUser, validateUpdateUser, isValidEmail } from '../models/validators';

const SALT_ROUNDS = 10;

class UserService {
  async createUser(userData: CreateUserDTO): Promise<{ user: User; errors?: string[] }> {
    // Validar datos de entrada
    const errors = validateCreateUser(userData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Verificar si el email ya existe
    const existingUser = await DatabaseService.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Crear usuario en la base de datos
    const user = await DatabaseService.createUser({
      ...userData,
      passwordHash,
    });

    return { user };
  }

  async getUserById(userId: string): Promise<User | null> {
    return await DatabaseService.getUserById(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    return await DatabaseService.getUserByEmail(email);
  }

  async updateUser(userId: string, userData: UpdateUserDTO): Promise<User> {
    // Validar datos de entrada
    const errors = validateUpdateUser(userData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Verificar que el usuario existe
    const existingUser = await DatabaseService.getUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Si se está actualizando el email, verificar que no exista
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await DatabaseService.getUserByEmail(userData.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Actualizar usuario
    const updatedUser = await DatabaseService.updateUser(userId, userData);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  async updatePreferences(userId: string, preferences: string): Promise<User> {
    // Verificar que el usuario existe
    const existingUser = await DatabaseService.getUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Actualizar preferencias
    const updatedUser = await DatabaseService.updateUser(userId, { preferences });
    if (!updatedUser) {
      throw new Error('Failed to update preferences');
    }

    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Verificar que el usuario existe
    const existingUser = await DatabaseService.getUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Eliminar usuario (cascade eliminará sus planes de menú)
    return await DatabaseService.deleteUser(userId);
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return false;
    }

    return await bcrypt.compare(password, user.passwordHash);
  }

  async verifyPasswordByEmail(email: string, password: string): Promise<boolean> {
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return false;
    }

    return await bcrypt.compare(password, user.passwordHash);
  }
}

export default new UserService();
