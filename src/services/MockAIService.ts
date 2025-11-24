// Mock AI Service para desarrollo sin OpenAI
// Genera datos de prueba sin llamar a la API

import { Dish, Meal, ShoppingItem } from '../models';

interface GeneratedMeal {
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
  dishes: Dish[];
}

class MockAIService {
  /**
   * Generar menú semanal de prueba
   */
  async generateWeeklyMenu(
    userPreferences: string,
    defaultDiners: number,
    days: string[],
    mealTypes: ('lunch' | 'dinner')[]
  ): Promise<GeneratedMeal[]> {
    console.log('🧪 Using Mock AI Service - No OpenAI API calls');
    
    const meals: GeneratedMeal[] = [];
    
    const sampleDishes = {
      lunch: [
        {
          name: 'Ensalada César',
          description: 'Ensalada fresca con pollo, lechuga romana y aderezo César',
          ingredients: ['Lechuga romana', 'Pollo', 'Queso parmesano', 'Croutones', 'Aderezo César'],
          course: 'starter' as const
        },
        {
          name: 'Pasta Carbonara',
          description: 'Pasta italiana con bacon, huevo y queso',
          ingredients: ['Pasta', 'Bacon', 'Huevos', 'Queso parmesano', 'Pimienta negra'],
          course: 'main' as const
        },
        {
          name: 'Tiramisú',
          description: 'Postre italiano con café y mascarpone',
          ingredients: ['Bizcochos', 'Café', 'Mascarpone', 'Cacao en polvo', 'Huevos'],
          course: 'dessert' as const
        }
      ],
      dinner: [
        {
          name: 'Sopa de Verduras',
          description: 'Sopa casera con verduras frescas',
          ingredients: ['Zanahoria', 'Cebolla', 'Apio', 'Patata', 'Caldo de verduras'],
          course: 'starter' as const
        },
        {
          name: 'Salmón al Horno',
          description: 'Salmón fresco con limón y hierbas',
          ingredients: ['Salmón', 'Limón', 'Aceite de oliva', 'Romero', 'Ajo'],
          course: 'main' as const
        },
        {
          name: 'Flan Casero',
          description: 'Flan tradicional con caramelo',
          ingredients: ['Leche', 'Huevos', 'Azúcar', 'Vainilla'],
          course: 'dessert' as const
        }
      ]
    };

    for (const day of days) {
      for (const mealType of mealTypes) {
        const dishTemplates = sampleDishes[mealType];
        const dishes: Dish[] = dishTemplates.map((template, index) => ({
          id: `mock-dish-${day}-${mealType}-${index}`,
          mealId: `mock-meal-${day}-${mealType}`,
          ...template
        }));

        meals.push({
          dayOfWeek: day,
          mealType,
          dishes
        });
      }
    }

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    return meals;
  }

  /**
   * Regenerar comida de prueba
   */
  async regenerateMeal(params: { preferences: string; diners: { name: string; preferences?: string }[]; numberOfDishes: number; dayOfWeek: string; mealType: 'lunch' | 'dinner' }): Promise<Dish[]> {
    console.log('🧪 Using Mock AI Service - Regenerating meal');
    
    const alternativeDishes = [
      {
        name: 'Paella Valenciana',
        description: 'Arroz con mariscos y pollo',
        ingredients: ['Arroz', 'Gambas', 'Mejillones', 'Pollo', 'Azafrán', 'Pimiento'],
        course: 'main' as const
      },
      {
        name: 'Gazpacho Andaluz',
        description: 'Sopa fría de tomate',
        ingredients: ['Tomate', 'Pepino', 'Pimiento', 'Ajo', 'Aceite de oliva', 'Vinagre'],
        course: 'starter' as const
      },
      {
        name: 'Tarta de Manzana',
        description: 'Tarta casera con manzanas',
        ingredients: ['Manzanas', 'Harina', 'Mantequilla', 'Azúcar', 'Canela'],
        course: 'dessert' as const
      }
    ];

    const dishes: Dish[] = alternativeDishes.map((template, index) => ({
      id: `mock-regenerated-${Date.now()}-${index}`,
      mealId: 'mock-meal',
      ...template
    }));

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800));

    return dishes;
  }

  /**
   * Generar lista de compra de prueba
   */
  async generateShoppingList(meals: Meal[]): Promise<ShoppingItem[]> {
    console.log('🧪 Using Mock AI Service - Generating shopping list');
    
    // Calcular el número total de comensales
    const totalDiners = meals.reduce((sum, meal) => {
      const dinersCount = (meal as unknown as { diners?: unknown[] }).diners?.length ?? 0;
      return sum + dinersCount;
    }, 0);

    // Si no hay comensales, retornar lista vacía
    if (totalDiners === 0) {
      console.log('🧪 No diners found, returning empty shopping list');
      return [];
    }

    // Ajustar cantidades basadas en el número de comensales (base: 4 comensales)
    const multiplier = totalDiners / 4;
    
    const items: ShoppingItem[] = [
      { ingredient: 'Arroz', quantity: String(Math.round(500 * multiplier)), unit: 'g' },
      { ingredient: 'Pasta', quantity: String(Math.round(400 * multiplier)), unit: 'g' },
      { ingredient: 'Pollo', quantity: String(Math.round(1 * multiplier * 10) / 10), unit: 'kg' },
      { ingredient: 'Salmón', quantity: String(Math.round(600 * multiplier)), unit: 'g' },
      { ingredient: 'Tomate', quantity: String(Math.round(6 * multiplier)), unit: 'unidades' },
      { ingredient: 'Cebolla', quantity: String(Math.round(3 * multiplier)), unit: 'unidades' },
      { ingredient: 'Ajo', quantity: String(Math.max(1, Math.round(1 * multiplier))), unit: 'cabeza' },
      { ingredient: 'Lechuga', quantity: String(Math.round(2 * multiplier)), unit: 'unidades' },
      { ingredient: 'Zanahoria', quantity: String(Math.round(500 * multiplier)), unit: 'g' },
      { ingredient: 'Patata', quantity: String(Math.round(1 * multiplier * 10) / 10), unit: 'kg' },
      { ingredient: 'Huevos', quantity: String(Math.round(12 * multiplier)), unit: 'unidades' },
      { ingredient: 'Leche', quantity: String(Math.round(1 * multiplier * 10) / 10), unit: 'litro' },
      { ingredient: 'Queso parmesano', quantity: String(Math.round(200 * multiplier)), unit: 'g' },
      { ingredient: 'Aceite de oliva', quantity: String(Math.max(1, Math.round(1 * multiplier))), unit: 'botella' },
      { ingredient: 'Limón', quantity: String(Math.round(4 * multiplier)), unit: 'unidades' }
    ];

    console.log(`🧪 Generated shopping list for ${totalDiners} diners (multiplier: ${multiplier.toFixed(2)})`);

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));

    return items;
  }
}

export default new MockAIService();
