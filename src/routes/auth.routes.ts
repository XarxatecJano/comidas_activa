import { Hono } from 'hono';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import { CreateUserDTO } from '../models';

const authRoutes = new Hono();

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, preferences, defaultDiners } = body;

    // Validar datos requeridos
    if (!email || !password || !name) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email, password and name are required' } },
        400
      );
    }

    // Crear usuario
    const userData: CreateUserDTO = {
      email,
      password,
      name,
      preferences: preferences || '',
      defaultDiners: defaultDiners || 1,
    };

    const { user } = await UserService.createUser(userData);

    // Generar token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
    });

    // Retornar usuario sin contraseña
    const { passwordHash, ...userWithoutPassword } = user;

    return c.json(
      {
        user: userWithoutPassword,
        token,
      },
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.message.includes('Email already exists')) {
      return c.json(
        { error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' } },
        400
      );
    }

    if (error.message.includes('Validation failed')) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        400
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    // Validar datos requeridos
    if (!email || !password) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } },
        400
      );
    }

    // Login
    const result = await AuthService.login(email, password);

    return c.json(result, 200);
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message.includes('Invalid credentials')) {
      return c.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        401
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', async (c) => {
  const result = AuthService.logout();
  return c.json(result, 200);
});

export default authRoutes;
