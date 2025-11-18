import { Hono } from 'hono';
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

describe('MenuPlan Routes', () => {
  let app: Hono;
  let testUserId: string;
  let testToken: string;
  let otherUserId: string;
  let otherToken: string;

  beforeAll(async () => {
    app = new Hono();
    app.route('/api/menu-plans', menuPlanRoutes);

    // Crear usuario de prueba
    const { user } = await UserService.createUser({
      email: 'menuplanroutes@test.com',
      password: 'password123',
      name: 'MenuPlan Routes Test',
      preferences: 'Vegetarian',
      defaultDiners: 2,
    });
    testUserId = user.id;
    testToken = AuthService.generateToken({ userId: user.id, email: user.email });

    // Crear otro usuario
    const { user: otherUser } = await UserService.createUser({
      email: 'otherplan@test.com',
      password: 'password123',
      name: 'Other Plan User',
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

  describe('POST /api/menu-plans', () => {
    it('should create menu plan successfully', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'monday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd1',
              mealId: 'm1',
              name: 'Test Dish',
              description: 'Test',
              ingredients: ['test'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const planData = {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        days: ['monday'],
        mealTypes: ['lunch'],
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(201);
      expect(data.menuPlan).toBeDefined();
      expect(data.menuPlan.userId).toBe(testUserId);
      expect(data.menuPlan.meals).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const planData = {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        days: ['monday'],
        mealTypes: ['lunch'],
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const planData = {
        startDate: '2024-01-01',
        // Missing endDate, days, mealTypes
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date range', async () => {
      const planData = {
        startDate: '2024-01-07',
        endDate: '2024-01-01',
        days: ['monday'],
        mealTypes: ['lunch'],
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/menu-plans/:id', () => {
    let testPlanId: string;

    beforeEach(async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'tuesday',
          mealType: 'dinner' as const,
          dishes: [
            {
              id: 'd2',
              mealId: 'm2',
              name: 'Test Dish 2',
              description: 'Test',
              ingredients: ['test'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const planData = {
        startDate: '2024-01-02',
        endDate: '2024-01-03',
        days: ['tuesday'],
        mealTypes: ['dinner'],
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);
      testPlanId = data.menuPlan.id;
    });

    it('should get menu plan successfully', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.menuPlan).toBeDefined();
      expect(data.menuPlan.id).toBe(testPlanId);
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}`, {
        method: 'GET',
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when accessing other user plan', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}`, {
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

    it('should return 404 for non-existent plan', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const req = new Request(`http://localhost/api/menu-plans/${fakeId}`, {
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

  describe('PUT /api/menu-plans/:id/meals/:mealId', () => {
    let testPlanId: string;
    let testMealId: string;

    beforeEach(async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'wednesday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd3',
              mealId: 'm3',
              name: 'Original Dish',
              description: 'Original',
              ingredients: ['original'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const planData = {
        startDate: '2024-01-03',
        endDate: '2024-01-04',
        days: ['wednesday'],
        mealTypes: ['lunch'],
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);
      testPlanId = data.menuPlan.id;
      testMealId = data.menuPlan.meals[0].id;
    });

    it('should update meal successfully', async () => {
      const mockRegeneratedDishes = [
        {
          id: 'd4',
          mealId: testMealId,
          name: 'Updated Dish',
          description: 'Updated',
          ingredients: ['updated'],
          course: 'main' as const,
        },
      ];

      MockedAIService.regenerateMeal.mockResolvedValue(mockRegeneratedDishes);

      const updateData = {
        numberOfDishes: 1,
      };

      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}/meals/${testMealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.meal).toBeDefined();
      expect(data.meal.dishes[0].name).toBe('Updated Dish');
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}/meals/${testMealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numberOfDishes: 1 }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when updating other user meal', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}/meals/${testMealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${otherToken}`,
        },
        body: JSON.stringify({ numberOfDishes: 1 }),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/menu-plans/:id/confirm', () => {
    let testPlanId: string;

    beforeEach(async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'thursday',
          mealType: 'dinner' as const,
          dishes: [
            {
              id: 'd5',
              mealId: 'm5',
              name: 'Test Dish 5',
              description: 'Test',
              ingredients: ['test'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const planData = {
        startDate: '2024-01-04',
        endDate: '2024-01-05',
        days: ['thursday'],
        mealTypes: ['dinner'],
      };

      const req = new Request('http://localhost/api/menu-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`,
        },
        body: JSON.stringify(planData),
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);
      testPlanId = data.menuPlan.id;
    });

    it('should confirm menu plan successfully', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(200);
      expect(data.menuPlan).toBeDefined();
      expect(data.menuPlan.status).toBe('confirmed');
    });

    it('should return 401 without token', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}/confirm`, {
        method: 'POST',
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
      expect(data.error.code).toBe('AUTH_ERROR');
    });

    it('should return 403 when confirming other user plan', async () => {
      const req = new Request(`http://localhost/api/menu-plans/${testPlanId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${otherToken}`,
        },
      });

      const res = await app.fetch(req);
      const data = await parseResponse(res);

      expect(res.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const req = new Request(`http://localhost/api/menu-plans/${fakeId}/confirm`, {
        method: 'POST',
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
