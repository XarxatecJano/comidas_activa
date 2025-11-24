import pool from '../config/database';

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  preferences?: string;
  dietary_restrictions?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFamilyMemberData {
  name: string;
  preferences?: string;
  dietary_restrictions?: string;
}

export interface UpdateFamilyMemberData {
  name?: string;
  preferences?: string;
  dietary_restrictions?: string;
}

/**
 * Get all family members for a user
 */
export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
  const result = await pool.query(
    'SELECT * FROM "FamilyMember" WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  
  return result.rows;
}

/**
 * Get a specific family member by ID
 */
export async function getFamilyMemberById(memberId: string, userId: string): Promise<FamilyMember | null> {
  const result = await pool.query(
    'SELECT * FROM "FamilyMember" WHERE id = $1 AND user_id = $2',
    [memberId, userId]
  );
  
  return result.rows[0] || null;
}

/**
 * Create a new family member
 */
export async function createFamilyMember(userId: string, data: CreateFamilyMemberData): Promise<FamilyMember> {
  const result = await pool.query(
    `INSERT INTO "FamilyMember" (user_id, name, preferences, dietary_restrictions)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, data.name, data.preferences || null, data.dietary_restrictions || null]
  );
  
  return result.rows[0];
}

/**
 * Update a family member
 */
export async function updateFamilyMember(
  memberId: string,
  userId: string,
  data: UpdateFamilyMemberData
): Promise<FamilyMember | null> {
  const updates: string[] = [];
  const values: string[] = [];
  let paramCount = 1;
  
  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  
  if (data.preferences !== undefined) {
    updates.push(`preferences = $${paramCount++}`);
    values.push(data.preferences);
  }
  
  if (data.dietary_restrictions !== undefined) {
    updates.push(`dietary_restrictions = $${paramCount++}`);
    values.push(data.dietary_restrictions);
  }
  
  if (updates.length === 0) {
    return getFamilyMemberById(memberId, userId);
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(memberId, userId);
  
  const result = await pool.query(
    `UPDATE "FamilyMember"
     SET ${updates.join(', ')}
     WHERE id = $${paramCount++} AND user_id = $${paramCount++}
     RETURNING *`,
    values
  );
  
  return result.rows[0] || null;
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(memberId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM "FamilyMember" WHERE id = $1 AND user_id = $2',
    [memberId, userId]
  );
  
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Add family members to a meal
 */
export async function addDinersToMeal(mealId: string, familyMemberIds: string[]): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Remove existing diners for this meal
    await client.query('DELETE FROM "MealDiner" WHERE meal_id = $1', [mealId]);
    
    // Add new diners
    for (const familyMemberId of familyMemberIds) {
      await client.query(
        'INSERT INTO "MealDiner" (meal_id, family_member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [mealId, familyMemberId]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get family members for a specific meal
 */
export async function getMealDiners(mealId: string): Promise<FamilyMember[]> {
  const result = await pool.query(
    `SELECT fm.* FROM "FamilyMember" fm
     INNER JOIN "MealDiner" md ON fm.id = md.family_member_id
     WHERE md.meal_id = $1
     ORDER BY fm.name ASC`,
    [mealId]
  );
  
  return result.rows;
}

/**
 * Get diner count for a meal
 */
export async function getMealDinerCount(mealId: string): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM "MealDiner" WHERE meal_id = $1',
    [mealId]
  );
  
  return parseInt(result.rows[0].count, 10);
}
