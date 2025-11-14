"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatabaseService_1 = __importDefault(require("../../src/services/DatabaseService"));
const database_1 = __importDefault(require("../../src/config/database"));
describe('DatabaseService', () => {
    let testUserId;
    let testMenuPlanId;
    let testMealId;
    // Limpiar datos de prueba después de todos los tests
    afterAll(async () => {
        // Limpiar en orden inverso por las foreign keys
        if (testMealId) {
            await database_1.default.query('DELETE FROM "Dish" WHERE meal_id = $1', [testMealId]);
            await database_1.default.query('DELETE FROM "Diner" WHERE meal_id = $1', [testMealId]);
        }
        if (testMenuPlanId) {
            await database_1.default.query('DELETE FROM "Meal" WHERE menu_plan_id = $1', [testMenuPlanId]);
            await database_1.default.query('DELETE FROM "ShoppingList" WHERE menu_plan_id = $1', [testMenuPlanId]);
            await database_1.default.query('DELETE FROM "MenuPlan" WHERE id = $1', [testMenuPlanId]);
        }
        if (testUserId) {
            await database_1.default.query('DELETE FROM "User" WHERE id = $1', [testUserId]);
        }
        await database_1.default.end();
    });
    describe('User Methods', () => {
        test('createUser should create a new user', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                passwordHash: 'hashedpassword123',
                name: 'Test User',
                preferences: 'No nuts',
                defaultDiners: 2,
            };
            const user = await DatabaseService_1.default.createUser(userData);
            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe(userData.email);
            expect(user.name).toBe(userData.name);
            expect(user.preferences).toBe(userData.preferences);
            expect(user.defaultDiners).toBe(userData.defaultDiners);
            expect(user.passwordHash).toBe(userData.passwordHash);
            testUserId = user.id;
        });
        test('getUserById should return user by id', async () => {
            const user = await DatabaseService_1.default.getUserById(testUserId);
            expect(user).toBeDefined();
            expect(user?.id).toBe(testUserId);
            expect(user?.email).toBe('test@example.com');
        });
        test('getUserByEmail should return user by email', async () => {
            const user = await DatabaseService_1.default.getUserByEmail('test@example.com');
            expect(user).toBeDefined();
            expect(user?.id).toBe(testUserId);
            expect(user?.email).toBe('test@example.com');
        });
        test('updateUser should update user data', async () => {
            const updateData = {
                name: 'Updated Name',
                preferences: 'No dairy',
                defaultDiners: 3,
            };
            const updatedUser = await DatabaseService_1.default.updateUser(testUserId, updateData);
            expect(updatedUser).toBeDefined();
            expect(updatedUser?.name).toBe(updateData.name);
            expect(updatedUser?.preferences).toBe(updateData.preferences);
            expect(updatedUser?.defaultDiners).toBe(updateData.defaultDiners);
        });
        test('getUserById should return null for non-existent user', async () => {
            const user = await DatabaseService_1.default.getUserById('00000000-0000-0000-0000-000000000000');
            expect(user).toBeNull();
        });
    });
    describe('MenuPlan Methods', () => {
        test('createMenuPlan should create a new menu plan', async () => {
            const planData = {
                userId: testUserId,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-07'),
            };
            const plan = await DatabaseService_1.default.createMenuPlan(planData);
            expect(plan).toBeDefined();
            expect(plan.id).toBeDefined();
            expect(plan.userId).toBe(testUserId);
            expect(plan.status).toBe('draft');
            expect(plan.meals).toEqual([]);
            testMenuPlanId = plan.id;
        });
        test('getMenuPlanById should return menu plan by id', async () => {
            const plan = await DatabaseService_1.default.getMenuPlanById(testMenuPlanId);
            expect(plan).toBeDefined();
            expect(plan?.id).toBe(testMenuPlanId);
            expect(plan?.userId).toBe(testUserId);
            expect(plan?.status).toBe('draft');
        });
        test('confirmMenuPlan should change status to confirmed', async () => {
            const plan = await DatabaseService_1.default.confirmMenuPlan(testMenuPlanId);
            expect(plan).toBeDefined();
            expect(plan?.status).toBe('confirmed');
        });
        test('getMenuPlanById should return null for non-existent plan', async () => {
            const plan = await DatabaseService_1.default.getMenuPlanById('00000000-0000-0000-0000-000000000000');
            expect(plan).toBeNull();
        });
    });
    describe('Meal Methods', () => {
        test('createMeal should create a new meal', async () => {
            const mealData = {
                menuPlanId: testMenuPlanId,
                dayOfWeek: 'monday',
                mealType: 'lunch',
                diners: [],
                numberOfDishes: 2,
            };
            const meal = await DatabaseService_1.default.createMeal(mealData);
            expect(meal).toBeDefined();
            expect(meal.id).toBeDefined();
            expect(meal.menuPlanId).toBe(testMenuPlanId);
            expect(meal.dayOfWeek).toBe('monday');
            expect(meal.mealType).toBe('lunch');
            expect(meal.diners).toEqual([]);
            expect(meal.dishes).toEqual([]);
            testMealId = meal.id;
        });
        test('getMealById should return meal by id', async () => {
            const meal = await DatabaseService_1.default.getMealById(testMealId);
            expect(meal).toBeDefined();
            expect(meal?.id).toBe(testMealId);
            expect(meal?.menuPlanId).toBe(testMenuPlanId);
        });
        test('getMealsByMenuPlanId should return all meals for a plan', async () => {
            const meals = await DatabaseService_1.default.getMealsByMenuPlanId(testMenuPlanId);
            expect(meals).toBeDefined();
            expect(Array.isArray(meals)).toBe(true);
            expect(meals.length).toBeGreaterThan(0);
            expect(meals[0].id).toBe(testMealId);
        });
        test('updateMeal should update meal data', async () => {
            const updatedMeal = await DatabaseService_1.default.updateMeal(testMealId, 'tuesday', 'dinner');
            expect(updatedMeal).toBeDefined();
            expect(updatedMeal?.dayOfWeek).toBe('tuesday');
            expect(updatedMeal?.mealType).toBe('dinner');
        });
        test('getMealById should return null for non-existent meal', async () => {
            const meal = await DatabaseService_1.default.getMealById('00000000-0000-0000-0000-000000000000');
            expect(meal).toBeNull();
        });
    });
    describe('Diner Methods', () => {
        test('createDiner should create a new diner', async () => {
            const dinerData = {
                name: 'John Doe',
                preferences: 'Vegetarian',
            };
            const diner = await DatabaseService_1.default.createDiner(testMealId, dinerData);
            expect(diner).toBeDefined();
            expect(diner.id).toBeDefined();
            expect(diner.name).toBe(dinerData.name);
            expect(diner.preferences).toBe(dinerData.preferences);
        });
        test('getDinersByMealId should return all diners for a meal', async () => {
            const diners = await DatabaseService_1.default.getDinersByMealId(testMealId);
            expect(diners).toBeDefined();
            expect(Array.isArray(diners)).toBe(true);
            expect(diners.length).toBeGreaterThan(0);
            expect(diners[0].name).toBe('John Doe');
        });
        test('deleteDinersByMealId should delete all diners for a meal', async () => {
            const result = await DatabaseService_1.default.deleteDinersByMealId(testMealId);
            expect(result).toBe(true);
            const diners = await DatabaseService_1.default.getDinersByMealId(testMealId);
            expect(diners.length).toBe(0);
        });
    });
    describe('Dish Methods', () => {
        test('createDish should create a new dish', async () => {
            const dishData = {
                mealId: testMealId,
                name: 'Pasta Carbonara',
                description: 'Classic Italian pasta',
                ingredients: ['pasta', 'eggs', 'bacon', 'parmesan'],
                course: 'main',
            };
            const dish = await DatabaseService_1.default.createDish(dishData);
            expect(dish).toBeDefined();
            expect(dish.id).toBeDefined();
            expect(dish.mealId).toBe(testMealId);
            expect(dish.name).toBe(dishData.name);
            expect(dish.description).toBe(dishData.description);
            expect(dish.ingredients).toEqual(dishData.ingredients);
            expect(dish.course).toBe(dishData.course);
        });
        test('getDishesByMealId should return all dishes for a meal', async () => {
            const dishes = await DatabaseService_1.default.getDishesByMealId(testMealId);
            expect(dishes).toBeDefined();
            expect(Array.isArray(dishes)).toBe(true);
            expect(dishes.length).toBeGreaterThan(0);
            expect(dishes[0].name).toBe('Pasta Carbonara');
            expect(Array.isArray(dishes[0].ingredients)).toBe(true);
        });
        test('deleteDishesByMealId should delete all dishes for a meal', async () => {
            const result = await DatabaseService_1.default.deleteDishesByMealId(testMealId);
            expect(result).toBe(true);
            const dishes = await DatabaseService_1.default.getDishesByMealId(testMealId);
            expect(dishes.length).toBe(0);
        });
    });
    describe('ShoppingList Methods', () => {
        test('createShoppingList should create a new shopping list', async () => {
            const listData = {
                menuPlanId: testMenuPlanId,
                items: [
                    { ingredient: 'pasta', quantity: '500', unit: 'g' },
                    { ingredient: 'eggs', quantity: '6', unit: 'units' },
                ],
            };
            const list = await DatabaseService_1.default.createShoppingList(listData);
            expect(list).toBeDefined();
            expect(list.id).toBeDefined();
            expect(list.menuPlanId).toBe(testMenuPlanId);
            expect(Array.isArray(list.items)).toBe(true);
            expect(list.items.length).toBe(2);
            expect(list.items[0].ingredient).toBe('pasta');
        });
        test('getShoppingListByMenuPlanId should return shopping list for a plan', async () => {
            const list = await DatabaseService_1.default.getShoppingListByMenuPlanId(testMenuPlanId);
            expect(list).toBeDefined();
            expect(list?.menuPlanId).toBe(testMenuPlanId);
            expect(Array.isArray(list?.items)).toBe(true);
            expect(list?.items.length).toBe(2);
        });
        test('getShoppingListById should return shopping list by id', async () => {
            const listByPlan = await DatabaseService_1.default.getShoppingListByMenuPlanId(testMenuPlanId);
            const list = await DatabaseService_1.default.getShoppingListById(listByPlan.id);
            expect(list).toBeDefined();
            expect(list?.id).toBe(listByPlan?.id);
            expect(list?.menuPlanId).toBe(testMenuPlanId);
        });
        test('getShoppingListById should return null for non-existent list', async () => {
            const list = await DatabaseService_1.default.getShoppingListById('00000000-0000-0000-0000-000000000000');
            expect(list).toBeNull();
        });
    });
    describe('Transaction Methods', () => {
        test('should handle transactions correctly', async () => {
            const client = await DatabaseService_1.default.beginTransaction();
            try {
                // Crear un usuario dentro de la transacción
                const result = await client.query('INSERT INTO "User" (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id', ['transaction@test.com', 'hash', 'Transaction Test']);
                const userId = result.rows[0].id;
                // Commit de la transacción
                await DatabaseService_1.default.commitTransaction(client);
                // Verificar que el usuario existe
                const user = await DatabaseService_1.default.getUserById(userId);
                expect(user).toBeDefined();
                expect(user?.email).toBe('transaction@test.com');
                // Limpiar
                await database_1.default.query('DELETE FROM "User" WHERE id = $1', [userId]);
            }
            catch (error) {
                await DatabaseService_1.default.rollbackTransaction(client);
                throw error;
            }
        });
        test('should rollback transaction on error', async () => {
            const client = await DatabaseService_1.default.beginTransaction();
            try {
                // Crear un usuario dentro de la transacción
                await client.query('INSERT INTO "User" (email, password_hash, name) VALUES ($1, $2, $3)', ['rollback@test.com', 'hash', 'Rollback Test']);
                // Simular un error
                throw new Error('Simulated error');
            }
            catch (error) {
                await DatabaseService_1.default.rollbackTransaction(client);
            }
            // Verificar que el usuario NO existe
            const user = await DatabaseService_1.default.getUserByEmail('rollback@test.com');
            expect(user).toBeNull();
        });
    });
    describe('Delete Methods', () => {
        test('deleteMeal should delete a meal', async () => {
            const result = await DatabaseService_1.default.deleteMeal(testMealId);
            expect(result).toBe(true);
            const meal = await DatabaseService_1.default.getMealById(testMealId);
            expect(meal).toBeNull();
        });
        test('deleteUser should delete a user and cascade', async () => {
            const result = await DatabaseService_1.default.deleteUser(testUserId);
            expect(result).toBe(true);
            const user = await DatabaseService_1.default.getUserById(testUserId);
            expect(user).toBeNull();
            // Verificar que el plan también se eliminó por CASCADE
            const plan = await DatabaseService_1.default.getMenuPlanById(testMenuPlanId);
            expect(plan).toBeNull();
        });
        test('deleteUser should return false for non-existent user', async () => {
            const result = await DatabaseService_1.default.deleteUser('00000000-0000-0000-0000-000000000000');
            expect(result).toBe(false);
        });
    });
});
