import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import AIService from '../services/AIService';
import DatabaseService from '../services/DatabaseService';
import MenuPlanService from '../services/MenuPlanService';

type Variables = {
  userId: string;
  userEmail: string;
};

const shoppingListRoutes = new Hono<{ Variables: Variables }>();

// Aplicar middleware de autenticación a todas las rutas
shoppingListRoutes.use('/*', authMiddleware);

// POST /api/shopping-lists - Generar lista de compra desde planificación confirmada
shoppingListRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { menuPlanId } = body;

    // Validar campo requerido
    if (!menuPlanId) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'menuPlanId is required' } },
        400
      );
    }

    // Verificar que el plan existe
    const menuPlan = await MenuPlanService.getMenuPlanById(menuPlanId);

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

    // Verificar que el plan esté confirmado
    if (menuPlan.status !== 'confirmed') {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Menu plan must be confirmed before generating shopping list' } },
        400
      );
    }

    // Generar lista de compra con IA
    const items = await AIService.generateShoppingList(menuPlan.meals);

    // Guardar lista de compra en la base de datos
    const shoppingList = await DatabaseService.createShoppingList({
      menuPlanId,
      items,
    });

    return c.json({ shoppingList }, 201);
  } catch (error: any) {
    console.error('Create shopping list error:', error);

    if (error.message.includes('not found')) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        404
      );
    }

    if (error.message.includes('Failed to generate shopping list')) {
      return c.json(
        { error: { code: 'AI_ERROR', message: error.message } },
        500
      );
    }

    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

// GET /api/shopping-lists/:id - Obtener lista de compra
shoppingListRoutes.get('/:id', async (c) => {
  try {
    const listId = c.req.param('id');
    const userId = c.get('userId');

    const shoppingList = await DatabaseService.getShoppingListById(listId);

    if (!shoppingList) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Shopping list not found' } },
        404
      );
    }

    // Verificar que el usuario sea el propietario del plan asociado
    const menuPlan = await MenuPlanService.getMenuPlanById(shoppingList.menuPlanId);

    if (!menuPlan) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Associated menu plan not found' } },
        404
      );
    }

    if (menuPlan.userId !== userId) {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        403
      );
    }

    return c.json({ shoppingList }, 200);
  } catch (error: any) {
    console.error('Get shopping list error:', error);
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      500
    );
  }
});

export default shoppingListRoutes;
