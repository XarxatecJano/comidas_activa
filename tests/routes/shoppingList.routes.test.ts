import { Hono } from 'hono';
import shoppingListRoutes from '../../src/routes/shoppingList.routes';
import menuPlanRoutes from '../../src/routes/menuPlan.routes';
import DatabaseService from '../../src/services/DatabaseService';
import UserService from '../../src/services/UserService';
import AuthService from '../../src/services/AuthService';
import AIService from '../../src/services/AIService';

// Mock AIService
jest.mock('../../src/services/AIService');
const MockedAIService = AIService as jest.Mocked<typeof AIService>;

// Helper para parsear respuestas JSON
async function parseResponse(res: Response): Promise<any> {
  return await res.json();
}

describe('ShoppingList Routes', () => {
  let app: Hono;
  let testUserId: string;
  let testToken: string;
  let otherUserId: string;
  let otherToken: string;

  beforeAll(async () => {
    app = new Hono();
    app.route('/api/menu-plans', menuPlanRoutes);
    app.route('/api/shopping-lists', shoppingListRoutes);

    // Crear usuario de prueba
    const { user } = await UserService.createUser({
      email: 'shoppinglist@test.com',
      password: 'password123',
      name: 'ShoppingList Test',
      preferences: 'Vegetarian',
      defaultDiners: 2,
    });
    testUserId = user.id;
    testToken = AuthService.generateToken({ userId: user.id, email: user.email });

    // Crear otro usuario
    const { user: otherUser } = await UserService.createUser({
      email: 'othershopping@test.com',
      password: 'password123',
      name: 'Other Shopping User',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/shopping-lists', () => {
    let confirmedPlanId: string;
    let draftPlanId: string;

    beforeEach(async () => {
      // Crear plan confirmado
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'friday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd1',
              mealId: 'm1',
              name: 'Pasta',
              description: 'Pasta dish',
              ingredients: ['pasta (200g)', 'tomato (3)', 'basil'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const planData = {
        startDate: '2024-01-05',
        endDate: '2024-01-06',
        days: ['friday'],
        mealTypes: ['lunch'],
      };

      const createReq = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const createRes = await app.fetch(createReq);
      const createData = await parseResponse(createRes);
      confirmedPlanId = createData.menuPlan.id;

      // Confirmar el plan
      const confirmReq = new Request(`http://localhost/api/menu-plans/${confirmedPlanId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });
      await app.fetch(confirmReq);

      // Crear plan sin confirmar
      const draftPlanData = {
        startDate: '2024-01-06',
        endDate: '2024-01-07',
        days: ['saturday'],
        mealTypes: ['dinner'],
      };

      const draftReq = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(draftPlanData),
      });

      const draftRes = await app.fetch(draftReq);
      const draftData = await parseResponse(draftRes);
      draftPlanId = draftData.menuPlan.id;
    });

    it('should create shopping list successfully', async () => {
      const mockShoppingItems = [
        {
          ingredient: 'Pasta',
          quantity: '200',
          unit: 'g',
        },
        {
          ingredient: 'Tomato',
          quantity: '3',
          unit: 'units',
        },
      ];

      MockedAIService.generateShoppingList.mockResolvedValue(mockShoppingItems);

      const listData = {
        menuPlanId: confirmedPlanId,
      };

      const req = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(listData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(data.shoppingList).toBeDefined();
      expect(data.shoppingList.menuPlanId).toBe(confirmedPlanId);
      expect(data.shoppingList.items).toHaveLength(2);
    });

    it('should return 401 without token', async () => {
      const listData = {
        menuPlanId: confirmedPlanId,
      };

      const req = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 400 for missing menuPlanId', async () => {
      const req = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
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

    it('should return 404 for non-existent menu plan', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const listData = {
        menuPlanId: fakeId,
      };

      const req = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(listData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for unconfirmed menu plan', async () => {
      const listData = {
        menuPlanId: draftPlanId,
      };

      const req = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(listData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('confirmed');
    });

    // Feature: bulk-diner-selection, Property 9: Shopping list quantity accuracy
    it('should call generateShoppingList with meals that have resolved diners', async () => {
      const mockShoppingItems = [
        { ingredient: 'Pasta', quantity: '200', unit: 'g' },
        { ingredient: 'Tomato', quantity: '3', unit: 'units' },
      ];

      MockedAIService.generateShoppingList.mockResolvedValue(mockShoppingItems);

      const createListReq = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ menuPlanId: confirmedPlanId }),
      });

      const createListRes = await app.fetch(createListReq);
      const createListData = await parseResponse(createListRes);

      expect(createListRes.status).toBe(201);
      expect(createListData.shoppingList).toBeDefined();

      // Verificar que generateShoppingList fue llamado con comidas que tienen diners resueltos
      expect(MockedAIService.generateShoppingList).toHaveBeenCalled();
      const callArgs = MockedAIService.generateShoppingList.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(Array.isArray(callArgs)).toBe(true);
      expect(callArgs.length).toBeGreaterThan(0);
      
      // Verificar que las comidas tienen la propiedad diners
      const firstMeal = callArgs[0] as unknown as { diners?: unknown[] };
      expect(firstMeal.diners).toBeDefined();
      expect(Array.isArray(firstMeal.diners)).toBe(true);
    });
  });

  describe('GET /api/shopping-lists/:id', () => {
    let testListId: string;
    let testPlanId: string;

    beforeEach(async () => {
      // Crear plan y confirmarlo
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'sunday',
          mealType: 'dinner' as const,
          dishes: [
            {
              id: 'd2',
              mealId: 'm2',
              name: 'Salad',
              description: 'Fresh salad',
              ingredients: ['lettuce', 'tomato'],
              course: 'starter' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const planData = {
        startDate: '2024-01-07',
        endDate: '2024-01-08',
        days: ['sunday'],
        mealTypes: ['dinner'],
      };

      const createPlanReq = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const createPlanRes = await app.fetch(createPlanReq);
      const createPlanData = await parseResponse(createPlanRes);
      testPlanId = createPlanData.menuPlan.id;

      // Confirmar plan
      const confirmReq = new Request(`http://localhost/api/menu-plans/${testPlanId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });
      await app.fetch(confirmReq);

      // Crear lista de compra
      const mockShoppingItems = [
        {
          ingredient: 'Lettuce',
          quantity: '1',
          unit: 'head',
        },
      ];

      MockedAIService.generateShoppingList.mockResolvedValue(mockShoppingItems);

      const createListReq = new Request('http://localhost/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify({ menuPlanId: testPlanId }),
      });

      const createListRes = await app.fetch(createListReq);
      const createListData = await parseResponse(createListRes);
      testListId = createListData.shoppingList.id;
    });

    it('should get shopping list successfully', async () => {
      const req = new Request(`http://localhost/api/shopping-lists/${testListId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.shoppingList).toBeDefined();
      expect(data.shoppingList.id).toBe(testListId);
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/shopping-lists/${testListId}`, {
        method: 'GET',
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when accessing other user shopping list', async () => {
      const req = new Request(`http://localhost/api/shopping-lists/${testListId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${otherToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent shopping list', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const req = new Request(`http://localhost/api/shopping-lists/${fakeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
});
