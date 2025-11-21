import { Meal, Dish } from '../../src/models';

// Mock OpenAI module before importing AIService
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import AIService from '../../src/services/AIService';

describe('AIService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockCreate.mockReset();
  });

  describe('generateWeeklyMenu', () => {
    it('should generate weekly menu successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                meals: [
                  {
                    dayOfWeek: 'monday',
                    mealType: 'lunch',
                    dishes: [
                      {
                        name: 'Pasta Carbonara',
                        description: 'Classic Italian pasta',
                        ingredients: ['pasta (200g)', 'eggs (2)', 'bacon (100g)', 'parmesan (50g)'],
                        course: 'main',
                      },
                    ],
                  },
                  {
                    dayOfWeek: 'monday',
                    mealType: 'dinner',
                    dishes: [
                      {
                        name: 'Grilled Chicken',
                        description: 'Healthy grilled chicken',
                        ingredients: ['chicken breast (250g)', 'olive oil (2 tbsp)', 'herbs'],
                        course: 'main',
                      },
                    ],
                  },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await AIService.generateWeeklyMenu(
        'No nuts, vegetarian friendly',
        2,
        ['monday'],
        ['lunch', 'dinner']
      );

      expect(result).toHaveLength(2);
      expect(result[0].dayOfWeek).toBe('monday');
      expect(result[0].mealType).toBe('lunch');
      expect(result[0].dishes[0].name).toBe('Pasta Carbonara');
      expect(result[1].mealType).toBe('dinner');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle response with extra text around JSON', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Here is your menu:\n' + JSON.stringify({
                meals: [
                  {
                    dayOfWeek: 'tuesday',
                    mealType: 'lunch',
                    dishes: [
                      {
                        name: 'Salad',
                        description: 'Fresh salad',
                        ingredients: ['lettuce', 'tomato'],
                        course: 'starter',
                      },
                    ],
                  },
                ],
              }) + '\nEnjoy!',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await AIService.generateWeeklyMenu('Healthy', 1, ['tuesday'], ['lunch']);

      expect(result).toHaveLength(1);
      expect(result[0].dishes[0].name).toBe('Salad');
    });

    it('should throw error when no response from OpenAI', async () => {
      const mockResponse = {
        choices: [],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(
        AIService.generateWeeklyMenu('No preferences', 2, ['monday'], ['lunch'])
      ).rejects.toThrow('Failed to generate menu');
    });

    it('should handle timeout error', async () => {
      const timeoutError: any = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      mockCreate.mockRejectedValue(timeoutError);

      await expect(
        AIService.generateWeeklyMenu('No preferences', 2, ['monday'], ['lunch'])
      ).rejects.toThrow('ChatGPT API timeout - please try again');
    });

    it('should handle rate limit error', async () => {
      const rateLimitError: any = new Error('Rate limit');
      rateLimitError.status = 429;
      mockCreate.mockRejectedValue(rateLimitError);

      await expect(
        AIService.generateWeeklyMenu('No preferences', 2, ['monday'], ['lunch'])
      ).rejects.toThrow('Rate limit exceeded - please wait a moment');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(
        AIService.generateWeeklyMenu('No preferences', 2, ['monday'], ['lunch'])
      ).rejects.toThrow('Failed to generate menu');
    });

    it('should handle response without meals array', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ data: 'invalid' }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(
        AIService.generateWeeklyMenu('No preferences', 2, ['monday'], ['lunch'])
      ).rejects.toThrow('Failed to generate menu');
    });
  });

  describe('regenerateMeal', () => {
    it('should regenerate meal successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                dishes: [
                  {
                    name: 'Grilled Salmon',
                    description: 'Fresh salmon with herbs',
                    ingredients: ['salmon (200g)', 'lemon', 'dill'],
                    course: 'main',
                  },
                  {
                    name: 'Roasted Vegetables',
                    description: 'Seasonal vegetables',
                    ingredients: ['carrots (100g)', 'zucchini (100g)', 'olive oil'],
                    course: 'main',
                  },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const params = {
        preferences: 'Fish lover',
        diners: [{ name: 'John', preferences: 'No shellfish' }],
        numberOfDishes: 2,
        dayOfWeek: 'wednesday',
        mealType: 'dinner' as const,
      };

      const result = await AIService.regenerateMeal(params);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Grilled Salmon');
      expect(result[1].name).toBe('Roasted Vegetables');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple diners with preferences', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                dishes: [
                  {
                    name: 'Vegetable Stir Fry',
                    description: 'Mixed vegetables',
                    ingredients: ['broccoli', 'carrots', 'soy sauce'],
                    course: 'main',
                  },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const params = {
        preferences: 'Healthy',
        diners: [
          { name: 'Alice', preferences: 'Vegan' },
          { name: 'Bob', preferences: 'Gluten-free' },
        ],
        numberOfDishes: 1,
        dayOfWeek: 'friday',
        mealType: 'lunch' as const,
      };

      const result = await AIService.regenerateMeal(params);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Vegetable Stir Fry');
    });

    it('should throw error when no response from OpenAI', async () => {
      const mockResponse = {
        choices: [],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const params = {
        preferences: 'Any',
        diners: [{ name: 'Test' }],
        numberOfDishes: 1,
        dayOfWeek: 'monday',
        mealType: 'lunch' as const,
      };

      await expect(AIService.regenerateMeal(params)).rejects.toThrow('Failed to regenerate meal');
    });

    it('should handle timeout error', async () => {
      const timeoutError: any = new Error('Request timeout');
      timeoutError.message = 'timeout occurred';
      mockCreate.mockRejectedValue(timeoutError);

      const params = {
        preferences: 'Any',
        diners: [{ name: 'Test' }],
        numberOfDishes: 1,
        dayOfWeek: 'monday',
        mealType: 'lunch' as const,
      };

      await expect(AIService.regenerateMeal(params)).rejects.toThrow(
        'ChatGPT API timeout - please try again'
      );
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ wrong: 'format' }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const params = {
        preferences: 'Any',
        diners: [{ name: 'Test' }],
        numberOfDishes: 1,
        dayOfWeek: 'monday',
        mealType: 'lunch' as const,
      };

      await expect(AIService.regenerateMeal(params)).rejects.toThrow('Failed to regenerate meal');
    });
  });

  describe('generateShoppingList', () => {
    it('should generate shopping list successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [
                  {
                    ingredient: 'Pasta',
                    quantity: '500',
                    unit: 'g',
                  },
                  {
                    ingredient: 'Tomatoes',
                    quantity: '4',
                    unit: 'units',
                  },
                  {
                    ingredient: 'Olive oil',
                    quantity: '100',
                    unit: 'ml',
                  },
                ],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const meals: Meal[] = [
        {
          id: '1',
          menuPlanId: 'plan1',
          dayOfWeek: 'monday',
          mealType: 'lunch',
          diners: [],
          dishes: [
            {
              id: 'd1',
              mealId: '1',
              name: 'Pasta with Tomato Sauce',
              description: 'Simple pasta',
              ingredients: ['pasta (250g)', 'tomatoes (2)', 'olive oil (50ml)'],
              course: 'main',
            },
          ],
          hasCustomDiners: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          menuPlanId: 'plan1',
          dayOfWeek: 'monday',
          mealType: 'dinner',
          diners: [],
          dishes: [
            {
              id: 'd2',
              mealId: '2',
              name: 'Pasta Salad',
              description: 'Cold pasta',
              ingredients: ['pasta (250g)', 'tomatoes (2)', 'olive oil (50ml)'],
              course: 'main',
            },
          ],
          hasCustomDiners: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await AIService.generateShoppingList(meals);

      expect(result).toHaveLength(3);
      expect(result[0].ingredient).toBe('Pasta');
      expect(result[0].quantity).toBe('500');
      expect(result[0].unit).toBe('g');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle empty meals array', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [],
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await AIService.generateShoppingList([]);

      expect(result).toHaveLength(0);
    });

    it('should throw error when no response from OpenAI', async () => {
      const mockResponse = {
        choices: [],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const meals: Meal[] = [
        {
          id: '1',
          menuPlanId: 'plan1',
          dayOfWeek: 'monday',
          mealType: 'lunch',
          diners: [],
          dishes: [],
          hasCustomDiners: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await expect(AIService.generateShoppingList(meals)).rejects.toThrow(
        'Failed to generate shopping list'
      );
    });

    it('should handle rate limit error', async () => {
      const rateLimitError: any = new Error('Too many requests');
      rateLimitError.status = 429;
      mockCreate.mockRejectedValue(rateLimitError);

      const meals: Meal[] = [
        {
          id: '1',
          menuPlanId: 'plan1',
          dayOfWeek: 'monday',
          mealType: 'lunch',
          diners: [],
          dishes: [],
          hasCustomDiners: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await expect(AIService.generateShoppingList(meals)).rejects.toThrow(
        'Rate limit exceeded - please wait a moment'
      );
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ data: 'invalid' }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const meals: Meal[] = [
        {
          id: '1',
          menuPlanId: 'plan1',
          dayOfWeek: 'monday',
          mealType: 'lunch',
          diners: [],
          dishes: [],
          hasCustomDiners: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await expect(AIService.generateShoppingList(meals)).rejects.toThrow(
        'Failed to generate shopping list'
      );
    });

    it('should handle response with JSON wrapped in text', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Here is your shopping list:\n' + JSON.stringify({
                items: [
                  {
                    ingredient: 'Eggs',
                    quantity: '12',
                    unit: 'units',
                  },
                ],
              }) + '\nHappy shopping!',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const meals: Meal[] = [
        {
          id: '1',
          menuPlanId: 'plan1',
          dayOfWeek: 'monday',
          mealType: 'lunch',
          diners: [],
          dishes: [
            {
              id: 'd1',
              mealId: '1',
              name: 'Scrambled Eggs',
              description: 'Simple eggs',
              ingredients: ['eggs (6)'],
              course: 'main',
            },
          ],
          hasCustomDiners: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await AIService.generateShoppingList(meals);

      expect(result).toHaveLength(1);
      expect(result[0].ingredient).toBe('Eggs');
    });
  });

  describe('Error handling', () => {
    it('should handle generic OpenAI errors', async () => {
      mockCreate.mockRejectedValue(new Error('Generic API error'));

      await expect(
        AIService.generateWeeklyMenu('No preferences', 2, ['monday'], ['lunch'])
      ).rejects.toThrow('Failed to generate menu');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockCreate.mockRejectedValue(networkError);

      const params = {
        preferences: 'Any',
        diners: [{ name: 'Test' }],
        numberOfDishes: 1,
        dayOfWeek: 'monday',
        mealType: 'lunch' as const,
      };

      await expect(AIService.regenerateMeal(params)).rejects.toThrow('Failed to regenerate meal');
    });
  });
});
