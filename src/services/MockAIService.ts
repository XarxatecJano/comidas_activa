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
  async regenerateMeal(params: any): Promise<Dish[]> {
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
      mealId: params.mealId || 'mock-meal',
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
    
    const items: ShoppingItem[] = [
      { ingredient: 'Arroz', quantity: '500', unit: 'g' },
      { ingredient: 'Pasta', quantity: '400', unit: 'g' },
      { ingredient: 'Pollo', quantity: '1', unit: 'kg' },
      { ingredient: 'Salmón', quantity: '600', unit: 'g' },
      { ingredient: 'Tomate', quantity: '6', unit: 'unidades' },
      { ingredient: 'Cebolla', quantity: '3', unit: 'unidades' },
      { ingredient: 'Ajo', quantity: '1', unit: 'cabeza' },
      { ingredient: 'Lechuga', quantity: '2', unit: 'unidades' },
      { ingredient: 'Zanahoria', quantity: '500', unit: 'g' },
      { ingredient: 'Patata', quantity: '1', unit: 'kg' },
      { ingredient: 'Huevos', quantity: '12', unit: 'unidades' },
      { ingredient: 'Leche', quantity: '1', unit: 'litro' },
      { ingredient: 'Queso parmesano', quantity: '200', unit: 'g' },
      { ingredient: 'Aceite de oliva', quantity: '1', unit: 'botella' },
      { ingredient: 'Limón', quantity: '4', unit: 'unidades' }
    ];

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));

    return items;
  }
}

export default new MockAIService();
