import { MealType } from './types';
import { Diner } from './Diner';
import { Dish } from './Dish';

export interface Meal {
  id: string;
  menuPlanId: string;
  dayOfWeek: string;
  mealType: MealType;
  hasCustomDiners: boolean;
  diners: Diner[];
  dishes: Dish[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMealDTO {
  menuPlanId: string;
  dayOfWeek: string;
  mealType: MealType;
  diners: Diner[];
  numberOfDishes: number;
}
