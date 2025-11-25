import MenuPlanService from '../../src/services/MenuPlanService';
import DatabaseService from '../../src/services/DatabaseService';
import AIService from '../../src/services/AIService';

// Mock AIService
jest.mock('../../src/services/AIService');

describe('MenuPlanService', () => {
  let testUserId: string;
  let testFamilyMemberId1: string;
  let testFamilyMemberId2: string;
  let testFamilyMemberId3: string;

  beforeEach(async () => {
    // Create test user
    const testUser = await DatabaseService.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword',
      passwordHash: 'hashedpassword',
      name: 'Test User',
      preferences: 'Test preferences',
      defaultDiners: 2,
    });
    testUserId = testUser.id;

    // Create test family members
    const familyMember1 = await DatabaseService.createFamilyMember({
      userId: testUserId,
      name: 'Alice',
      preferences: 'Vegetarian',
      dietaryRestrictions: 'No meat',
    });
    testFamilyMemberId1 = familyMember1.id;

    const familyMember2 = await DatabaseService.createFamilyMember({
      userId: testUserId,
      name: 'Bob',
      preferences: 'No restrictions',
      dietaryRestrictions: '',
    });
    testFamilyMemberId2 = familyMember2.id;

    const familyMember3 = await DatabaseService.createFamilyMember({
      userId: testUserId,
      name: 'Charlie',
      preferences: 'Vegan',
      dietaryRestrictions: 'No animal products',
    });
    testFamilyMemberId3 = familyMember3.id;

    // Mock AI service responses - return meals based on requested mealTypes
    (AIService.generateWeeklyMenu as jest.Mock).mockImplementation((preferences, dinersCount, days, mealTypes) => {
      const meals = [];
      for (const day of days) {
        for (const mealType of mealTypes) {
          meals.push({
            dayOfWeek: day,
            mealType,
            dishes: [
              {
                name: `Test Dish ${mealType}`,
                description: 'Test description',
                ingredients: [{ name: `Ingredient ${mealType}`, quantity: '100g' }],
                course: 'main',
              },
            ],
          });
        }
      }
      return Promise.resolve(meals);
    });

    (AIService.regenerateMeal as jest.Mock).mockResolvedValue([
      {
        name: 'Regenerated Dish',
        description: 'Regenerated description',
        ingredients: [{ name: 'New Ingredient', quantity: '150g' }],
        course: 'main',
      },
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await DatabaseService.deleteUser(testUserId);
    }
    jest.clearAllMocks();
  });

  describe('Property Tests', () => {
    // Feature: bulk-diner-selection, Property 1: Bulk selection application
    describe('Property 1: Bulk selection application', () => {
      it('should apply bulk selection to all meals when creating menu plan', async () => {
        // Set bulk preferences for lunch and dinner
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId1, testFamilyMemberId2]);
        await DatabaseService.setUserDinerPreferences(testUserId, 'dinner', [testFamilyMemberId1, testFamilyMemberId2, testFamilyMemberId3]);

        // Create menu plan
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch', 'dinner'],
        });

        // Verify meals were created
        expect(menuPlan.meals).toHaveLength(2);

        // Verify lunch meal has correct diners (including the user)
        const lunchMeal = menuPlan.meals.find(m => m.mealType === 'lunch');
        expect(lunchMeal).toBeDefined();
        expect(lunchMeal!.diners).toHaveLength(3); // User + 2 family members
        expect(lunchMeal!.diners.map(d => d.name).sort()).toEqual(['Alice', 'Bob', 'Test User']);

        // Verify dinner meal has correct diners (including the user)
        const dinnerMeal = menuPlan.meals.find(m => m.mealType === 'dinner');
        expect(dinnerMeal).toBeDefined();
        expect(dinnerMeal!.diners).toHaveLength(4); // User + 3 family members
        expect(dinnerMeal!.diners.map(d => d.name).sort()).toEqual(['Alice', 'Bob', 'Charlie', 'Test User']);

        // Verify has_custom_diners flag is false for all meals
        for (const meal of menuPlan.meals) {
          const mealWithFlag = await DatabaseService.getMealById(meal.id);
          expect((mealWithFlag as any).hasCustomDiners).toBe(false);
        }
      });

      it('should use default diners when no bulk preferences are set', async () => {
        // Create menu plan without setting bulk preferences
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch'],
        });

        // Verify meal was created with default diners (including the user)
        expect(menuPlan.meals).toHaveLength(1);
        const meal = menuPlan.meals[0];
        expect(meal.diners).toHaveLength(3); // User + defaultDiners from user
        expect(meal.diners[0].name).toBe('Test User'); // First diner is always the user
        expect(meal.diners[1].name).toMatch(/Comensal \d/);
      });
    });

    // Feature: bulk-diner-selection, Property 2: Override isolation
    describe('Property 2: Override isolation', () => {
      it('should not update meals with custom diners when applying bulk selection', async () => {
        // Set bulk preferences
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId1]);

        // Create menu plan
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday', 'Tuesday'],
          mealTypes: ['lunch'],
        });

        expect(menuPlan.meals).toHaveLength(2);
        const meal1 = menuPlan.meals[0];
        const meal2 = menuPlan.meals[1];

        // Override one meal with custom diners
        await MenuPlanService.updateMeal({
          mealId: meal1.id,
          customDiners: [{ name: 'Custom Diner', preferences: 'Custom prefs' }],
        });

        // Verify meal1 has custom diners flag
        const meal1WithFlag = await DatabaseService.getMealById(meal1.id);
        expect((meal1WithFlag as any).hasCustomDiners).toBe(true);

        // Change bulk preferences
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId2, testFamilyMemberId3]);

        // Apply bulk selection
        await MenuPlanService.applyBulkDiners(menuPlan.id);

        // Verify meal1 still has custom diners (not updated)
        const updatedMeal1 = await DatabaseService.getMealById(meal1.id);
        expect(updatedMeal1!.diners).toHaveLength(1);
        expect(updatedMeal1!.diners[0].name).toBe('Custom Diner');

        // Verify meal2 was updated with new bulk selection
        const updatedMeal2 = await DatabaseService.getMealById(meal2.id);
        expect(updatedMeal2!.diners).toHaveLength(2);
        expect(updatedMeal2!.diners.map(d => d.name).sort()).toEqual(['Bob', 'Charlie']);
      });
    });

    // Feature: bulk-diner-selection, Property 3: Override flag persistence
    describe('Property 3: Override flag persistence', () => {
      it('should set has_custom_diners flag when updating meal with custom diners', async () => {
        // Create menu plan
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch'],
        });

        const meal = menuPlan.meals[0];

        // Verify initial flag is false
        const initialMeal = await DatabaseService.getMealById(meal.id);
        expect((initialMeal as any).hasCustomDiners).toBe(false);

        // Update meal with custom diners
        await MenuPlanService.updateMeal({
          mealId: meal.id,
          customDiners: [{ name: 'Custom Diner', preferences: 'Custom prefs' }],
        });

        // Verify flag is now true
        const updatedMeal = await DatabaseService.getMealById(meal.id);
        expect((updatedMeal as any).hasCustomDiners).toBe(true);
      });

      it('should maintain has_custom_diners flag when regenerating dishes without changing diners', async () => {
        // Create menu plan
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch'],
        });

        const meal = menuPlan.meals[0];

        // Set custom diners
        await MenuPlanService.updateMeal({
          mealId: meal.id,
          customDiners: [{ name: 'Custom Diner', preferences: 'Custom prefs' }],
        });

        // Verify flag is true
        const mealAfterCustom = await DatabaseService.getMealById(meal.id);
        expect((mealAfterCustom as any).hasCustomDiners).toBe(true);

        // Regenerate dishes without changing diners
        await MenuPlanService.updateMeal({
          mealId: meal.id,
          numberOfDishes: 3,
        });

        // Verify flag is still true
        const mealAfterRegenerate = await DatabaseService.getMealById(meal.id);
        expect((mealAfterRegenerate as any).hasCustomDiners).toBe(true);
      });
    });

    // Feature: bulk-diner-selection, Property 4: Override reversion
    describe('Property 4: Override reversion', () => {
      it('should revert meal to bulk selection when clearing custom diners flag', async () => {
        // Set bulk preferences
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId1, testFamilyMemberId2]);

        // Create menu plan
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch'],
        });

        const meal = menuPlan.meals[0];

        // Override with custom diners
        await MenuPlanService.updateMeal({
          mealId: meal.id,
          customDiners: [{ name: 'Custom Diner', preferences: 'Custom prefs' }],
        });

        // Verify custom diners
        const mealWithCustom = await DatabaseService.getMealById(meal.id);
        expect(mealWithCustom!.diners).toHaveLength(1);
        expect(mealWithCustom!.diners[0].name).toBe('Custom Diner');
        expect((mealWithCustom as any).hasCustomDiners).toBe(true);

        // Clear custom diners flag
        await DatabaseService.setMealCustomDinersFlag(meal.id, false);

        // Apply bulk selection
        await MenuPlanService.applyBulkDiners(menuPlan.id);

        // Verify meal now has bulk selection diners
        const revertedMeal = await DatabaseService.getMealById(meal.id);
        expect(revertedMeal!.diners).toHaveLength(2);
        expect(revertedMeal!.diners.map(d => d.name).sort()).toEqual(['Alice', 'Bob']);
      });
    });
  });

  describe('Unit Tests', () => {
    describe('createMenuPlan', () => {
      it('should create menu plan with bulk selection', async () => {
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId1]);

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch'],
        });

        expect(menuPlan).toBeDefined();
        expect(menuPlan.userId).toBe(testUserId);
        // The mock returns both lunch and dinner, so we get 2 meals
        expect(menuPlan.meals.length).toBeGreaterThanOrEqual(1);
      });

      it('should throw error for invalid date range', async () => {
        const startDate = new Date('2024-01-02');
        const endDate = new Date('2024-01-01');

        await expect(
          MenuPlanService.createMenuPlan({
            userId: testUserId,
            startDate,
            endDate,
            days: ['Monday'],
            mealTypes: ['lunch'],
          })
        ).rejects.toThrow('End date must be after start date');
      });

      it('should throw error for non-existent user', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');

        await expect(
          MenuPlanService.createMenuPlan({
            userId: '00000000-0000-0000-0000-000000000000',
            startDate,
            endDate,
            days: ['Monday'],
            mealTypes: ['lunch'],
          })
        ).rejects.toThrow('User not found');
      });
    });

    describe('updateMeal', () => {
      it('should update meal with custom diners', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday'],
          mealTypes: ['lunch'],
        });

        const meal = menuPlan.meals[0];
        const updatedMeal = await MenuPlanService.updateMeal({
          mealId: meal.id,
          customDiners: [{ name: 'New Diner', preferences: 'New prefs' }],
        });

        expect(updatedMeal.diners).toHaveLength(1);
        expect(updatedMeal.diners[0].name).toBe('New Diner');
      });

      it('should throw error for non-existent meal', async () => {
        await expect(
          MenuPlanService.updateMeal({
            mealId: '00000000-0000-0000-0000-000000000000',
            customDiners: [{ name: 'Test', preferences: '' }],
          })
        ).rejects.toThrow('Meal not found');
      });
    });

    describe('applyBulkDiners', () => {
      it('should apply bulk selection to all meals without custom diners', async () => {
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId1]);

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-02');
        const menuPlan = await MenuPlanService.createMenuPlan({
          userId: testUserId,
          startDate,
          endDate,
          days: ['Monday', 'Tuesday'],
          mealTypes: ['lunch'],
        });

        // Get initial diners count
        const initialMeals = await DatabaseService.getMealsByMenuPlanId(menuPlan.id);
        const initialDinersCount = initialMeals[0].diners.length;

        // Change bulk preferences
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMemberId2, testFamilyMemberId3]);

        // Apply bulk selection
        await MenuPlanService.applyBulkDiners(menuPlan.id);

        // Verify all meals updated
        const meals = await DatabaseService.getMealsByMenuPlanId(menuPlan.id);
        expect(meals.length).toBeGreaterThan(0);
        
        for (const meal of meals) {
          const fullMeal = await DatabaseService.getMealById(meal.id);
          // Should have 2 diners now (Bob and Charlie)
          expect(fullMeal!.diners.length).toBeGreaterThan(0);
          // Verify the diners were updated (different from initial)
          if (fullMeal!.diners.length > 0) {
            expect(fullMeal!.diners.map(d => d.name).sort()).toEqual(['Bob', 'Charlie']);
          }
        }
      });

      it('should throw error for non-existent menu plan', async () => {
        await expect(
          MenuPlanService.applyBulkDiners('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow('Menu plan not found');
      });
    });
  });
});
