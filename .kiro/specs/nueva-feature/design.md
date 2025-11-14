# Design Document

## Overview

Este documento describe la arquitectura y las decisiones de diseño de la aplicación web de planificación inteligente de menús. El proyecto se construirá siguiendo el paradigma Modelo-Vista-Controlador (MVC) para asegurar una separación lógica clara, facilitar la extensibilidad y mantener un código ordenado y sostenible.

El frontend se desarrollará utilizando exclusivamente Vanilla JavaScript, HTML y CSS, evitando frameworks para garantizar simplicidad, control total sobre el cliente y una base ligera y fácilmente depurable.

El backend se implementará en Node.js con TypeScript y el framework Hono, proporcionando un entorno rápido, tipado y minimalista para la construcción de la API. La aplicación se conectará a una base de datos PostgreSQL mediante la librería pg, incorporando a su vez herramientas como dotenv para la gestión segura de variables de entorno y Nodemon para optimizar el flujo de desarrollo.

El sistema integrará además la API de ChatGPT para generar sugerencias personalizadas de menús mediante un modelo de IA, adaptándose a las preferencias y restricciones del usuario.

Como parte esencial de la calidad del proyecto, se desarrollará un conjunto de tests unitarios que cubran la lógica central de la aplicación, asegurando la fiabilidad del código, facilitando la detección temprana de errores y apoyando la evolución futura del sistema.

## Architecture

### Arquitectura General (MVC)

La aplicación sigue el patrón Modelo-Vista-Controlador:

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

## Components and Interfaces

### Frontend Components

**1. AuthComponent**
- Formulario de registro con campo de preferencias alimentarias
- Formulario de login
- Gestión de sesión del usuario

**2. UserProfileComponent**
- Visualización de datos del usuario
- Edición de preferencias alimentarias
- Eliminación de cuenta

**3. MenuPlannerComponent**
- Selector de días de la semana
- Configuración de comensales por defecto
- Botón para generar planificación

**4. MealCardComponent**
- Visualización de cada comida individual
- Editor de número de comensales por comida
- Selector de número de platos
- Botón para regenerar comida específica
- Botón de confirmación

**5. ShoppingListComponent**
- Visualización de lista de la compra generada
- Exportación/impresión de lista

### Backend API Endpoints

**Autenticación**
- `POST /api/auth/register` - Registro de usuario con preferencias
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/logout` - Logout de usuario

**Usuario**
- `GET /api/users/:id` - Obtener datos del usuario
- `PUT /api/users/:id` - Actualizar datos del usuario
- `PUT /api/users/:id/preferences` - Actualizar preferencias alimentarias
- `DELETE /api/users/:id` - Eliminar cuenta

**Planificación de Menús**
- `POST /api/menu-plans` - Crear nueva planificación
- `GET /api/menu-plans/:id` - Obtener planificación específica
- `PUT /api/menu-plans/:id/meals/:mealId` - Actualizar comida específica
- `POST /api/menu-plans/:id/confirm` - Confirmar planificación

**Lista de Compra**
- `POST /api/shopping-lists` - Generar lista de compra desde planificación
- `GET /api/shopping-lists/:id` - Obtener lista de compra

**IA**
- `POST /api/ai/generate-menu` - Generar menú completo
- `POST /api/ai/regenerate-meal` - Regenerar comida específica

### Servicios Internos

**1. AIService**
- `generateWeeklyMenu(preferences, diners, constraints)` - Genera menú semanal
- `regenerateMeal(mealContext, preferences, diners)` - Regenera comida individual
- `generateShoppingList(confirmedMeals)` - Genera lista de compra

**2. UserService**
- `createUser(userData)` - Crea nuevo usuario
- `updateUser(userId, userData)` - Actualiza usuario
- `deleteUser(userId)` - Elimina usuario
- `updatePreferences(userId, preferences)` - Actualiza preferencias

**3. MenuPlanService**
- `createMenuPlan(userId, config)` - Crea planificación
- `updateMeal(planId, mealId, newMeal)` - Actualiza comida
- `confirmPlan(planId)` - Confirma planificación

**4. DatabaseService**
- Abstracción de operaciones con PostgreSQL usando pg

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  preferences: string; // Texto libre con preferencias alimentarias
  defaultDiners: number;
  createdAt: Date;
  updatedAt: Date;
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
  dayOfWeek: string; // 'monday', 'tuesday', etc.
  mealType: 'lunch' | 'dinner';
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
  preferences?: string; // Preferencias específicas del comensal
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

### Esquema de Base de Datos (PostgreSQL)

```sql
-- Tabla User
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

-- Tabla MenuPlan
CREATE TABLE "MenuPlan" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla Meal
CREATE TABLE "Meal" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_plan_id UUID REFERENCES "MenuPlan"(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla Diner
CREATE TABLE "Diner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  preferences TEXT
);

-- Tabla Dish
CREATE TABLE "Dish" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES "Meal"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB,
  course VARCHAR(20) NOT NULL
);

-- Tabla ShoppingList
CREATE TABLE "ShoppingList" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_plan_id UUID REFERENCES "MenuPlan"(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Estrategia General

**1. Códigos de Estado HTTP**
- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Error de validación o datos incorrectos
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

**2. Formato de Respuesta de Error**
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

**3. Manejo de Errores en Backend**

```typescript
// Middleware de manejo de errores en Hono
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err instanceof ValidationError) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: err.message } }, 400);
  }
  
  if (err instanceof AuthenticationError) {
    return c.json({ error: { code: 'AUTH_ERROR', message: err.message } }, 401);
  }
  
  if (err instanceof NotFoundError) {
    return c.json({ error: { code: 'NOT_FOUND', message: err.message } }, 404);
  }
  
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500);
});
```

**4. Manejo de Errores en Frontend**

```javascript
async function handleApiCall(apiFunction) {
  try {
    const response = await apiFunction();
    return { success: true, data: response };
  } catch (error) {
    console.error('API Error:', error);
    showErrorNotification(error.message);
    return { success: false, error };
  }
}
```

**5. Errores Específicos de la IA**

- Timeout de ChatGPT API (30 segundos)
- Rate limiting de OpenAI
- Respuestas malformadas de la IA
- Fallback: Mostrar mensaje al usuario y permitir reintentar

**6. Errores de Base de Datos**

- Conexión perdida: Reintentar con backoff exponencial
- Constraint violations: Mapear a errores de validación
- Transacciones: Rollback automático en caso de error

## Testing Strategy

### Alcance de Testing

**1. Tests Unitarios (Backend)**

Cubrir la lógica central de la aplicación:

- **UserService**: Validación de datos, creación/actualización de usuarios
- **MenuPlanService**: Lógica de creación y confirmación de planes
- **AIService**: Parseo de respuestas de ChatGPT, generación de listas de compra
- **Validadores**: Validación de emails, preferencias, configuraciones

**2. Tests de Integración (Backend)**

- Endpoints de API con base de datos de prueba
- Flujo completo: registro → crear plan → confirmar → generar lista
- Manejo de errores en endpoints

**3. Tests del Frontend**

- Validación de formularios
- Renderizado de componentes principales
- Interacciones del usuario (clicks, cambios de estado)

### Herramientas

- **Framework de Testing**: Jest o Vitest
- **Base de Datos de Prueba**: PostgreSQL en local
- **Mocking**: Mockear llamadas a ChatGPT API para tests predecibles

### Estructura de Tests

```
tests/
├── unit/
│   ├── services/
│   │   ├── user.service.test.ts
│   │   ├── menu-plan.service.test.ts
│   │   └── ai.service.test.ts
│   └── validators/
│       └── user.validator.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── menu-plan.test.ts
│   └── shopping-list.test.ts
└── frontend/
    ├── auth.test.js
    └── menu-planner.test.js
```

### Cobertura Mínima

- Lógica de negocio crítica: 80%
- Servicios: 70%
- Endpoints: 100%

### Ejecución de Tests

```bash
# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Todos los tests
npm test

# Tests con cobertura
npm run test:coverage
```

### CI/CD

- Ejecutar tests automáticamente en cada push
- Bloquear merge si los tests fallan
- Generar reporte de cobertura
