import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import UserService from '../services/UserService';
import UserDinerPreferencesService from '../services/UserDinerPreferencesService';

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
  } catch (error: unknown) {
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

    const updateData: { email?: string; name?: string; defaultDiners?: number } = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (defaultDiners !== undefined) updateData.defaultDiners = defaultDiners;

    const updatedUser = await UserService.updateUser(userId, updateData);

    // Retornar usuario sin contraseña
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return c.json({ user: userWithoutPassword }, 200);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update user error:', err);

    if (err.message.includes('not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    if (err.message.includes('Email already exists')) {
      return c.json(
        { error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' } },
        400
      );
    }

    if (err.message.includes('Validation failed')) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: err.message } },
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update preferences error:', err);

    if (err.message.includes('not found')) {
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
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete user error:', err);

    if (err.message.includes('not found')) {
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

// ==================== DINER PREFERENCES ROUTES ====================

// GET /api/users/:userId/diner-preferences/:mealType
userRoutes.get('/:userId/diner-preferences/:mealType', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    const mealType = c.req.param('mealType') as 'lunch' | 'dinner';
    const authenticatedUserId = c.get('userId');

    // Verify user can only access their own preferences
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: 'Access denied to this resource' },
        403
      );
    }

    // Validate meal type
    if (mealType !== 'lunch' && mealType !== 'dinner') {
      return c.json(
        { error: 'Invalid meal type. Must be "lunch" or "dinner"' },
        400
      );
    }

    const familyMemberIds = await UserDinerPreferencesService.getPreferences(userId, mealType);
    return c.json({ familyMemberIds }, 200);
  } catch (error: unknown) {
    console.error('Get diner preferences error:', error);
    return c.json(
      { error: 'Failed to get diner preferences' },
      500
    );
  }
});

// POST /api/users/:userId/diner-preferences/:mealType
userRoutes.post('/:userId/diner-preferences/:mealType', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    const mealType = c.req.param('mealType') as 'lunch' | 'dinner';
    const authenticatedUserId = c.get('userId');
    const { familyMemberIds } = await c.req.json();

    // Verify user can only modify their own preferences
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: 'Access denied to this resource' },
        403
      );
    }

    // Validate meal type
    if (mealType !== 'lunch' && mealType !== 'dinner') {
      return c.json(
        { error: 'Invalid meal type. Must be "lunch" or "dinner"' },
        400
      );
    }

    // Validate familyMemberIds
    if (!Array.isArray(familyMemberIds)) {
      return c.json(
        { error: 'familyMemberIds must be an array' },
        400
      );
    }

    // Filter out the user's own ID from familyMemberIds
    // The user is included in the frontend selector but shouldn't be saved as a family member preference
    const filteredFamilyMemberIds = familyMemberIds.filter(id => id !== userId);

    await UserDinerPreferencesService.setPreferences(userId, mealType, filteredFamilyMemberIds);
    return c.json({ success: true }, 200);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Set diner preferences error:', err);
    
    if (err.message.includes('Invalid family member ID')) {
      return c.json(
        { error: err.message },
        400
      );
    }
    
    return c.json(
      { error: 'Failed to set diner preferences' },
      500
    );
  }
});

// DELETE /api/users/:userId/diner-preferences/:mealType
userRoutes.delete('/:userId/diner-preferences/:mealType', authMiddleware, async (c) => {
  try {
    const userId = c.req.param('userId');
    const mealType = c.req.param('mealType') as 'lunch' | 'dinner';
    const authenticatedUserId = c.get('userId');

    // Verify user can only modify their own preferences
    if (userId !== authenticatedUserId) {
      return c.json(
        { error: 'Access denied to this resource' },
        403
      );
    }

    // Validate meal type
    if (mealType !== 'lunch' && mealType !== 'dinner') {
      return c.json(
        { error: 'Invalid meal type. Must be "lunch" or "dinner"' },
        400
      );
    }

    await UserDinerPreferencesService.clearPreferences(userId, mealType);
    return c.json({ success: true }, 200);
  } catch (error: unknown) {
    console.error('Clear diner preferences error:', error);
    return c.json(
      { error: 'Failed to clear diner preferences' },
      500
    );
  }
});

export default userRoutes;
