import pool from '../config/database';
import { PoolClient, QueryResult } from 'pg';
import {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  MenuPlan,
  CreateMenuPlanDTO,
  Meal,
  CreateMealDTO,
  Diner,
  CreateDinerDTO,
  Dish,
  CreateDishDTO,
  ShoppingList,
  CreateShoppingListDTO,
  UserDinerPreferences,
} from '../models';

class DatabaseService {
  // ==================== USER METHODS ====================

  async createUser(userData: CreateUserDTO & { passwordHash: string }): Promise<User> {
    const query = `
      INSERT INTO "User" (email, password_hash, name, preferences, default_diners)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, password_hash as "passwordHash", name, preferences, 
                default_diners as "defaultDiners", created_at as "createdAt", 
                updated_at as "updatedAt"
    `;
    const values = [
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.preferences || '',
      userData.defaultDiners || 1,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getUserById(userId: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as "passwordHash", name, preferences,
             default_diners as "defaultDiners", created_at as "createdAt",
             updated_at as "updatedAt"
      FROM "User"
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as "passwordHash", name, preferences,
             default_diners as "defaultDiners", created_at as "createdAt",
             updated_at as "updatedAt"
      FROM "User"
      WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async updateUser(userId: string, userData: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (userData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }
    if (userData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(userData.name);
    }
    if (userData.preferences !== undefined) {
      fields.push(`preferences = $${paramCount++}`);
      values.push(userData.preferences);
    }
    if (userData.defaultDiners !== undefined) {
      fields.push(`default_diners = $${paramCount++}`);
      values.push(userData.defaultDiners);
    }

    if (fields.length === 0) {
      return this.getUserById(userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE "User"
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, password_hash as "passwordHash", name, preferences,
                default_diners as "defaultDiners", created_at as "createdAt",
                updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const query = 'DELETE FROM "User" WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ==================== MENUPLAN METHODS ====================

  async createMenuPlan(planData: CreateMenuPlanDTO): Promise<MenuPlan> {
    const query = `
      INSERT INTO "MenuPlan" (user_id, start_date, end_date, status)
      VALUES ($1, $2, $3, 'draft')
      RETURNING id, user_id as "userId", start_date as "startDate",
                end_date as "endDate", status, created_at as "createdAt",
                updated_at as "updatedAt"
    `;
    const values = [planData.userId, planData.startDate, planData.endDate];

    const result = await pool.query(query, values);
    const plan = result.rows[0];
    plan.meals = [];
    return plan;
  }

  async getMenuPlanById(planId: string): Promise<MenuPlan | null> {
    const query = `
      SELECT id, user_id as "userId", start_date as "startDate",
             end_date as "endDate", status, created_at as "createdAt",
             updated_at as "updatedAt"
      FROM "MenuPlan"
      WHERE id = $1
    `;
    const result = await pool.query(query, [planId]);

    if (result.rows.length === 0) {
      return null;
    }

    const plan = result.rows[0];
    plan.meals = await this.getMealsByMenuPlanId(planId);
    return plan;
  }

  async confirmMenuPlan(planId: string): Promise<MenuPlan | null> {
    const query = `
      UPDATE "MenuPlan"
      SET status = 'confirmed', updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id as "userId", start_date as "startDate",
                end_date as "endDate", status, created_at as "createdAt",
                updated_at as "updatedAt"
    `;
    const result = await pool.query(query, [planId]);

    if (result.rows.length === 0) {
      return null;
    }

    const plan = result.rows[0];
    plan.meals = await this.getMealsByMenuPlanId(planId);
    return plan;
  }

  // ==================== MEAL METHODS ====================

  async createMeal(mealData: CreateMealDTO): Promise<Meal> {
    const query = `
      INSERT INTO "Meal" (menu_plan_id, day_of_week, meal_type)
      VALUES ($1, $2, $3)
      RETURNING id, menu_plan_id as "menuPlanId", day_of_week as "dayOfWeek",
                meal_type as "mealType", created_at as "createdAt",
                updated_at as "updatedAt"
    `;
    const values = [mealData.menuPlanId, mealData.dayOfWeek, mealData.mealType];

    const result = await pool.query(query, values);
    const meal = result.rows[0];
    meal.diners = [];
    meal.dishes = [];
    return meal;
  }

  async getMealById(mealId: string): Promise<Meal | null> {
    const query = `
      SELECT id, menu_plan_id as "menuPlanId", day_of_week as "dayOfWeek",
             meal_type as "mealType", has_custom_diners as "hasCustomDiners",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM "Meal"
      WHERE id = $1
    `;
    const result = await pool.query(query, [mealId]);

    if (result.rows.length === 0) {
      return null;
    }

    const meal = result.rows[0];
    meal.diners = await this.getDinersByMealId(mealId);
    meal.dishes = await this.getDishesByMealId(mealId);
    return meal;
  }

  async getMealsByMenuPlanId(menuPlanId: string): Promise<Meal[]> {
    const query = `
      SELECT id, menu_plan_id as "menuPlanId", day_of_week as "dayOfWeek",
             meal_type as "mealType", created_at as "createdAt",
             updated_at as "updatedAt"
      FROM "Meal"
      WHERE menu_plan_id = $1
      ORDER BY day_of_week, meal_type
    `;
    const result = await pool.query(query, [menuPlanId]);

    const meals = await Promise.all(
      result.rows.map(async (meal) => {
        meal.diners = await this.getDinersByMealId(meal.id);
        meal.dishes = await this.getDishesByMealId(meal.id);
        return meal;
      })
    );

    return meals;
  }

  async updateMeal(mealId: string, dayOfWeek?: string, mealType?: string): Promise<Meal | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dayOfWeek !== undefined) {
      fields.push(`day_of_week = $${paramCount++}`);
      values.push(dayOfWeek);
    }
    if (mealType !== undefined) {
      fields.push(`meal_type = $${paramCount++}`);
      values.push(mealType);
    }

    if (fields.length === 0) {
      return this.getMealById(mealId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(mealId);

    const query = `
      UPDATE "Meal"
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, menu_plan_id as "menuPlanId", day_of_week as "dayOfWeek",
                meal_type as "mealType", created_at as "createdAt",
                updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const meal = result.rows[0];
    meal.diners = await this.getDinersByMealId(mealId);
    meal.dishes = await this.getDishesByMealId(mealId);
    return meal;
  }

  async deleteMeal(mealId: string): Promise<boolean> {
    const query = 'DELETE FROM "Meal" WHERE id = $1';
    const result = await pool.query(query, [mealId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ==================== DINER METHODS ====================

  async createDiner(mealId: string, dinerData: CreateDinerDTO): Promise<Diner> {
    const query = `
      INSERT INTO "Diner" (meal_id, name, preferences)
      VALUES ($1, $2, $3)
      RETURNING id, name, preferences
    `;
    const values = [mealId, dinerData.name, dinerData.preferences || null];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getDinersByMealId(mealId: string): Promise<Diner[]> {
    const query = `
      SELECT id, name, preferences
      FROM "Diner"
      WHERE meal_id = $1
    `;
    const result = await pool.query(query, [mealId]);
    return result.rows;
  }

  async deleteDinersByMealId(mealId: string): Promise<boolean> {
    const query = 'DELETE FROM "Diner" WHERE meal_id = $1';
    const result = await pool.query(query, [mealId]);
    return result.rowCount !== null && result.rowCount >= 0;
  }

  // ==================== DISH METHODS ====================

  async createDish(dishData: CreateDishDTO): Promise<Dish> {
    const query = `
      INSERT INTO "Dish" (meal_id, name, description, ingredients, course)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, meal_id as "mealId", name, description, ingredients, course
    `;
    const values = [
      dishData.mealId,
      dishData.name,
      dishData.description,
      JSON.stringify(dishData.ingredients),
      dishData.course,
    ];

    const result = await pool.query(query, values);
    const dish = result.rows[0];
    // PostgreSQL JSONB ya devuelve el objeto parseado
    if (typeof dish.ingredients === 'string') {
      dish.ingredients = JSON.parse(dish.ingredients);
    }
    return dish;
  }

  async getDishesByMealId(mealId: string): Promise<Dish[]> {
    const query = `
      SELECT id, meal_id as "mealId", name, description, ingredients, course
      FROM "Dish"
      WHERE meal_id = $1
      ORDER BY course
    `;
    const result = await pool.query(query, [mealId]);
    return result.rows.map((dish) => ({
      ...dish,
      ingredients: typeof dish.ingredients === 'string' ? JSON.parse(dish.ingredients) : dish.ingredients,
    }));
  }

  async deleteDishesByMealId(mealId: string): Promise<boolean> {
    const query = 'DELETE FROM "Dish" WHERE meal_id = $1';
    const result = await pool.query(query, [mealId]);
    return result.rowCount !== null && result.rowCount >= 0;
  }

  // ==================== FAMILY MEMBER METHODS ====================

  async createFamilyMember(memberData: { userId: string; name: string; preferences?: string; dietaryRestrictions?: string }): Promise<any> {
    const query = `
      INSERT INTO "FamilyMember" (user_id, name, preferences, dietary_restrictions)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id as "userId", name, preferences, dietary_restrictions as "dietaryRestrictions",
                created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      memberData.userId,
      memberData.name,
      memberData.preferences || '',
      memberData.dietaryRestrictions || '',
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getFamilyMemberById(memberId: string): Promise<any | null> {
    const query = `
      SELECT id, user_id as "userId", name, preferences, dietary_restrictions as "dietaryRestrictions",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM "FamilyMember"
      WHERE id = $1
    `;
    const result = await pool.query(query, [memberId]);
    return result.rows[0] || null;
  }

  // ==================== SHOPPING LIST METHODS ====================

  async createShoppingList(listData: CreateShoppingListDTO): Promise<ShoppingList> {
    const query = `
      INSERT INTO "ShoppingList" (menu_plan_id, items)
      VALUES ($1, $2)
      RETURNING id, menu_plan_id as "menuPlanId", items, generated_at as "generatedAt"
    `;
    const values = [listData.menuPlanId, JSON.stringify(listData.items)];

    const result = await pool.query(query, values);
    const list = result.rows[0];
    // PostgreSQL JSONB ya devuelve el objeto parseado
    if (typeof list.items === 'string') {
      list.items = JSON.parse(list.items);
    }
    return list;
  }

  async getShoppingListById(listId: string): Promise<ShoppingList | null> {
    const query = `
      SELECT id, menu_plan_id as "menuPlanId", items, generated_at as "generatedAt"
      FROM "ShoppingList"
      WHERE id = $1
    `;
    const result = await pool.query(query, [listId]);

    if (result.rows.length === 0) {
      return null;
    }

    const list = result.rows[0];
    if (typeof list.items === 'string') {
      list.items = JSON.parse(list.items);
    }
    return list;
  }

  async getShoppingListByMenuPlanId(menuPlanId: string): Promise<ShoppingList | null> {
    const query = `
      SELECT id, menu_plan_id as "menuPlanId", items, generated_at as "generatedAt"
      FROM "ShoppingList"
      WHERE menu_plan_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [menuPlanId]);

    if (result.rows.length === 0) {
      return null;
    }

    const list = result.rows[0];
    if (typeof list.items === 'string') {
      list.items = JSON.parse(list.items);
    }
    return list;
  }

  // ==================== TRANSACTION METHODS ====================

  async beginTransaction(): Promise<PoolClient> {
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
  }

  async commitTransaction(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
    client.release();
  }

  async rollbackTransaction(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
    client.release();
  }

  // ==================== USER DINER PREFERENCES METHODS ====================

  async getUserDinerPreferences(userId: string, mealType: string): Promise<UserDinerPreferences[]> {
    const query = `
      SELECT id, user_id as "userId", meal_type as "mealType", 
             family_member_id as "familyMemberId", created_at as "createdAt"
      FROM "UserDinerPreferences"
      WHERE user_id = $1 AND meal_type = $2
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [userId, mealType]);
    return result.rows;
  }

  async setUserDinerPreferences(userId: string, mealType: string, familyMemberIds: string[]): Promise<void> {
    const client = await this.beginTransaction();

    try {
      // First, delete existing preferences for this user and meal type
      await client.query(
        'DELETE FROM "UserDinerPreferences" WHERE user_id = $1 AND meal_type = $2',
        [userId, mealType]
      );

      // Then, insert new preferences
      if (familyMemberIds.length > 0) {
        const insertQuery = `
          INSERT INTO "UserDinerPreferences" (user_id, meal_type, family_member_id)
          VALUES ${familyMemberIds.map((_, index) => `($1, $2, $${index + 3})`).join(', ')}
        `;
        const values = [userId, mealType, ...familyMemberIds];
        await client.query(insertQuery, values);
      }

      await this.commitTransaction(client);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  async deleteUserDinerPreferences(userId: string, mealType: string): Promise<void> {
    const query = 'DELETE FROM "UserDinerPreferences" WHERE user_id = $1 AND meal_type = $2';
    await pool.query(query, [userId, mealType]);
  }

  async setMealCustomDinersFlag(mealId: string, hasCustom: boolean): Promise<void> {
    const query = 'UPDATE "Meal" SET has_custom_diners = $1 WHERE id = $2';
    await pool.query(query, [hasCustom, mealId]);
  }

  async getMealWithResolvedDiners(mealId: string): Promise<(Meal & { diners: any[] }) | null> {
    // First get the meal with its basic info
    const mealQuery = `
      SELECT m.id, m.menu_plan_id as "menuPlanId", m.day_of_week as "dayOfWeek",
             m.meal_type as "mealType", m.has_custom_diners as "hasCustomDiners",
             m.created_at as "createdAt", m.updated_at as "updatedAt",
             mp.user_id as "userId"
      FROM "Meal" m
      JOIN "MenuPlan" mp ON m.menu_plan_id = mp.id
      WHERE m.id = $1
    `;
    const mealResult = await pool.query(mealQuery, [mealId]);

    if (mealResult.rows.length === 0) {
      return null;
    }

    const meal = mealResult.rows[0];

    // Get diners based on whether meal has custom diners or uses bulk selection
    let diners = [];
    if (meal.hasCustomDiners) {
      // Get custom diners from MealDiner table
      const dinersQuery = `
        SELECT md.id, fm.id as "familyMemberId", fm.name, fm.preferences, fm.dietary_restrictions as "dietaryRestrictions"
        FROM "MealDiner" md
        JOIN "FamilyMember" fm ON md.family_member_id = fm.id
        WHERE md.meal_id = $1
      `;
      const dinersResult = await pool.query(dinersQuery, [mealId]);
      diners = dinersResult.rows;
    } else {
      // Get bulk selection diners from UserDinerPreferences
      const bulkDinersQuery = `
        SELECT udp.id, udp.family_member_id as "familyMemberId", fm.name, fm.preferences, fm.dietary_restrictions as "dietaryRestrictions"
        FROM "UserDinerPreferences" udp
        JOIN "FamilyMember" fm ON udp.family_member_id = fm.id
        WHERE udp.user_id = $1 AND udp.meal_type = $2
      `;
      const bulkDinersResult = await pool.query(bulkDinersQuery, [meal.userId, meal.mealType]);
      diners = bulkDinersResult.rows;
    }

    // Get dishes
    const dishesQuery = `
      SELECT id, name, description, ingredients, course
      FROM "Dish"
      WHERE meal_id = $1
    `;
    const dishesResult = await pool.query(dishesQuery, [mealId]);

    return {
      ...meal,
      diners,
      dishes: dishesResult.rows
    };
  }
}

export default new DatabaseService();
