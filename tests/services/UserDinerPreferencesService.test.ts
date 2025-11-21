import UserDinerPreferencesService from '../../src/services/UserDinerPreferencesService';
import DatabaseService from '../../src/services/DatabaseService';

describe('UserDinerPreferencesService', () => {
  let testUserId: string;
  let testFamilyMemberId1: string;
  let testFamilyMemberId2: string;

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
      name: 'Family Member 1',
      preferences: 'Vegetarian',
      dietaryRestrictions: 'No meat',
    });
    testFamilyMemberId1 = familyMember1.id;

    const familyMember2 = await DatabaseService.createFamilyMember({
      userId: testUserId,
      name: 'Family Member 2',
      preferences: 'No restrictions',
      dietaryRestrictions: '',
    });
    testFamilyMemberId2 = familyMember2.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await DatabaseService.deleteUser(testUserId);
    }
  });

  describe('getPreferences', () => {
    it('should return empty array when no preferences are set', async () => {
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toEqual([]);
    });

    it('should return family member IDs for lunch preferences', async () => {
      // Set preferences first
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1, testFamilyMemberId2]);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toHaveLength(2);
      expect(preferences).toContain(testFamilyMemberId1);
      expect(preferences).toContain(testFamilyMemberId2);
    });

    it('should return family member IDs for dinner preferences', async () => {
      // Set preferences first
      await UserDinerPreferencesService.setPreferences(testUserId, 'dinner', [testFamilyMemberId1]);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'dinner');
      expect(preferences).toHaveLength(1);
      expect(preferences).toContain(testFamilyMemberId1);
    });

    it('should return different preferences for lunch and dinner', async () => {
      // Set different preferences for lunch and dinner
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1, testFamilyMemberId2]);
      await UserDinerPreferencesService.setPreferences(testUserId, 'dinner', [testFamilyMemberId1]);
      
      const lunchPrefs = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      const dinnerPrefs = await UserDinerPreferencesService.getPreferences(testUserId, 'dinner');
      
      expect(lunchPrefs).toHaveLength(2);
      expect(dinnerPrefs).toHaveLength(1);
    });

    it('should throw error for invalid meal type', async () => {
      await expect(
        UserDinerPreferencesService.getPreferences(testUserId, 'breakfast' as any)
      ).rejects.toThrow('mealType must be either "lunch" or "dinner"');
    });

    it('should throw error for missing userId', async () => {
      await expect(
        UserDinerPreferencesService.getPreferences('', 'lunch')
      ).rejects.toThrow('userId and mealType are required');
    });
  });

  describe('setPreferences', () => {
    it('should set preferences for lunch', async () => {
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1]);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toHaveLength(1);
      expect(preferences[0]).toBe(testFamilyMemberId1);
    });

    it('should set preferences for dinner', async () => {
      await UserDinerPreferencesService.setPreferences(testUserId, 'dinner', [testFamilyMemberId1, testFamilyMemberId2]);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'dinner');
      expect(preferences).toHaveLength(2);
      expect(preferences).toContain(testFamilyMemberId1);
      expect(preferences).toContain(testFamilyMemberId2);
    });

    it('should update existing preferences', async () => {
      // Set initial preferences
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1]);
      
      // Update preferences
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId2]);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toHaveLength(1);
      expect(preferences[0]).toBe(testFamilyMemberId2);
    });

    it('should handle empty family member IDs array', async () => {
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', []);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toEqual([]);
    });

    it('should handle multiple family member IDs', async () => {
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1, testFamilyMemberId2]);
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toHaveLength(2);
      expect(preferences).toContain(testFamilyMemberId1);
      expect(preferences).toContain(testFamilyMemberId2);
    });

    it('should throw error for invalid meal type', async () => {
      await expect(
        UserDinerPreferencesService.setPreferences(testUserId, 'breakfast' as any, [testFamilyMemberId1])
      ).rejects.toThrow('mealType must be either "lunch" or "dinner"');
    });

    it('should throw error for invalid family member ID format', async () => {
      await expect(
        UserDinerPreferencesService.setPreferences(testUserId, 'lunch', ['invalid-id'])
      ).rejects.toThrow('Invalid family member ID: invalid-id');
    });

    it('should throw error for non-array family member IDs', async () => {
      await expect(
        UserDinerPreferencesService.setPreferences(testUserId, 'lunch', 'not-an-array' as any)
      ).rejects.toThrow('familyMemberIds must be an array');
    });
  });

  describe('clearPreferences', () => {
    it('should clear lunch preferences', async () => {
      // Set preferences first
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1]);
      
      // Clear preferences
      await UserDinerPreferencesService.clearPreferences(testUserId, 'lunch');
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      expect(preferences).toEqual([]);
    });

    it('should clear dinner preferences', async () => {
      // Set preferences first
      await UserDinerPreferencesService.setPreferences(testUserId, 'dinner', [testFamilyMemberId1, testFamilyMemberId2]);
      
      // Clear preferences
      await UserDinerPreferencesService.clearPreferences(testUserId, 'dinner');
      
      const preferences = await UserDinerPreferencesService.getPreferences(testUserId, 'dinner');
      expect(preferences).toEqual([]);
    });

    it('should only clear preferences for specified meal type', async () => {
      // Set preferences for both meal types
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1]);
      await UserDinerPreferencesService.setPreferences(testUserId, 'dinner', [testFamilyMemberId2]);
      
      // Clear only lunch preferences
      await UserDinerPreferencesService.clearPreferences(testUserId, 'lunch');
      
      const lunchPrefs = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      const dinnerPrefs = await UserDinerPreferencesService.getPreferences(testUserId, 'dinner');
      
      expect(lunchPrefs).toEqual([]);
      expect(dinnerPrefs).toHaveLength(1);
      expect(dinnerPrefs[0]).toBe(testFamilyMemberId2);
    });

    it('should not throw error when clearing non-existent preferences', async () => {
      await expect(
        UserDinerPreferencesService.clearPreferences(testUserId, 'lunch')
      ).resolves.not.toThrow();
    });

    it('should throw error for invalid meal type', async () => {
      await expect(
        UserDinerPreferencesService.clearPreferences(testUserId, 'breakfast' as any)
      ).rejects.toThrow('mealType must be either "lunch" or "dinner"');
    });
  });

  // Property-based tests
  describe('Property Tests', () => {
    // Feature: bulk-diner-selection, Property 6: Bulk selection persistence
    it('should persist bulk selections correctly (Property 6)', async () => {
      const familyMemberIds = [testFamilyMemberId1, testFamilyMemberId2];
      
      // Store preferences
      await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', familyMemberIds);
      
      // Retrieve preferences
      const retrievedPrefs = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
      
      // Should return the same set of IDs
      expect(retrievedPrefs.sort()).toEqual(familyMemberIds.sort());
    });

    // Feature: bulk-diner-selection, Property 7: User isolation
    it('should isolate preferences between different users (Property 7)', async () => {
      // Create second test user
      const testUser2 = await DatabaseService.createUser({
        email: `test2-${Date.now()}@example.com`,
        password: 'testpassword',
        passwordHash: 'hashedpassword',
        name: 'Test User 2',
        preferences: 'Test preferences',
        defaultDiners: 1,
      });

      try {
        // Set preferences for first user
        await UserDinerPreferencesService.setPreferences(testUserId, 'lunch', [testFamilyMemberId1]);
        
        // Set different preferences for second user
        await UserDinerPreferencesService.setPreferences(testUser2.id, 'lunch', [testFamilyMemberId2]);
        
        // Get preferences for both users
        const user1Prefs = await UserDinerPreferencesService.getPreferences(testUserId, 'lunch');
        const user2Prefs = await UserDinerPreferencesService.getPreferences(testUser2.id, 'lunch');
        
        // Preferences should be isolated
        expect(user1Prefs).toEqual([testFamilyMemberId1]);
        expect(user2Prefs).toEqual([testFamilyMemberId2]);
      } finally {
        await DatabaseService.deleteUser(testUser2.id);
      }
    });
  });
});