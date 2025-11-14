import { MenuPlanStatus } from './types';
import { Meal } from './Meal';

export interface MenuPlan {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  status: MenuPlanStatus;
  meals: Meal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuPlanDTO {
  userId: string;
  startDate: Date;
  endDate: Date;
  defaultDiners?: number;
}
