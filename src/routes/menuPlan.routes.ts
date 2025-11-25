import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import MenuPlanService from '../services/MenuPlanService';
import DatabaseService from '../services/DatabaseService';

type Variables = {
  userId: string;
  userEmail: string;
};

const menuPlanRoutes = new Hono<{ Variables: Variables }>();

// Aplicar middleware de autenticación a todas las rutas
menuPlanRoutes.use('/*', authMiddleware);

// POST /api/menu-plans - Crear nueva planificación
menuPlanRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { startDate, endDate, days, mealTypes, customDiners } = body;

    // Validar campos requeridos
    if (!startDate || !endDate || !days || !mealTypes) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'startDate, endDate, days, and mealTypes are required' } },
        400
      );
    }

    // Convertir fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    const menuPlan = await MenuPlanService.createMenuPlan({
      userId,
      startDate: start,
      endDate: end,
      days,
      mealTypes,
      customDiners,
    });

    return c.json({ menuPlan }, 201);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create menu plan error:', err);

    if (err.message.includes('User not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    if (err.message.includes('End date must be after start date') ||
        err.message.includes('Maximum') ||
        err.message.includes('Minimum') ||
        err.message.includes('diner')) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: err.message } },
        400
      );
    }

    if (err.message.includes('Failed to generate menu')) {
      return c.json(
        { error: { code: 'AI_ERROR', message: err.message } },
        500
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// GET /api/menu-plans/:id - Obtener planificación
menuPlanRoutes.get('/:id', async (c) => {
  try {
    const planId = c.req.param('id');
    const userId = c.get('userId');

    const menuPlan = await MenuPlanService.getMenuPlanById(planId);

    if (!menuPlan) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Menu plan not found' } },
        404
      );
    }

    // Verificar que el usuario sea el propietario
    if (menuPlan.userId !== userId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    return c.json({ menuPlan }, 200);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Get menu plan error:', err);
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// PUT /api/menu-plans/:id/meals/:mealId - Actualizar comida específica
menuPlanRoutes.put('/:id/meals/:mealId', async (c) => {
  try {
    const planId = c.req.param('id');
    const mealId = c.req.param('mealId');
    const userId = c.get('userId');
    const body = await c.req.json();
    const { numberOfDishes, familyMemberIds, customDiners } = body;

    // Verificar que el plan existe y pertenece al usuario
    const menuPlan = await MenuPlanService.getMenuPlanById(planId);

    if (!menuPlan) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Menu plan not found' } },
        404
      );
    }

    if (menuPlan.userId !== userId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    // Convert familyMemberIds to customDiners format if provided
    let dinersToUse = customDiners;
    if (familyMemberIds && familyMemberIds.length > 0) {
      dinersToUse = familyMemberIds;
    }

    const updatedMeal = await MenuPlanService.updateMeal({
      mealId,
      numberOfDishes,
      customDiners: dinersToUse,
    });

    return c.json({ meal: updatedMeal }, 200);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update meal error:', err);

    if (err.message.includes('Meal not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Meal not found' } },
        404
      );
    }

    if (err.message.includes('Cannot update meals in a confirmed plan')) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot update meals in a confirmed plan' } },
        403
      );
    }

    if (err.message.includes('diner')) {
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

// POST /api/menu-plans/:id/confirm - Confirmar planificación
menuPlanRoutes.post('/:id/confirm', async (c) => {
  try {
    const planId = c.req.param('id');
    const userId = c.get('userId');

    // Verificar que el plan existe y pertenece al usuario
    const menuPlan = await MenuPlanService.getMenuPlanById(planId);

    if (!menuPlan) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Menu plan not found' } },
        404
      );
    }

    if (menuPlan.userId !== userId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    const confirmedPlan = await MenuPlanService.confirmMenuPlan(planId);

    return c.json({ menuPlan: confirmedPlan }, 200);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Confirm menu plan error:', err);

    if (err.message.includes('not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Menu plan not found' } },
        404
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// POST /api/menu-plans/:planId/meals/:mealId/revert-diners
menuPlanRoutes.post('/:planId/meals/:mealId/revert-diners', async (c) => {
  try {
    const planId = c.req.param('planId');
    const mealId = c.req.param('mealId');
    const userId = c.get('userId');

    // Verify user owns the plan
    const plan = await MenuPlanService.getMenuPlanById(planId);
    if (!plan) {
      return c.json(
        { error: 'Menu plan not found' },
        404
      );
    }

    if (plan.userId !== userId) {
      return c.json(
        { error: 'Access denied to this resource' },
        403
      );
    }

    // Check if plan is confirmed (cannot modify confirmed plans)
    if (plan.status === 'confirmed') {
      return c.json(
        { error: 'Cannot modify confirmed menu plan' },
        403
      );
    }

    // Clear custom diners flag and revert to bulk selection
    await DatabaseService.setMealCustomDinersFlag(mealId, false);
    
    // Get the updated meal with resolved diners
    const updatedMeal = await DatabaseService.getMealWithResolvedDiners(mealId);
    
    return c.json({ meal: updatedMeal }, 200);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Revert meal diners error:', err);
    
    if (err.message.includes('not found')) {
      return c.json(
        { error: 'Meal not found' },
        404
      );
    }
    
    return c.json(
      { error: 'Failed to revert meal diners' },
      500
    );
  }
});

export default menuPlanRoutes;
