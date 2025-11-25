# Documento de Diseño - Aplicación de Planificación de Menús

## Visión General

Este diseño describe la arquitectura completa de la aplicación web de planificación inteligente de menús. El sistema permite a los usuarios crear planes de menú semanales personalizados mediante IA, gestionar comensales con selección masiva y sobrescrituras individuales, y generar listas de compra automáticas.

La aplicación sigue el paradigma Modelo-Vista-Controlador (MVC) con frontend en Vanilla JavaScript y backend en Node.js + TypeScript + Hono, conectado a PostgreSQL y la API de ChatGPT.

## Arquitectura

### Arquitectura General (MVC)

**Frontend (Cliente)**
- **Vista**: HTML/CSS para la interfaz de usuario
- **Controlador**: Vanilla JavaScript que maneja eventos del DOM y comunicación con el backend
- **Modelo**: Representación local del estado de la aplicación

**Backend (Servidor)**
- **Controlador**: Rutas y handlers de Hono que procesan las peticiones HTTP
- **Modelo**: Lógica de negocio y acceso a datos mediante pg
- **Servicios**: Capa de integración con ChatGPT API

**Base de Datos**
- PostgreSQL para persistencia de datos

### Flujo de Datos

```
Usuario → Frontend (HTML/CSS/JS) → API REST (Hono) → Lógica de Negocio → PostgreSQL
                                                    ↓
                                              ChatGPT API
```

### Tecnologías

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js + TypeScript + Hono
- **Base de Datos**: PostgreSQL con librería pg
- **IA**: OpenAI ChatGPT API
- **Configuración**: dotenv
- **Desarrollo**: Nodemon
- **Testing**: Jest con fast-check para property-based testing

### Decisiones Arquitectónicas Clave

- **Selecciones masivas almacenadas a nivel de usuario**: Las selecciones por defecto de comensales para comida y cena se almacenan como preferencias de usuario
- **Flag de sobrescritura a nivel de comida**: Las comidas individuales rastrean si usan selección masiva o tienen comensales personalizados
- **Resolución perezosa**: Las selecciones masivas se resuelven a comensales reales en tiempo de consulta
- **Cambio solo de visualización para ingredientes**: Los datos de ingredientes permanecen en la base de datos pero se filtran en la capa de presentación

## Componentes e Interfaces

### Extensiones del Esquema de Base de Datos

**Tabla User**
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  preferences TEXT,
  default_diners INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Tabla FamilyMember**
```sql
CREATE TABLE "FamilyMember" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  preferences TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Tabla UserDinerPreferences**
```sql
CREATE TABLE "UserDinerPreferences" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL, -- 'lunch' o 'dinner'
  family_member_id UUID REFERENCES "FamilyMember"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meal_type, family_member_id)
);
```

**Tabla MenuPlan**
```sql
CREATE TABLE "MenuPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Tabla Meal**
```sql
CREATE TABLE "Meal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_plan_id UUID REFERENCES "MenuPlan"(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  has_custom_diners BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Tabla Diner**
```sql
CREATE TABLE "Diner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  preferences TEXT
);
```

**Tabla Dish**
```sql
CREATE TABLE "Dish" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB,
  course VARCHAR(20) NOT NULL
);
```

**Tabla ShoppingList**
```sql
CREATE TABLE "ShoppingList" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_plan_id UUID REFERENCES "MenuPlan"(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### Componentes Backend

#### UserService

```typescript
class UserService {
  async createUser(userData: CreateUserDTO): Promise<{ user: User; errors?: string[] }>
  async updateUser(userId: string, userData: UpdateUserDTO): Promise<User>
  async deleteUser(userId: string): Promise<void>
  async updatePreferences(userId: string, preferences: string): Promise<User>
  async getUserById(userId: string): Promise<User | null>
}
```

#### AuthService

```typescript
class AuthService {
  async login(email: string, password: string): Promise<{ token: string; user: User }>
  async logout(token: string): Promise<void>
  generateToken(payload: TokenPayload): string
  verifyToken(token: string): TokenPayload
}
```

#### FamilyMemberService

```typescript
class FamilyMemberService {
  async createFamilyMember(userId: string, data: CreateFamilyMemberDTO): Promise<FamilyMember>
  async updateFamilyMember(memberId: string, data: UpdateFamilyMemberDTO): Promise<FamilyMember>
  async deleteFamilyMember(memberId: string): Promise<void>
  async getFamilyMembers(userId: string): Promise<FamilyMember[]>
}
```

#### UserDinerPreferencesService

```typescript
interface DinerPreference {
  id: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  familyMemberId: string;
  createdAt: Date;
}

class UserDinerPreferencesService {
  async getPreferences(userId: string, mealType: 'lunch' | 'dinner'): Promise<string[]>
  async setPreferences(userId: string, mealType: 'lunch' | 'dinner', familyMemberIds: string[]): Promise<void>
  async clearPreferences(userId: string, mealType: 'lunch' | 'dinner'): Promise<void>
}
```

#### MenuPlanService

```typescript
interface CreateMenuPlanRequest {
  userId: string;
  startDate: Date;
  endDate: Date;
  days: string[];
  mealTypes: ('lunch' | 'dinner')[];
  customDiners?: number | Array<{ name: string; preferences?: string }>;
}

interface UpdateMealRequest {
  mealId: string;
  numberOfDishes?: number;
  customDiners?: Array<{ name: string; preferences?: string }>;
}

class MenuPlanService {
  async createMenuPlan(request: CreateMenuPlanRequest): Promise<MenuPlan>
  async getMenuPlanById(planId: string): Promise<MenuPlan | null>
  async updateMeal(request: UpdateMealRequest): Promise<Meal>
  async confirmMenuPlan(planId: string): Promise<MenuPlan>
  async applyBulkDiners(planId: string): Promise<void>
  async revertToBulkDiners(mealId: string): Promise<Meal>
}
```

#### AIService

```typescript
class AIService {
  async generateWeeklyMenu(preferences: string, diners: number, days: string[], mealTypes: string[]): Promise<GeneratedMeal[]>
  async regenerateMeal(context: RegenerateMealContext): Promise<Dish[]>
  async generateShoppingList(meals: Meal[]): Promise<ShoppingItem[]>
}
```

#### DatabaseService

```typescript
class DatabaseService {
  // User operations
  async createUser(userData: CreateUserDTO): Promise<User>
  async getUserById(userId: string): Promise<User | null>
  async getUserByEmail(email: string): Promise<User | null>
  async updateUser(userId: string, userData: UpdateUserDTO): Promise<User>
  async deleteUser(userId: string): Promise<void>
  
  // Family Member operations
  async createFamilyMember(userId: string, data: CreateFamilyMemberDTO): Promise<FamilyMember>
  async getFamilyMemberById(memberId: string): Promise<FamilyMember | null>
  async getFamilyMembers(userId: string): Promise<FamilyMember[]>
  async updateFamilyMember(memberId: string, data: UpdateFamilyMemberDTO): Promise<FamilyMember>
  async deleteFamilyMember(memberId: string): Promise<void>
  
  // Diner Preferences operations
  async getUserDinerPreferences(userId: string, mealType: string): Promise<DinerPreference[]>
  async setUserDinerPreferences(userId: string, mealType: string, familyMemberIds: string[]): Promise<void>
  async deleteUserDinerPreferences(userId: string, mealType: string): Promise<void>
  
  // Menu Plan operations
  async createMenuPlan(data: CreateMenuPlanDTO): Promise<MenuPlan>
  async getMenuPlanById(planId: string): Promise<MenuPlan | null>
  async confirmMenuPlan(planId: string): Promise<MenuPlan>
  async deleteMeal(planId: string): Promise<void>
  
  // Meal operations
  async createMeal(data: CreateMealDTO): Promise<Meal>
  async getMealById(mealId: string): Promise<Meal | null>
  async getMealsByMenuPlanId(planId: string): Promise<Meal[]>
  async setMealCustomDinersFlag(mealId: string, hasCustom: boolean): Promise<void>
  async getMealWithResolvedDiners(mealId: string): Promise<Meal>
  
  // Diner operations
  async createDiner(mealId: string, data: CreateDinerDTO): Promise<Diner>
  async deleteDinersByMealId(mealId: string): Promise<void>
  
  // Dish operations
  async createDish(data: CreateDishDTO): Promise<Dish>
  async deleteDishesByMealId(mealId: string): Promise<void>
  
  // Shopping List operations
  async createShoppingList(data: CreateShoppingListDTO): Promise<ShoppingList>
  async getShoppingListByMenuPlanId(planId: string): Promise<ShoppingList | null>
}
```

### Componentes Frontend

#### AuthComponent

```javascript
class AuthComponent {
  renderRegisterForm(): HTMLElement
  renderLoginForm(): HTMLElement
  handleRegister(formData: FormData): Promise<void>
  handleLogin(formData: FormData): Promise<void>
  handleLogout(): Promise<void>
}
```

#### UserProfileComponent

```javascript
class UserProfileComponent {
  renderProfile(user: User): HTMLElement
  renderEditForm(user: User): HTMLElement
  handleUpdateProfile(formData: FormData): Promise<void>
  handleDeleteAccount(): Promise<void>
}
```

#### FamilyMemberComponent

```javascript
class FamilyMemberComponent {
  renderFamilyMembers(members: FamilyMember[]): HTMLElement
  renderAddForm(): HTMLElement
  handleAddMember(formData: FormData): Promise<void>
  handleUpdateMember(memberId: string, formData: FormData): Promise<void>
  handleDeleteMember(memberId: string): Promise<void>
}
```

#### BulkDinerSelector

```javascript
class BulkDinerSelector {
  constructor(mealType: 'lunch' | 'dinner', familyMembers: FamilyMember[], initialSelection: string[])
  
  render(): HTMLElement
  getSelectedDiners(): string[]
  setSelectedDiners(dinerIds: string[]): void
  onChange(callback: (dinerIds: string[]) => void): void
  destroy(): void
}
```

#### MenuPlannerComponent

```javascript
class MenuPlannerComponent {
  renderPlanForm(): HTMLElement
  renderBulkDinerSelectors(familyMembers: FamilyMember[]): HTMLElement
  handleCreatePlan(formData: FormData): Promise<void>
  handleLoadPlan(planId: string): Promise<void>
  handleConfirmPlan(planId: string): Promise<void>
}
```

#### MealCard

```javascript
class MealCard {
  constructor(meal: Meal, menuPlanId: string, onUpdate: () => void)
  
  render(): HTMLElement
  renderDishes(dishes: Dish[]): HTMLElement
  handleUpdateDiners(dinerIds: string[]): Promise<void>
  handleRegenerateMeal(numberOfDishes: number): Promise<void>
  revertToBulkDiners(): Promise<void>
}
```

#### ShoppingListComponent

```javascript
class ShoppingListComponent {
  renderShoppingList(items: ShoppingItem[]): HTMLElement
  handleGenerateList(planId: string): Promise<void>
  handleExportList(): void
}
```

### Endpoints de API

#### Autenticación
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
```

#### Usuario
```
GET    /api/users/:id
PUT    /api/users/:id
PUT    /api/users/:id/preferences
DELETE /api/users/:id
```

#### Miembros de Familia
```
GET    /api/users/:userId/family-members
POST   /api/users/:userId/family-members
PUT    /api/family-members/:id
DELETE /api/family-members/:id
```

#### Preferencias de Comensales
```
POST   /api/users/:userId/diner-preferences/:mealType
GET    /api/users/:userId/diner-preferences/:mealType
DELETE /api/users/:userId/diner-preferences/:mealType
```

#### Planificación de Menús
```
POST   /api/menu-plans
GET    /api/menu-plans/:id
PUT    /api/menu-plans/:id/meals/:mealId
POST   /api/menu-plans/:id/confirm
POST   /api/menu-plans/:id/meals/:mealId/revert-diners
```

#### Lista de Compra
```
POST   /api/shopping-lists
GET    /api/shopping-lists/:id
```

## Modelos de Datos

### User
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  preferences: string;
  defaultDiners: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### FamilyMember
```typescript
interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  preferences?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### UserDinerPreferences
```typescript
interface UserDinerPreferences {
  id: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  familyMemberId: string;
  createdAt: Date;
}
```

### MenuPlan
```typescript
interface MenuPlan {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'confirmed';
  meals: Meal[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Meal
```typescript
interface Meal {
  id: string;
  menuPlanId: string;
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
  hasCustomDiners: boolean;
  diners: Diner[];
  dishes: Dish[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Diner
```typescript
interface Diner {
  id: string;
  name: string;
  preferences?: string;
}
```

### Dish
```typescript
interface Dish {
  id: string;
  mealId: string;
  name: string;
  description: string;
  ingredients: string[];
  course: 'starter' | 'main' | 'dessert';
}
```

### ShoppingList
```typescript
interface ShoppingList {
  id: string;
  menuPlanId: string;
  items: ShoppingItem[];
  generatedAt: Date;
}
```

### ShoppingItem
```typescript
interface ShoppingItem {
  ingredient: string;
  quantity: string;
  unit: string;
}
```

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer.*

### Propiedades Principales

**Propiedad 1: Aplicación de selección masiva**
*Para cualquier* plan de menú y tipo de comida (lunch o dinner), cuando se aplican selecciones masivas de comensales, todas las comidas de ese tipo sin comensales personalizados deben tener los mismos comensales que la selección masiva.
**Valida: Requisitos 3.3, 3.4**

**Propiedad 2: Aislamiento de sobrescritura**
*Para cualquier* plan de menú con algunas comidas teniendo comensales personalizados, cuando cambian las selecciones masivas, solo las comidas sin el flag de comensales personalizados deben actualizarse.
**Valida: Requisitos 3.5, 4.3**

**Propiedad 3: Persistencia del flag de sobrescritura**
*Para cualquier* comida, cuando los comensales se modifican individualmente, el flag has_custom_diners debe establecerse en true y permanecer true hasta que se limpie explícitamente.
**Valida: Requisitos 4.2**

**Propiedad 4: Reversión de sobrescritura**
*Para cualquier* comida con comensales personalizados, cuando se limpia la sobrescritura, los comensales de la comida deben coincidir con la selección masiva actual para su tipo de comida.
**Valida: Requisitos 4.4**

**Propiedad 5: Exclusión de ingredientes de la visualización**
*Para cualquier* plato, la salida de visualización debe contener solo el nombre del plato y no debe incluir campos de ingredientes o descripción.
**Valida: Requisitos 6.1, 6.2, 6.3, 6.4, 6.5**

**Propiedad 6: Persistencia de selección masiva**
*Para cualquier* usuario y tipo de comida, almacenar selecciones masivas de comensales y luego recuperarlas debe devolver el mismo conjunto de IDs de comensales.
**Valida: Requisitos 7.1, 7.5**

**Propiedad 7: Aislamiento de usuario**
*Para cualesquiera* dos usuarios diferentes, las selecciones masivas de comensales almacenadas para un usuario no deben ser visibles o accesibles para el otro usuario.
**Valida: Requisitos 7.3**

**Propiedad 8: Corrección de resolución de comensales**
*Para cualquier* comida, los comensales resueltos deben ser los comensales personalizados de la comida si has_custom_diners es true, de lo contrario la selección masiva para ese tipo de comida.
**Valida: Requisitos 9.2, 9.3**

**Propiedad 9: Precisión de cantidad de lista de compra**
*Para cualquier* plan de menú, las cantidades de la lista de compra deben calcularse usando los comensales resueltos (masivos o personalizados) para cada comida.
**Valida: Requisitos 9.1**

**Propiedad 10: Integridad referencial**
*Para cualquier* asignación de comensal de comida (masiva o personalizada), todos los IDs de miembros de familia referenciados deben existir en la tabla FamilyMember.
**Valida: Requisitos 9.5**

## Manejo de Errores

### Códigos de Estado HTTP
- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Error de validación o datos incorrectos
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

### Formato de Respuesta de Error
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

### Errores Específicos

- **Tipo de comida inválido**: Error 400 cuando el tipo de comida no es 'lunch' o 'dinner'
- **IDs de miembros de familia inválidos**: Error 400 cuando la selección masiva incluye miembros no existentes
- **Acceso no autorizado**: Error 403 cuando el usuario intenta acceder a preferencias de otro usuario
- **Comida no encontrada**: Error 404 cuando se intenta actualizar una comida no existente
- **Plan confirmado**: Error 403 cuando se intenta modificar comidas en un plan confirmado
- **Errores de IA**: Timeout (30s), rate limiting, respuestas malformadas

## Estrategia de Testing

### Testing Unitario

Los tests unitarios cubrirán ejemplos específicos y casos extremos:
- Validación de datos de usuario
- Lógica de creación y confirmación de planes
- Parseo de respuestas de ChatGPT
- Selecciones masivas vacías
- Comida sin comensales
- Cambio entre comensales masivos y personalizados

### Testing Basado en Propiedades

Los tests basados en propiedades verificarán propiedades universales usando **fast-check**:
- Cada test ejecutará un mínimo de 100 iteraciones
- Formato de etiqueta: `// Feature: menu-planning-app, Property {número}: {texto_propiedad}`
- Generadores para planes aleatorios, miembros de familia, selecciones masivas, etc.

### Testing de Integración

- Flujo end-to-end: Registro → Crear plan → Sobrescribir comida → Generar lista de compra
- Persistencia de base de datos
- Escenarios multi-usuario

### Cobertura Mínima

- Lógica de negocio crítica: 80%
- Servicios: 70%
- Endpoints: 100%

## Consideraciones de Rendimiento

- Índice en (user_id, meal_type) en tabla UserDinerPreferences
- Cachear selecciones masivas en memoria durante operaciones
- Agrupar consultas de resolución de comensales
- Usar diffing de DOM virtual en frontend

## Consideraciones de Seguridad

- Verificar que el usuario posee el plan antes de permitir modificaciones
- Sanitizar todos los IDs de miembros de familia
- Limitación de tasa para actualizaciones de selección masiva
- Asegurar que las consultas siempre filtran por ID de usuario autenticado
- Contraseñas hasheadas con bcrypt
- Sesiones expiran después de 24 horas

## Compatibilidad Hacia Atrás

- Las comidas existentes sin flag has_custom_diners tendrán valor por defecto false
- Los planes de menú existentes continuarán funcionando
- Script de migración establecerá has_custom_diners=true para comidas existentes
- Endpoints de API antiguos permanecen funcionales

## Mejoras Futuras

- Plantillas de comidas
- Valores por defecto basados en horario
- Preferencias masivas de platos
- Seguimiento de historial
- Sugerencias inteligentes basadas en planes pasados
