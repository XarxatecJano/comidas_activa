import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import DatabaseService from '../src/services/DatabaseService';
import MenuPlanService from '../src/services/MenuPlanService';
import AIService from '../src/services/AIService';

jest.setTimeout(30000);

describe('Shopping List Calculation with Bulk Diners', () => {
    let testUserId: string;
    let testFamilyMember1Id: string;
    let testFamilyMember2Id: string;
    let testMenuPlanId: string;

    beforeEach(async () => {
        // Create test user
        const user = await DatabaseService.createUser({
            email: `test-shopping-${Date.now()}@example.com`,
            password: 'password123',
            name: 'Test User',
            passwordHash: '$2b$10$test',
        });
        testUserId = user.id;

        // Create test family members
        const member1 = await DatabaseService.createFamilyMember({
            userId: testUserId,
            name: 'Member 1',
            preferences: 'None',
        });
        testFamilyMember1Id = member1.id;

        const member2 = await DatabaseService.createFamilyMember({
            userId: testUserId,
            name: 'Member 2',
            preferences: 'None',
        });
        testFamilyMember2Id = member2.id;

        // Set bulk preferences: Lunch = Member 1, Dinner = Member 1 & 2
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);
        await DatabaseService.setUserDinerPreferences(testUserId, 'dinner', [testFamilyMember1Id, testFamilyMember2Id]);
    });

    afterEach(async () => {
        if (testUserId) {
            await DatabaseService.deleteUser(testUserId);
        }
    });

    it('should correctly resolve diners for shopping list generation', async () => {
        // Create menu plan
        let menuPlan;
        try {
            menuPlan = await MenuPlanService.createMenuPlan({
                userId: testUserId,
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-02-02'), // 1 day
                days: ['thursday'],
                mealTypes: ['lunch', 'dinner'],
            });
        } catch (error) {
            console.error('Error creating menu plan:', error);
            throw error;
        }
        testMenuPlanId = menuPlan.id;

        // Verify meals created
        const meals = await DatabaseService.getMealsByMenuPlanId(testMenuPlanId);
        expect(meals).toHaveLength(2);

        // Verify raw diners are empty (because they use bulk selection)
        // This confirms we are testing the right scenario
        const lunchMeal = meals.find(m => m.mealType === 'lunch');
        const dinnerMeal = meals.find(m => m.mealType === 'dinner');

        expect(lunchMeal?.diners).toHaveLength(1);
        expect(dinnerMeal?.diners).toHaveLength(2);

        // Now generate shopping list (simulated via AIService -> MockAIService)
        // We need to verify that AIService receives resolved diners

        // Since we can't easily spy on AIService internal calls in this integration test without mocking,
        // we will check if we can fetch the menu plan with resolved diners using a new method we plan to implement
        // or verify if getMealsByMenuPlanId returns resolved diners (if we decide to change it).

        // For now, let's assume we want getMealsByMenuPlanId to return resolved diners
        // OR we introduce a new method MenuPlanService.getMenuPlanWithResolvedDiners(id)

        // Let's try to use the method we are going to implement/modify
        const resolvedMeals = await DatabaseService.getMealsByMenuPlanId(testMenuPlanId);

        // This expectation will FAIL currently, which is what we want
        const resolvedLunch = resolvedMeals.find(m => m.mealType === 'lunch');
        const resolvedDinner = resolvedMeals.find(m => m.mealType === 'dinner');

        expect(resolvedLunch?.diners).toHaveLength(1); // Should be Member 1
        expect(resolvedDinner?.diners).toHaveLength(2); // Should be Member 1 & 2
    });

    it('should reflect updated preferences in shopping list (dynamic resolution)', async () => {
        // Create menu plan with initial preferences (Lunch=Member1)
        let menuPlan;
        try {
            menuPlan = await MenuPlanService.createMenuPlan({
                userId: testUserId,
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-02-02'),
                days: ['thursday'],
                mealTypes: ['lunch'],
            });
        } catch (error) {
            console.error('Error creating menu plan:', error);
            throw error;
        }

        // Change preferences: Lunch = Member 1 & 2
        await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id, testFamilyMember2Id]);

        // Fetch meals again (should reflect new preferences if dynamic)
        const meals = await DatabaseService.getMealsByMenuPlanId(menuPlan.id);
        const lunchMeal = meals.find(m => m.mealType === 'lunch');

        // This expectation will fail if we use snapshot, pass if we use dynamic
        expect(lunchMeal?.diners).toHaveLength(2);
        expect(lunchMeal?.diners.map(d => d.name)).toContain('Member 2');
    });
});
