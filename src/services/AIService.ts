import OpenAI from 'openai';
import { Diner, Dish, Meal, ShoppingItem } from '../models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateMenuParams {
  preferences: string;
  diners: { name: string; preferences?: string }[];
  numberOfDishes: number;
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
}

interface GeneratedMeal {
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
  dishes: Dish[];
}

class AIService {
  /**
   * Generar menú semanal completo
   */
  async generateWeeklyMenu(
    userPreferences: string,
    defaultDiners: number,
    days: string[],
    mealTypes: ('lunch' | 'dinner')[]
  ): Promise<GeneratedMeal[]> {
    const prompt = this.buildWeeklyMenuPrompt(userPreferences, defaultDiners, days, mealTypes);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un chef experto en planificación de menús. Generas menús equilibrados, variados y adaptados a las preferencias del usuario. Siempre respondes en formato JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseWeeklyMenuResponse(content);
    } catch (error: any) {
      console.error('Error generating weekly menu:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('ChatGPT API timeout - please try again');
      }
      
      if (error.status === 429) {
        throw new Error('Rate limit exceeded - please wait a moment');
      }
      
      throw new Error('Failed to generate menu');
    }
  }

  /**
   * Regenerar una comida específica
   */
  async regenerateMeal(params: GenerateMenuParams): Promise<Dish[]> {
    const prompt = this.buildSingleMealPrompt(params);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un chef experto. Generas platos equilibrados y adaptados a las preferencias. Siempre respondes en formato JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseSingleMealResponse(content);
    } catch (error: any) {
      console.error('Error regenerating meal:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('ChatGPT API timeout - please try again');
      }
      
      if (error.status === 429) {
        throw new Error('Rate limit exceeded - please wait a moment');
      }
      
      throw new Error('Failed to regenerate meal');
    }
  }

  /**
   * Generar lista de la compra desde comidas confirmadas
   */
  async generateShoppingList(meals: Meal[]): Promise<ShoppingItem[]> {
    const prompt = this.buildShoppingListPrompt(meals);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente que genera listas de compra organizadas. Agrupas ingredientes similares y calculas cantidades totales. Siempre respondes en formato JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseShoppingListResponse(content);
    } catch (error: any) {
      console.error('Error generating shopping list:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('ChatGPT API timeout - please try again');
      }
      
      if (error.status === 429) {
        throw new Error('Rate limit exceeded - please wait a moment');
      }
      
      throw new Error('Failed to generate shopping list');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private buildWeeklyMenuPrompt(
    preferences: string,
    defaultDiners: number,
    days: string[],
    mealTypes: ('lunch' | 'dinner')[]
  ): string {
    return `
Genera un menú semanal para ${defaultDiners} personas con las siguientes características:

Preferencias del usuario: ${preferences || 'Sin preferencias específicas'}

Días: ${days.join(', ')}
Tipos de comida: ${mealTypes.join(', ')}

Para cada comida, genera 2 platos (un plato principal y un acompañamiento o postre).

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "meals": [
    {
      "dayOfWeek": "monday",
      "mealType": "lunch",
      "dishes": [
        {
          "name": "Nombre del plato",
          "description": "Descripción breve",
          "ingredients": ["ingrediente1", "ingrediente2"],
          "course": "main"
        }
      ]
    }
  ]
}

Asegúrate de que:
- Los menús sean variados y equilibrados
- Se respeten las preferencias alimentarias
- Los ingredientes sean específicos y con cantidades aproximadas
- course puede ser: "starter", "main", o "dessert"
`;
  }

  private buildSingleMealPrompt(params: GenerateMenuParams): string {
    const dinersInfo = params.diners.map(d => 
      `${d.name}${d.preferences ? ` (${d.preferences})` : ''}`
    ).join(', ');

    return `
Genera una comida (${params.mealType}) para el ${params.dayOfWeek} con las siguientes características:

Comensales: ${dinersInfo}
Preferencias generales: ${params.preferences || 'Sin preferencias específicas'}
Número de platos: ${params.numberOfDishes}

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "dishes": [
    {
      "name": "Nombre del plato",
      "description": "Descripción breve",
      "ingredients": ["ingrediente1 (cantidad)", "ingrediente2 (cantidad)"],
      "course": "main"
    }
  ]
}

Asegúrate de que:
- Los platos sean equilibrados y variados
- Se respeten todas las preferencias de los comensales
- Los ingredientes incluyan cantidades aproximadas
- course puede ser: "starter", "main", o "dessert"
`;
  }

  private buildShoppingListPrompt(meals: Meal[]): string {
    const allDishes = meals.flatMap(meal => meal.dishes);
    const dishesText = allDishes.map(dish => 
      `${dish.name}: ${dish.ingredients.join(', ')}`
    ).join('\n');

    return `
Genera una lista de la compra consolidada a partir de estos platos:

${dishesText}

Agrupa ingredientes similares y suma las cantidades totales.

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "items": [
    {
      "ingredient": "Nombre del ingrediente",
      "quantity": "500",
      "unit": "g"
    }
  ]
}

Asegúrate de:
- Agrupar ingredientes similares (ej: "tomate" y "tomates" son lo mismo)
- Sumar cantidades cuando sea posible
- Usar unidades estándar (g, kg, l, ml, unidades)
- Ordenar por categorías (verduras, carnes, lácteos, etc.)
`;
  }

  private parseWeeklyMenuResponse(content: string): GeneratedMeal[] {
    try {
      // Extraer JSON del contenido (por si viene con texto adicional)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid response format: missing meals array');
      }

      return parsed.meals;
    } catch (error) {
      console.error('Error parsing weekly menu response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseSingleMealResponse(content: string): Dish[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.dishes || !Array.isArray(parsed.dishes)) {
        throw new Error('Invalid response format: missing dishes array');
      }

      return parsed.dishes;
    } catch (error) {
      console.error('Error parsing single meal response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseShoppingListResponse(content: string): ShoppingItem[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('Invalid response format: missing items array');
      }

      return parsed.items;
    } catch (error) {
      console.error('Error parsing shopping list response:', error);
      throw new Error('Failed to parse AI response');
    }
  }
}

export default new AIService();
