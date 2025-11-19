import OpenAI from 'openai';
import { Diner, Dish, Meal, ShoppingItem } from '../models';
import MockAIService from './MockAIService';

// Usar Mock AI Service solo si está explícitamente configurado
const USE_MOCK = process.env.USE_MOCK_AI === 'true';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (USE_MOCK) {
  console.log('⚠️  WARNING: Using Mock AI Service (no OpenAI API calls)');
  console.log('   Set USE_MOCK_AI=false in .env to use real OpenAI');
} else if (!process.env.OPENAI_API_KEY) {
  console.log('⚠️  WARNING: OPENAI_API_KEY not set!');
  console.log('   Set OPENAI_API_KEY in .env or USE_MOCK_AI=true for testing');
}

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
    // Usar Mock AI si está configurado
    if (USE_MOCK) {
      return MockAIService.generateWeeklyMenu(userPreferences, defaultDiners, days, mealTypes);
    }

    const prompt = this.buildWeeklyMenuPrompt(userPreferences, defaultDiners, days, mealTypes);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un chef experto en cocina mediterránea española. Generas menús basados en la dieta mediterránea tradicional española, utilizando ingredientes frescos, de temporada y típicos de España (aceite de oliva, verduras, legumbres, pescado, carnes magras, frutas). Priorizas platos saludables, equilibrados y variados de la gastronomía española. Siempre respondes en formato JSON válido.',
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
    // Usar Mock AI si está configurado
    if (USE_MOCK) {
      return MockAIService.regenerateMeal(params);
    }

    const prompt = this.buildSingleMealPrompt(params);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un chef experto en cocina mediterránea española. Generas platos basados en la dieta mediterránea tradicional española, utilizando ingredientes frescos y típicos de España. Priorizas recetas saludables de la gastronomía española. Siempre respondes en formato JSON válido.',
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
    // Usar Mock AI si está configurado
    if (USE_MOCK) {
      return MockAIService.generateShoppingList(meals);
    }

    const prompt = this.buildShoppingListPrompt(meals);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente experto en compras para cocina mediterránea española. Generas listas de compra organizadas con ingredientes típicos españoles. Agrupas ingredientes similares y calculas cantidades totales. Siempre respondes en formato JSON válido.',
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
    // Generar todas las combinaciones de días y tipos de comida
    const combinations: string[] = [];
    for (const day of days) {
      for (const mealType of mealTypes) {
        combinations.push(`${day} - ${mealType}`);
      }
    }

    return `
Genera un menú semanal de DIETA MEDITERRÁNEA ESPAÑOLA para ${defaultDiners} personas con las siguientes características:

Preferencias del usuario: ${preferences || 'Sin preferencias específicas'}

IMPORTANTE: Debes generar EXACTAMENTE ${combinations.length} comidas, una para cada combinación:
${combinations.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Para cada comida, genera 2 platos (un plato principal y un acompañamiento o postre).

REQUISITOS DE DIETA MEDITERRÁNEA ESPAÑOLA:
- Usa aceite de oliva virgen extra como grasa principal
- Incluye verduras y hortalizas frescas de temporada
- Prioriza pescado (al menos 2-3 veces por semana), legumbres y carnes magras
- Incluye cereales integrales, arroz, pasta
- Usa hierbas aromáticas y especias españolas (pimentón, azafrán, romero, tomillo)
- Platos típicos españoles: paella, gazpacho, tortilla española, lentejas, cocido, pescado al horno, ensaladas mediterráneas
- Frutas frescas de postre cuando sea apropiado

IMPORTANTE - REGLA PARA CENAS (dinner):
- En las CENAS (dinner) EVITA hidratos de carbono: NO incluyas pan, pasta, arroz, patatas, legumbres
- Las cenas deben ser ligeras: prioriza proteínas (pescado, pollo, huevos) con verduras
- Ejemplos para cenas: pescado a la plancha con verduras, ensaladas con proteína, tortilla con ensalada, pollo al horno con verduras

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "meals": [
    {
      "dayOfWeek": "monday",
      "mealType": "lunch",
      "dishes": [
        {
          "name": "Nombre del plato español",
          "description": "Descripción breve",
          "ingredients": ["ingrediente1", "ingrediente2"],
          "course": "main"
        },
        {
          "name": "Nombre del segundo plato",
          "description": "Descripción breve",
          "ingredients": ["ingrediente1", "ingrediente2"],
          "course": "dessert"
        }
      ]
    }
  ]
}

Asegúrate de que:
- Generas TODAS las ${combinations.length} comidas solicitadas
- Los menús sean variados, equilibrados y típicos de la cocina española
- Se respeten las preferencias alimentarias
- Los platos sean auténticos de la dieta mediterránea española
- Los ingredientes sean específicos
- course puede ser: "starter", "main", o "dessert"
- dayOfWeek debe ser uno de: ${days.join(', ')}
- mealType debe ser uno de: ${mealTypes.join(', ')}
`;
  }

  private buildSingleMealPrompt(params: GenerateMenuParams): string {
    const dinersInfo = params.diners.map(d => 
      `${d.name}${d.preferences ? ` (${d.preferences})` : ''}`
    ).join(', ');

    return `
Genera una comida de DIETA MEDITERRÁNEA ESPAÑOLA (${params.mealType}) para el ${params.dayOfWeek} con las siguientes características:

Comensales: ${dinersInfo}
Preferencias generales: ${params.preferences || 'Sin preferencias específicas'}
Número de platos: ${params.numberOfDishes}

REQUISITOS DE DIETA MEDITERRÁNEA ESPAÑOLA:
- Usa aceite de oliva virgen extra como grasa principal
- Incluye verduras y hortalizas frescas de temporada
- Prioriza pescado, legumbres y carnes magras
- Usa hierbas aromáticas y especias españolas (pimentón, azafrán, romero, tomillo)
- Platos típicos españoles: paella, gazpacho, tortilla española, lentejas, cocido, pescado al horno, ensaladas mediterráneas
- Frutas frescas de postre cuando sea apropiado

${params.mealType === 'dinner' ? `
IMPORTANTE - REGLA PARA ESTA CENA:
- EVITA hidratos de carbono: NO incluyas pan, pasta, arroz, patatas, legumbres
- La cena debe ser ligera: prioriza proteínas (pescado, pollo, huevos) con verduras
- Ejemplos: pescado a la plancha con verduras, ensaladas con proteína, tortilla con ensalada, pollo al horno con verduras
` : ''}

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "dishes": [
    {
      "name": "Nombre del plato español",
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
