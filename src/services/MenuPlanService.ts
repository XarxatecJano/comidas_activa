import DatabaseService from './DatabaseService';
import AIService from './AIService';
import {
  MenuPlan,
  CreateMenuPlanDTO,
  Meal,
  Dish,
  User,
} from '../models';

interface CreateMenuPlanRequest {
  userId: string;
  startDate: Date;
  endDate: Date;
  days: string[];
  mealTypes: ('lunch' | 'dinner')[];
  customDiners?: number | Array<{ name: string; preferences?: string }>;
}

interface UpdateMealRequest {
  mealId: string;
  numberOfDishes?: number;
  customDiners?: Array<{ name: string; preferences?: string }>;
}

class MenuPlanService {
  /**
   * Crear nueva planificación de menú
   */
  async createMenuPlan(request: CreateMenuPlanRequest): Promise<MenuPlan> {
    const { userId, startDate, endDate, days, mealTypes, customDiners } = request;

    // Validar fechas
    const dateErrors = this.validateDateRange(startDate, endDate);
    if (dateErrors.length > 0) {
      throw new Error(dateErrors.join(', '));
    }

    // Verificar que el usuario existe
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Load bulk diner preferences for lunch and dinner
    const lunchPrefs = await DatabaseService.getUserDinerPreferences(userId, 'lunch');
    const dinnerPrefs = await DatabaseService.getUserDinerPreferences(userId, 'dinner');

    // Get family members for bulk selection
    const lunchFamilyMemberIds = lunchPrefs.map(p => p.familyMemberId);
    const dinnerFamilyMemberIds = dinnerPrefs.map(p => p.familyMemberId);

    // Normalizar customDiners: puede ser un número o un array
    let dinersArray: Array<{ name: string; preferences?: string }>;
    let dinersCount: number;

    if (typeof customDiners === 'number') {
      // Si es un número, crear comensales por defecto
      dinersCount = customDiners;
      dinersArray = this.createDefaultDiners(customDiners);
    } else if (Array.isArray(customDiners) && customDiners.length > 0) {
      // Si es un array, validar y usar
      const dinerErrors = this.validateDinersConfiguration(customDiners);
      if (dinerErrors.length > 0) {
        throw new Error(dinerErrors.join(', '));
      }
      dinersCount = customDiners.length;
      dinersArray = customDiners;
    } else {
      // Use bulk selection count if available, otherwise use default
      const maxBulkCount = Math.max(lunchFamilyMemberIds.length, dinnerFamilyMemberIds.length);
      dinersCount = maxBulkCount > 0 ? maxBulkCount : user.defaultDiners;
      dinersArray = this.createDefaultDiners(dinersCount);
    }

    // Crear el plan de menú en la base de datos
    const planData: CreateMenuPlanDTO = {
      userId,
      startDate,
      endDate,
    };

    const menuPlan = await DatabaseService.createMenuPlan(planData);

    try {
      // Generar menú con IA
      const generatedMeals = await AIService.generateWeeklyMenu(
        user.preferences,
        dinersCount,
        days,
        mealTypes
      );

      // Crear comidas en la base de datos
      const meals: Meal[] = [];
      for (const generatedMeal of generatedMeals) {
        const meal = await this.createMealFromGenerated(
          menuPlan.id,
          generatedMeal,
          dinersArray,
          generatedMeal.mealType === 'lunch' ? lunchFamilyMemberIds : dinnerFamilyMemberIds,
          userId
        );
        meals.push(meal);
      }

      // Retornar plan completo
      return {
        ...menuPlan,
        meals,
      };
    } catch (error) {
      // Si falla la IA, eliminar el plan creado
      await DatabaseService.deleteMeal(menuPlan.id);
      throw new Error('Failed to generate menu: ' + (error as Error).message);
    }
  }

  /**
   * Obtener planificación por ID
   */
  async getMenuPlanById(planId: string): Promise<MenuPlan | null> {
    return await DatabaseService.getMenuPlanById(planId);
  }

  /**
   * Actualizar comida específica
   */
  async updateMeal(request: UpdateMealRequest): Promise<Meal> {
    const { mealId, numberOfDishes, customDiners } = request;

    // Verificar que la comida existe
    const existingMeal = await DatabaseService.getMealById(mealId);
    if (!existingMeal) {
      throw new Error('Meal not found');
    }

    // Obtener el plan de menú
    const plan = await DatabaseService.getMenuPlanById(existingMeal.menuPlanId);
    if (!plan) {
      throw new Error('Menu plan not found');
    }

    // Verificar que el plan no esté confirmado
    if (plan.status === 'confirmed') {
      throw new Error('Cannot update meals in a confirmed plan');
    }

    // Obtener usuario para preferencias
    const user = await DatabaseService.getUserById(plan.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validar comensales si se proporcionan
    if (customDiners && customDiners.length > 0) {
      const dinerErrors = this.validateDinersConfiguration(customDiners);
      if (dinerErrors.length > 0) {
        throw new Error(dinerErrors.join(', '));
      }
    }

    // Set has_custom_diners flag if customDiners are provided
    if (customDiners && customDiners.length > 0) {
      await DatabaseService.setMealCustomDinersFlag(mealId, true);
    }

    // Determinar comensales a usar
    const dinersToUse = customDiners ||
      (existingMeal.diners.length > 0
        ? existingMeal.diners.map(d => ({ name: d.name, preferences: d.preferences }))
        : this.createDefaultDiners(user.defaultDiners));

    // Regenerar comida con IA
    const regeneratedDishes = await AIService.regenerateMeal({
      preferences: user.preferences,
      diners: dinersToUse,
      numberOfDishes: numberOfDishes || existingMeal.dishes.length || 2,
      dayOfWeek: existingMeal.dayOfWeek,
      mealType: existingMeal.mealType,
    });

    // Eliminar comensales y platos existentes
    await DatabaseService.deleteDinersByMealId(mealId);
    await DatabaseService.deleteDishesByMealId(mealId);

    // Crear nuevos comensales
    for (const dinerData of dinersToUse) {
      await DatabaseService.createDiner(mealId, {
        name: dinerData.name,
        preferences: dinerData.preferences,
      });
    }

    // Crear nuevos platos
    for (const dishData of regeneratedDishes) {
      await DatabaseService.createDish({
        mealId,
        name: dishData.name,
        description: dishData.description,
        ingredients: dishData.ingredients,
        course: dishData.course,
      });
    }

    // Retornar comida actualizada
    const updatedMeal = await DatabaseService.getMealById(mealId);
    if (!updatedMeal) {
      throw new Error('Failed to retrieve updated meal');
    }

    return updatedMeal;
  }

  /**
   * Confirmar planificación
   */
  async confirmMenuPlan(planId: string): Promise<MenuPlan> {
    const plan = await DatabaseService.confirmMenuPlan(planId);
    if (!plan) {
      throw new Error('Menu plan not found');
    }
    return plan;
  }

  /**
   * Validar configuración de comensales
   */
  validateDinersConfiguration(
    diners: Array<{ name: string; preferences?: string }>
  ): string[] {
    const errors: string[] = [];

    if (diners.length === 0) {
      errors.push('At least one diner is required');
    }

    if (diners.length > 20) {
      errors.push('Maximum 20 diners allowed');
    }

    for (const diner of diners) {
      if (!diner.name || diner.name.trim().length === 0) {
        errors.push('All diners must have a name');
      }

      if (diner.name && diner.name.length > 100) {
        errors.push('Diner names must be less than 100 characters');
      }

      if (diner.preferences && diner.preferences.length > 500) {
        errors.push('Diner preferences must be less than 500 characters');
      }
    }

    return errors;
  }

  /**
   * Validar rango de fechas
   */
  validateDateRange(startDate: Date, endDate: Date): string[] {
    const errors: string[] = [];

    if (startDate >= endDate) {
      errors.push('End date must be after start date');
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 14) {
      errors.push('Maximum 14 days allowed per menu plan');
    }

    if (daysDiff < 1) {
      errors.push('Minimum 1 day required per menu plan');
    }

    return errors;
  }

  /**
   * Crear comensales por defecto
   */
  private createDefaultDiners(count: number): Array<{ name: string; preferences?: string }> {
    const diners = [];
    for (let i = 1; i <= count; i++) {
      diners.push({
        name: `Comensal ${i}`,
        preferences: undefined,
      });
    }
    return diners;
  }

  /**
   * Apply bulk diner selection to meals without custom diners
   */
  async applyBulkDiners(menuPlanId: string): Promise<void> {
    const plan = await DatabaseService.getMenuPlanById(menuPlanId);
    if (!plan) {
      throw new Error('Menu plan not found');
    }

    // Get bulk preferences for lunch and dinner
    const lunchPrefs = await DatabaseService.getUserDinerPreferences(plan.userId, 'lunch');
    const dinnerPrefs = await DatabaseService.getUserDinerPreferences(plan.userId, 'dinner');

    const lunchFamilyMemberIds = lunchPrefs.map(p => p.familyMemberId);
    const dinnerFamilyMemberIds = dinnerPrefs.map(p => p.familyMemberId);

    // Get all meals for this plan
    const meals = await DatabaseService.getMealsByMenuPlanId(menuPlanId);

    // Update meals that don't have custom diners
    for (const meal of meals) {
      const mealWithFlag = await DatabaseService.getMealById(meal.id);
      if (!mealWithFlag) continue;

      // Skip meals with custom diners flag
      if (mealWithFlag.hasCustomDiners) {
        continue;
      }

      // Apply bulk selection based on meal type
      const familyMemberIds = meal.mealType === 'lunch' ? lunchFamilyMemberIds : dinnerFamilyMemberIds;

      // Delete existing diners
      await DatabaseService.deleteDinersByMealId(meal.id);

      // Create new diners from family members
      for (const familyMemberId of familyMemberIds) {
        const familyMember = await DatabaseService.getFamilyMemberById(familyMemberId);
        if (familyMember) {
          await DatabaseService.createDiner(meal.id, {
            name: familyMember.name,
            preferences: familyMember.preferences,
          });
        }
      }
    }
  }

  /**
   * Crear comida desde datos generados por IA
   */
  private async createMealFromGenerated(
    menuPlanId: string,
    generatedMeal: { dayOfWeek: string; mealType: 'lunch' | 'dinner'; dishes: Dish[] },
    diners: Array<{ name: string; preferences?: string }>,
    bulkFamilyMemberIds: string[] = [],
    userId?: string
  ): Promise<Meal> {
    // Crear la comida with has_custom_diners=false (using bulk selection)
    const meal = await DatabaseService.createMeal({
      menuPlanId,
      dayOfWeek: generatedMeal.dayOfWeek,
      mealType: generatedMeal.mealType,
      diners: [],
      numberOfDishes: generatedMeal.dishes.length,
    });

    // Set has_custom_diners to false for new meals
    await DatabaseService.setMealCustomDinersFlag(meal.id, false);

    // Always include the user as a diner
    if (userId) {
      const user = await DatabaseService.getUserById(userId);
      if (user) {
        await DatabaseService.createDiner(meal.id, {
          name: user.name,
          preferences: user.preferences,
        });
      }
    }

    // If bulk selection is available, use it; otherwise use default diners
    if (bulkFamilyMemberIds.length > 0) {
      // Create diners from family members (bulk selection)
      for (const familyMemberId of bulkFamilyMemberIds) {
        const familyMember = await DatabaseService.getFamilyMemberById(familyMemberId);
        if (familyMember) {
          await DatabaseService.createDiner(meal.id, {
            name: familyMember.name,
            preferences: familyMember.preferences,
          });
        }
      }
    } else {
      // Create default diners
      for (const dinerData of diners) {
        await DatabaseService.createDiner(meal.id, {
          name: dinerData.name,
          preferences: dinerData.preferences,
        });
      }
    }

    // Crear platos
    for (const dishData of generatedMeal.dishes) {
      await DatabaseService.createDish({
        mealId: meal.id,
        name: dishData.name,
        description: dishData.description,
        ingredients: dishData.ingredients,
        course: dishData.course,
      });
    }

    // Retornar comida completa
    const completeMeal = await DatabaseService.getMealById(meal.id);
    if (!completeMeal) {
      throw new Error('Failed to retrieve created meal');
    }

    return completeMeal;
  }
}

export default new MenuPlanService();
