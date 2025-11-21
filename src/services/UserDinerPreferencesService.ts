import DatabaseService from './DatabaseService';

export interface DinerPreference {
  id: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  familyMemberId: string;
  createdAt: Date;
}

class UserDinerPreferencesService {
  /**
   * Get bulk diner preferences for a specific meal type
   */
  async getPreferences(userId: string, mealType: 'lunch' | 'dinner'): Promise<string[]> {
    if (!userId || !mealType) {
      throw new Error('userId and mealType are required');
    }

    if (mealType !== 'lunch' && mealType !== 'dinner') {
      throw new Error('mealType must be either "lunch" or "dinner"');
    }

    try {
      const preferences = await DatabaseService.getUserDinerPreferences(userId, mealType);
      return preferences.map(pref => pref.familyMemberId);
    } catch (error) {
      console.error('Error getting user diner preferences:', error);
      throw new Error('Failed to get diner preferences');
    }
  }

  /**
   * Set bulk diner preferences for a specific meal type
   */
  async setPreferences(userId: string, mealType: 'lunch' | 'dinner', familyMemberIds: string[]): Promise<void> {
    if (!userId || !mealType) {
      throw new Error('userId and mealType are required');
    }

    if (mealType !== 'lunch' && mealType !== 'dinner') {
      throw new Error('mealType must be either "lunch" or "dinner"');
    }

    if (!Array.isArray(familyMemberIds)) {
      throw new Error('familyMemberIds must be an array');
    }

    // Validate that all family member IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of familyMemberIds) {
      if (!uuidRegex.test(id)) {
        throw new Error(`Invalid family member ID: ${id}`);
      }
    }

    try {
      await DatabaseService.setUserDinerPreferences(userId, mealType, familyMemberIds);
    } catch (error) {
      console.error('Error setting user diner preferences:', error);
      throw new Error('Failed to set diner preferences');
    }
  }

  /**
   * Clear all preferences for a specific meal type
   */
  async clearPreferences(userId: string, mealType: 'lunch' | 'dinner'): Promise<void> {
    if (!userId || !mealType) {
      throw new Error('userId and mealType are required');
    }

    if (mealType !== 'lunch' && mealType !== 'dinner') {
      throw new Error('mealType must be either "lunch" or "dinner"');
    }

    try {
      await DatabaseService.deleteUserDinerPreferences(userId, mealType);
    } catch (error) {
      console.error('Error clearing user diner preferences:', error);
      throw new Error('Failed to clear diner preferences');
    }
  }
}

export default new UserDinerPreferencesService();