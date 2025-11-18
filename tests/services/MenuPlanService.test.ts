import MenuPlanService from '../../src/services/MenuPlanService';
import DatabaseService from '../../src/services/DatabaseService';
import AIService from '../../src/services/AIService';
import UserService from '../../src/services/UserService';
import { CreateUserDTO } from '../../src/models';

// Mock AIService
jest.mock('../../src/services/AIService');
const MockedAIService = AIService as jest.Mocked<typeof AIService>;

describe('MenuPlanService', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    const userData: CreateUserDTO = {
      email: 'menuplan@test.com',
      password: 'password123',
      name: 'Menu Plan Test User',
      preferences: 'Vegetarian, no nuts',
      defaultDiners: 2,
    };

    const { user } = await UserService.createUser(userData);
    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUserId) {
      await DatabaseService.deleteUser(testUserId);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMenuPlan', () => {
    it('should create menu plan successfully', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'monday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd1',
              mealId: 'm1',
              name: 'Vegetable Pasta',
              description: 'Healthy pasta',
              ingredients: ['pasta', 'tomatoes', 'basil'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const request = {
        userId: testUserId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        days: ['monday'],
        mealTypes: ['lunch' as const],
      };

      const result = await MenuPlanService.createMenuPlan(request);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.meals).toHaveLength(1);
      expect(result.meals[0].dayOfWeek).toBe('monday');
      expect(result.meals[0].dishes[0].name).toBe('Vegetable Pasta');
      expect(MockedAIService.generateWeeklyMenu).toHaveBeenCalledTimes(1);
    });

    it('should create menu plan with custom diners', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'tuesday',
          mealType: 'dinner' as const,
          dishes: [
            {
              id: 'd2',
              mealId: 'm2',
              name: 'Vegan Salad',
              description: 'Fresh salad',
              ingredients: ['lettuce', 'tomatoes'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const 
request = {
        userId: testUserId,
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-03'),
        days: ['tuesday'],
        mealTypes: ['dinner' as const],
        customDiners: [
          { name: 'Alice', preferences: 'Vegan' },
          { name: 'Bob' },
        ],
      };

      const result = await MenuPlanService.createMenuPlan(request);

      expect(result).toBeDefined();
      expect(result.meals[0].diners).toHaveLength(2);
      expect(result.meals[0].diners[0].name).toBe('Alice');
      expect(result.meals[0].diners[0].preferences).toBe('Vegan');
    });

    it('should throw error for non-existent user', async () => {
      const request = {
        userId: '00000000-0000-0000-0000-000000000000',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        days: ['monday'],
        mealTypes: ['lunch' as const],
      };

      await expect(MenuPlanService.createMenuPlan(request)).rejects.toThrow('User not found');
    });

    it('should throw error for invalid date range', async () => {
      const request = {
        userId: testUserId,
        startDate: new Date('2024-01-07'),
        endDate: new Date('2024-01-01'),
        days: ['monday'],
        mealTypes: ['lunch' as const],
      };

      await expect(MenuPlanService.createMenuPlan(request)).rejects.toThrow(
        'End date must be after start date'
      );
    });

    it('should throw error for too many days', async () => {
      const request = {
        userId: testUserId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-20'),
        days: ['monday'],
        mealTypes: ['lunch' as const],
      };

      await expect(MenuPlanService.createMenuPlan(request)).rejects.toThrow(
        'Maximum 14 days allowed per menu plan'
      );
    });

    it('should throw error for invalid diners configuration', async () => {
      const request = {
        userId: testUserId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        days: ['monday'],
        mealTypes: ['lunch' as const],
        customDiners: [{ name: '', preferences: '' }],
      };

      await expect(MenuPlanService.createMenuPlan(request)).rejects.toThrow(
        'All diners must have a name'
      );
    });

    it('should handle AI service failure', async () => {
      MockedAIService.generateWeeklyMenu.mockRejectedValue(new Error('AI service error'));

      const request = {
        userId: testUserId,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        days: ['monday'],
        mealTypes: ['lunch' as const],
      };

      await expect(MenuPlanService.createMenuPlan(request)).rejects.toThrow(
        'Failed to generate menu'
      );
    });
  });

  describe('getMenuPlanById', () => {
    it('should get menu plan by id', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'wednesday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd3',
              mealId: 'm3',
              name: 'Test Dish',
              description: 'Test',
              ingredients: ['test'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const createRequest = {
        userId: testUserId,
        startDate: new Date('2024-01-03'),
        endDate: new Date('2024-01-04'),
        days: ['wednesday'],
        mealTypes: ['lunch' as const],
      };

      const created = await MenuPlanService.createMenuPlan(createRequest);
      const result = await MenuPlanService.getMenuPlanById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    it('should return null for non-existent plan', async () => {
      const result = await MenuPlanService.getMenuPlanById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('updateMeal', () => {
    it('should update meal successfully', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'thursday',
          mealType: 'dinner' as const,
          dishes: [
            {
              id: 'd4',
              mealId: 'm4',
              name: 'Original Dish',
              description: 'Original',
              ingredients: ['original'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const createRequest = {
        userId: testUserId,
        startDate: new Date('2024-01-04'),
        endDate: new Date('2024-01-05'),
        days: ['thursday'],
        mealTypes: ['dinner' as const],
      };

      const created = await MenuPlanService.createMenuPlan(createRequest);
      const mealId = created.meals[0].id;

      const mockRegeneratedDishes = [
        {
          id: 'd5',
          mealId,
          name: 'Updated Dish',
          description: 'Updated',
          ingredients: ['updated'],
          course: 'main' as const,
        },
      ];

      MockedAIService.regenerateMeal.mockResolvedValue(mockRegeneratedDishes);

      const updateRequest = {
        mealId,
        numberOfDishes: 1,
      };

      const result = await MenuPlanService.updateMeal(updateRequest);

      expect(result).toBeDefined();
      expect(result.dishes[0].name).toBe('Updated Dish');
      expect(MockedAIService.regenerateMeal).toHaveBeenCalledTimes(1);
    });

    it('should update meal with custom diners', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'friday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd6',
              mealId: 'm6',
              name: 'Original',
              description: 'Original',
              ingredients: ['original'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const createRequest = {
        userId: testUserId,
        startDate: new Date('2024-01-05'),
        endDate: new Date('2024-01-06'),
        days: ['friday'],
        mealTypes: ['lunch' as const],
      };

      const created = await MenuPlanService.createMenuPlan(createRequest);
      const mealId = created.meals[0].id;

      const mockRegeneratedDishes = [
        {
          id: 'd7',
          mealId,
          name: 'Custom Dish',
          description: 'Custom',
          ingredients: ['custom'],
          course: 'main' as const,
        },
      ];

      MockedAIService.regenerateMeal.mockResolvedValue(mockRegeneratedDishes);

      const updateRequest = {
        mealId,
        customDiners: [{ name: 'Charlie', preferences: 'Gluten-free' }],
      };

      const result = await MenuPlanService.updateMeal(updateRequest);

      expect(result).toBeDefined();
      expect(result.diners).toHaveLength(1);
      expect(result.diners[0].name).toBe('Charlie');
    });

    it('should throw error for non-existent meal', async () => {
      const updateRequest = {
        mealId: '00000000-0000-0000-0000-000000000000',
      };

      await expect(MenuPlanService.updateMeal(updateRequest)).rejects.toThrow('Meal not found');
    });

    it('should throw error for confirmed plan', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'saturday',
          mealType: 'dinner' as const,
          dishes: [
            {
              id: 'd8',
              mealId: 'm8',
              name: 'Test',
              description: 'Test',
              ingredients: ['test'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const createRequest = {
        userId: testUserId,
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-07'),
        days: ['saturday'],
        mealTypes: ['dinner' as const],
      };

      const created = await MenuPlanService.createMenuPlan(createRequest);
      await MenuPlanService.confirmMenuPlan(created.id);

      const updateRequest = {
        mealId: created.meals[0].id,
      };

      await expect(MenuPlanService.updateMeal(updateRequest)).rejects.toThrow(
        'Cannot update meals in a confirmed plan'
      );
    });
  });

  describe('confirmMenuPlan', () => {
    it('should confirm menu plan successfully', async () => {
      const mockGeneratedMeals = [
        {
          dayOfWeek: 'sunday',
          mealType: 'lunch' as const,
          dishes: [
            {
              id: 'd9',
              mealId: 'm9',
              name: 'Test',
              description: 'Test',
              ingredients: ['test'],
              course: 'main' as const,
            },
          ],
        },
      ];

      MockedAIService.generateWeeklyMenu.mockResolvedValue(mockGeneratedMeals);

      const createRequest = {
        userId: testUserId,
        startDate: new Date('2024-01-07'),
        endDate: new Date('2024-01-08'),
        days: ['sunday'],
        mealTypes: ['lunch' as const],
      };

      const created = await MenuPlanService.createMenuPlan(createRequest);
      const result = await MenuPlanService.confirmMenuPlan(created.id);

      expect(result).toBeDefined();
      expect(result.status).toBe('confirmed');
    });

    it('should throw error for non-existent plan', async () => {
      await expect(
        MenuPlanService.confirmMenuPlan('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Menu plan not found');
    });
  });

  describe('validateDinersConfiguration', () => {
    it('should validate correct diners configuration', () => {
      const diners = [
        { name: 'Alice', preferences: 'Vegan' },
        { name: 'Bob' },
      ];

      const errors = MenuPlanService.validateDinersConfiguration(diners);
      expect(errors).toHaveLength(0);
    });

    it('should return error for empty diners array', () => {
      const errors = MenuPlanService.validateDinersConfiguration([]);
      expect(errors).toContain('At least one diner is required');
    });

    it('should return error for too many diners', () => {
      const diners = Array(21).fill({ name: 'Test' });
      const errors = MenuPlanService.validateDinersConfiguration(diners);
      expect(errors).toContain('Maximum 20 diners allowed');
    });

    it('should return error for empty name', () => {
      const diners = [{ name: '', preferences: '' }];
      const errors = MenuPlanService.validateDinersConfiguration(diners);
      expect(errors).toContain('All diners must have a name');
    });

    it('should return error for long name', () => {
      const diners = [{ name: 'a'.repeat(101), preferences: '' }];
      const errors = MenuPlanService.validateDinersConfiguration(diners);
      expect(errors).toContain('Diner names must be less than 100 characters');
    });

    it('should return error for long preferences', () => {
      const diners = [{ name: 'Test', preferences: 'a'.repeat(501) }];
      const errors = MenuPlanService.validateDinersConfiguration(diners);
      expect(errors).toContain('Diner preferences must be less than 500 characters');
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const errors = MenuPlanService.validateDateRange(startDate, endDate);
      expect(errors).toHaveLength(0);
    });

    it('should return error for end date before start date', () => {
      const startDate = new Date('2024-01-07');
      const endDate = new Date('2024-01-01');
      const errors = MenuPlanService.validateDateRange(startDate, endDate);
      expect(errors).toContain('End date must be after start date');
    });

    it('should return error for too many days', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-20');
      const errors = MenuPlanService.validateDateRange(startDate, endDate);
      expect(errors).toContain('Maximum 14 days allowed per menu plan');
    });

    it('should return error for same dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');
      const errors = MenuPlanService.validateDateRange(startDate, endDate);
      expect(errors).toContain('End date must be after start date');
    });
  });
});
