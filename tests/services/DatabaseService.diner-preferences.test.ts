import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import DatabaseService from '../../src/services/DatabaseService';

describe('DatabaseService - Diner Preferences Methods', () => {
  let testUserId: string;
  let testFamilyMember1Id: string;
  let testFamilyMember2Id: string;
  let testMenuPlanId: string;
  let testMealId: string;

  beforeEach(async () => {
    // Create test user
    const user = await DatabaseService.createUser({
      email: `test-diner-prefs-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      passwordHash: '$2b$10$test',
    });
    testUserId = user.id;

    // Create test family members
    const member1 = await DatabaseService.createFamilyMember({
      userId: testUserId,
      name: 'Family Member 1',
      preferences: 'Likes pasta',
      dietaryRestrictions: 'None',
    });
    testFamilyMember1Id = member1.id;

    const member2 = await DatabaseService.createFamilyMember({
      userId: testUserId,
      name: 'Family Member 2',
      preferences: 'Likes rice',
      dietaryRestrictions: 'Vegetarian',
    });
    testFamilyMember2Id = member2.id;

    // Create test menu plan
    const menuPlan = await DatabaseService.createMenuPlan({
      userId: testUserId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-07'),
    });
    testMenuPlanId = menuPlan.id;

    // Create test meal
    const meal = await DatabaseService.createMeal({
      menuPlanId: testMenuPlanId,
      dayOfWeek: 'monday',
      mealType: 'lunch',
      diners: [],
      numberOfDishes: 2,
    });
    testMealId = meal.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testUserId) {
      await DatabaseService.deleteUser(testUserId);
    }
  });

  describe('getUserDinerPreferences', () => {
    it('should return empty array when no preferences are set', async () => {
      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');
      expect(prefs).toEqual([]);
    });

    it('should return preferences for lunch', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');

      expect(prefs).toHaveLength(1);
      expect(prefs[0].userId).toBe(testUserId);
      expect(prefs[0].mealType).toBe('lunch');
      expect(prefs[0].familyMemberId).toBe(testFamilyMember1Id);
    });

    it('should return multiple preferences', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'dinner', [
        testFamilyMember1Id,
        testFamilyMember2Id,
      ]);

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'dinner');

      expect(prefs).toHaveLength(2);
      expect(prefs.map(p => p.familyMemberId)).toContain(testFamilyMember1Id);
      expect(prefs.map(p => p.familyMemberId)).toContain(testFamilyMember2Id);
    });

    it('should return different preferences for lunch and dinner', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);
      await DatabaseService.setUserDinerPreferences(testUserId, 'dinner', [testFamilyMember2Id]);

      const lunchPrefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');
      const dinnerPrefs = await DatabaseService.getUserDinerPreferences(testUserId, 'dinner');

      expect(lunchPrefs).toHaveLength(1);
      expect(lunchPrefs[0].familyMemberId).toBe(testFamilyMember1Id);
      expect(dinnerPrefs).toHaveLength(1);
      expect(dinnerPrefs[0].familyMemberId).toBe(testFamilyMember2Id);
    });
  });

  describe('setUserDinerPreferences', () => {
    it('should set preferences for a meal type', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');

      expect(prefs).toHaveLength(1);
      expect(prefs[0].familyMemberId).toBe(testFamilyMember1Id);
    });

    it('should replace existing preferences', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember2Id]);

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');

      expect(prefs).toHaveLength(1);
      expect(prefs[0].familyMemberId).toBe(testFamilyMember2Id);
    });

    it('should handle empty array (clear preferences)', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', []);

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');

      expect(prefs).toEqual([]);
    });

    it('should handle multiple family members', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'dinner', [
        testFamilyMember1Id,
        testFamilyMember2Id,
      ]);

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'dinner');

      expect(prefs).toHaveLength(2);
    });
  });

  describe('deleteUserDinerPreferences', () => {
    it('should delete preferences for a meal type', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);
      await DatabaseService.deleteUserDinerPreferences(testUserId, 'lunch');

      const prefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');

      expect(prefs).toEqual([]);
    });

    it('should only delete preferences for specified meal type', async () => {
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);
      await DatabaseService.setUserDinerPreferences(testUserId, 'dinner', [testFamilyMember2Id]);

      await DatabaseService.deleteUserDinerPreferences(testUserId, 'lunch');

      const lunchPrefs = await DatabaseService.getUserDinerPreferences(testUserId, 'lunch');
      const dinnerPrefs = await DatabaseService.getUserDinerPreferences(testUserId, 'dinner');

      expect(lunchPrefs).toEqual([]);
      expect(dinnerPrefs).toHaveLength(1);
    });

    it('should not throw error when deleting non-existent preferences', async () => {
      await expect(
        DatabaseService.deleteUserDinerPreferences(testUserId, 'lunch')
      ).resolves.not.toThrow();
    });
  });

  describe('setMealCustomDinersFlag', () => {
    it('should set has_custom_diners to true', async () => {
      await DatabaseService.setMealCustomDinersFlag(testMealId, true);

      const meal = await DatabaseService.getMealWithResolvedDiners(testMealId);

      expect(meal).not.toBeNull();
      if (!meal) return;
      expect(meal.hasCustomDiners).toBe(true);
    });

    it('should set has_custom_diners to false', async () => {
      await DatabaseService.setMealCustomDinersFlag(testMealId, true);
      await DatabaseService.setMealCustomDinersFlag(testMealId, false);

      const meal = await DatabaseService.getMealWithResolvedDiners(testMealId);

      expect(meal).not.toBeNull();
      if (!meal) return;
      expect(meal.hasCustomDiners).toBe(false);
    });
  });

  describe('getMealWithResolvedDiners', () => {
    it('should return meal with bulk selection diners when has_custom_diners is false', async () => {
      // Set bulk preferences
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [
        testFamilyMember1Id,
        testFamilyMember2Id,
      ]);
      await DatabaseService.setMealCustomDinersFlag(testMealId, false);

      const meal = await DatabaseService.getMealWithResolvedDiners(testMealId);

      expect(meal).toBeDefined();
      expect(meal).not.toBeNull();
      if (!meal) return;
      expect(meal.hasCustomDiners).toBe(false);
      expect(meal).not.toBeNull();
      if (!meal) return;
      expect(meal.diners).toHaveLength(2);
      expect(meal.diners.map((d: any) => d.familyMemberId)).toContain(testFamilyMember1Id);
      expect(meal.diners.map((d: any) => d.familyMemberId)).toContain(testFamilyMember2Id);
    });

    it('should return empty diners array when no bulk preferences are set', async () => {
      await DatabaseService.setMealCustomDinersFlag(testMealId, false);

      const meal = await DatabaseService.getMealWithResolvedDiners(testMealId);

      expect(meal).toBeDefined();
      expect(meal).not.toBeNull();
      if (!meal) return;
      expect(meal.diners).toEqual([]);
    });

    it('should return null for non-existent meal', async () => {
      const meal = await DatabaseService.getMealWithResolvedDiners('00000000-0000-0000-0000-000000000000');

      expect(meal).toBeNull();
    });
  });

  describe('Property Test: Diner Resolution Correctness (Property 8)', () => {
    it('should correctly resolve diners based on has_custom_diners flag', async () => {
      // Set bulk preferences
      await DatabaseService.setUserDinerPreferences(testUserId, 'lunch', [testFamilyMember1Id]);

      // Test with has_custom_diners = false (should use bulk)
      await DatabaseService.setMealCustomDinersFlag(testMealId, false);
      const meal = await DatabaseService.getMealWithResolvedDiners(testMealId);
      expect(meal).not.toBeNull();
      if (!meal) return;
      expect(meal.diners).toHaveLength(1);
      expect(meal.diners[0].familyMemberId).toBe(testFamilyMember1Id);
    });
  });
});
