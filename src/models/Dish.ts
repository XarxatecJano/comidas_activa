import { DishCourse } from './types';

export interface Dish {
  id: string;
  mealId: string;
  name: string;
  description: string;
  ingredients: string[];
  course: DishCourse;
}

export interface CreateDishDTO {
  mealId: string;
  name: string;
  description: string;
  ingredients: string[];
  course: DishCourse;
}
