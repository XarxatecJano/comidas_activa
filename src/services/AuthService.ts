import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import DatabaseService from './DatabaseService';
import UserService from './UserService';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

interface TokenPayload {
  userId: string;
  email: string;
}

interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

class AuthService {
  /**
   * Login de usuario con email y contraseña
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Buscar usuario por email
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generar token JWT
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    // Retornar usuario sin el hash de contraseña
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Generar token JWT
   */
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);
  }

  /**
   * Verificar y decodificar token JWT
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Obtener usuario desde token
   */
  async getUserFromToken(token: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const decoded = this.verifyToken(token);
      const user = await DatabaseService.getUserById(decoded.userId);
      
      if (!user) {
        return null;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout (en este caso solo invalidamos el token del lado del cliente)
   * Para un logout más robusto, se podría implementar una blacklist de tokens
   */
  logout(): { message: string } {
    return { message: 'Logged out successfully' };
  }

  /**
   * Refrescar token
   */
  async refreshToken(oldToken: string): Promise<string> {
    const decoded = this.verifyToken(oldToken);
    
    // Verificar que el usuario aún existe
    const user = await DatabaseService.getUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generar nuevo token
    return this.generateToken({
      userId: user.id,
      email: user.email,
    });
  }
}

export default new AuthService();
