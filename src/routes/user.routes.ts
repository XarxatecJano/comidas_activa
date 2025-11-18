import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import UserService from '../services/UserService';

type Variables = {
  userId: string;
  userEmail: string;
};

const userRoutes = new Hono<{ Variables: Variables }>();

// Aplicar middleware de autenticación a todas las rutas
userRoutes.use('/*', authMiddleware);

// GET /api/users/:id - Obtener datos del usuario
userRoutes.get('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const authenticatedUserId = c.get('userId');

    // Verificar que el usuario solo pueda acceder a sus propios datos
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    const user = await UserService.getUserById(userId);
    
    if (!user) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    // Retornar usuario sin contraseña
    const { passwordHash, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword }, 200);
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// PUT /api/users/:id - Actualizar datos del usuario
userRoutes.put('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const authenticatedUserId = c.get('userId');

    // Verificar que el usuario solo pueda actualizar sus propios datos
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    const body = await c.req.json();
    const { email, name, defaultDiners } = body;

    // Validar que al menos un campo esté presente
    if (!email && !name && defaultDiners === undefined) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'At least one field is required' } },
        400
      );
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (defaultDiners !== undefined) updateData.defaultDiners = defaultDiners;

    const updatedUser = await UserService.updateUser(userId, updateData);

    // Retornar usuario sin contraseña
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return c.json({ user: userWithoutPassword }, 200);
  } catch (error: any) {
    console.error('Update user error:', error);

    if (error.message.includes('not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

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

// PUT /api/users/:id/preferences - Actualizar preferencias del usuario
userRoutes.put('/:id/preferences', async (c) => {
  try {
    const userId = c.req.param('id');
    const authenticatedUserId = c.get('userId');

    // Verificar que el usuario solo pueda actualizar sus propias preferencias
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    const body = await c.req.json();
    const { preferences } = body;

    if (preferences === undefined) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Preferences field is required' } },
        400
      );
    }

    const updatedUser = await UserService.updatePreferences(userId, preferences);

    // Retornar usuario sin contraseña
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return c.json({ user: userWithoutPassword }, 200);
  } catch (error: any) {
    console.error('Update preferences error:', error);

    if (error.message.includes('not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// DELETE /api/users/:id - Eliminar cuenta de usuario
userRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.req.param('id');
    const authenticatedUserId = c.get('userId');

    // Verificar que el usuario solo pueda eliminar su propia cuenta
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    await UserService.deleteUser(userId);

    return c.json({ message: 'User deleted successfully' }, 200);
  } catch (error: any) {
    console.error('Delete user error:', error);

    if (error.message.includes('not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

export default userRoutes;
