export interface ShoppingItem {
  ingredient: string;
  quantity: string;
  unit: string;
}

export interface ShoppingList {
  id: string;
  menuPlanId: string;
  items: ShoppingItem[];
  generatedAt: Date;
}

export interface CreateShoppingListDTO {
  menuPlanId: string;
  items: ShoppingItem[];
}
