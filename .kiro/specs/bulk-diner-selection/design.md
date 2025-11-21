# Documento de Diseño

## Visión General

Este diseño mejora el sistema de planificación de menús introduciendo la selección masiva de comensales a nivel de tipo de comida (comida/cena) con sobrescrituras individuales por comida, y simplifica la visualización de platos para mostrar solo nombres sin ingredientes. La solución mantiene compatibilidad hacia atrás con los datos de comidas existentes mientras añade nuevas capacidades para mejorar la experiencia de usuario.

## Arquitectura

El sistema sigue una arquitectura de tres capas:

1. **Capa Frontend**: Interfaz mejorada del planificador de menús con controles de selección masiva de comensales
2. **Capa API Backend**: Nuevos endpoints y métodos de servicio para gestión masiva de comensales
3. **Capa de Datos**: Esquema extendido para almacenar preferencias masivas de comensales y flags de sobrescritura

### Decisiones Arquitectónicas Clave

- **Selecciones masivas almacenadas a nivel de usuario**: Las selecciones por defecto de comensales para comida y cena se almacenan como preferencias de usuario, no vinculadas a planes de menú específicos
- **Flag de sobrescritura a nivel de comida**: Las comidas individuales rastrean si usan selección masiva o tienen comensales personalizados
- **Resolución perezosa**: Las selecciones masivas se resuelven a comensales reales en tiempo de consulta, no se almacenan redundantemente
- **Cambio solo de visualización para ingredientes**: Los datos de ingredientes permanecen en la base de datos pero se filtran en la capa de presentación

## Componentes e Interfaces

### Extensiones del Esquema de Base de Datos

**Nueva tabla: UserDinerPreferences**
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

**Tabla modificada: Meal**
```sql
ALTER TABLE "Meal" ADD COLUMN has_custom_diners BOOLEAN DEFAULT FALSE;
```

### Componentes Backend

#### UserDinerPreferencesService

Nuevo servicio para gestionar selecciones masivas de comensales:

```typescript
interface DinerPreference {
  id: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  familyMemberId: string;
  createdAt: Date;
}

class UserDinerPreferencesService {
  // Obtener selecciones masivas para un tipo de comida
  async getPreferences(userId: string, mealType: 'lunch' | 'dinner'): Promise<string[]>
  
  // Establecer selecciones masivas para un tipo de comida
  async setPreferences(userId: string, mealType: 'lunch' | 'dinner', familyMemberIds: string[]): Promise<void>
  
  // Limpiar todas las preferencias para un tipo de comida
  async clearPreferences(userId: string, mealType: 'lunch' | 'dinner'): Promise<void>
}
```

#### MenuPlanService Mejorado

Métodos modificados:

```typescript
class MenuPlanService {
  // Modificado: Aplicar selecciones masivas al crear comidas
  async createMenuPlan(request: CreateMenuPlanRequest): Promise<MenuPlan>
  
  // Modificado: Establecer flag has_custom_diners al actualizar comida individual
  async updateMeal(request: UpdateMealRequest): Promise<Meal>
  
  // Nuevo: Aplicar selecciones masivas a todas las comidas sin comensales personalizados
  async applyBulkDiners(planId: string): Promise<MenuPlan>
  
  // Nuevo: Limpiar flag de comensales personalizados y revertir a selección masiva
  async revertToBulkDiners(mealId: string): Promise<Meal>
}
```

#### DatabaseService Mejorado

Nuevos métodos:

```typescript
class DatabaseService {
  // Preferencias de comensales
  async getUserDinerPreferences(userId: string, mealType: string): Promise<DinerPreference[]>
  async setUserDinerPreferences(userId: string, mealType: string, familyMemberIds: string[]): Promise<void>
  async deleteUserDinerPreferences(userId: string, mealType: string): Promise<void>
  
  // Flag de comensales personalizados de comida
  async setMealCustomDinersFlag(mealId: string, hasCustom: boolean): Promise<void>
  
  // Obtener comidas con comensales resueltos (aplicando masivos cuando sea necesario)
  async getMealWithResolvedDiners(mealId: string): Promise<Meal>
}
```

### Componentes Frontend

#### Componente BulkDinerSelector

Nuevo componente para seleccionar comensales por defecto:

```javascript
class BulkDinerSelector {
  constructor(mealType, familyMembers, initialSelection)
  
  render(): HTMLElement
  getSelectedDiners(): string[]
  setSelectedDiners(dinerIds: string[]): void
  
  // Eventos
  onChange(callback: (dinerIds: string[]) => void): void
}
```

#### Componente MealCard Mejorado

Modificado para mostrar indicador de sobrescritura:

```javascript
class MealCard {
  // Nueva propiedad
  hasCustomDiners: boolean
  
  // Modificado: Mostrar indicador cuando la comida tiene comensales personalizados
  render(): HTMLElement
  
  // Nuevo: Botón para revertir a selección masiva
  revertToBulkDiners(): Promise<void>
}
```

#### Componente DishDisplay

Modificado para excluir ingredientes:

```javascript
class DishDisplay {
  // Modificado: Solo mostrar nombre del plato, no ingredientes
  renderDish(dish: Dish): HTMLElement
}
```

### Endpoints de API

#### Nuevos Endpoints

```
POST   /api/users/:userId/diner-preferences/:mealType
  Body: { familyMemberIds: string[] }
  Response: { success: boolean }

GET    /api/users/:userId/diner-preferences/:mealType
  Response: { familyMemberIds: string[] }

DELETE /api/users/:userId/diner-preferences/:mealType
  Response: { success: boolean }

POST   /api/menu-plans/:planId/meals/:mealId/revert-diners
  Response: { meal: Meal }
```

#### Endpoints Modificados

```
POST /api/menu-plans
  - Ahora aplica selecciones masivas de comensales a nuevas comidas
  - Establece has_custom_diners = false para todas las comidas

PUT /api/menu-plans/:planId/meals/:mealId
  - Establece has_custom_diners = true cuando se proporcionan customDiners
  - Mantiene el flag al regenerar platos
```

## Modelos de Datos

### Modelo UserDinerPreferences

```typescript
interface UserDinerPreferences {
  id: string;
  userId: string;
  mealType: 'lunch' | 'dinner';
  familyMemberId: string;
  createdAt: Date;
}
```

### Modelo Meal Mejorado

```typescript
interface Meal {
  id: string;
  menuPlanId: string;
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
  hasCustomDiners: boolean;  // NUEVO
  diners: Diner[];
  dishes: Dish[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Modelo de Visualización de Plato

```typescript
interface DishDisplay {
  name: string;
  // campo ingredients excluido de la visualización
  // campo description excluido de la visualización
}
```

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*

### Reflexión sobre Propiedades

Antes de definir las propiedades finales, identificamos y eliminamos redundancias:

- Las propiedades 1.3 y 1.4 (aplicar selecciones masivas a comidas/cenas) se pueden combinar en una sola propiedad sobre aplicar selecciones masivas a todas las comidas de un tipo dado
- Las propiedades 3.1, 3.2, 3.3, 3.4 y 3.5 todas relacionadas con excluir ingredientes de la visualización se pueden consolidar en una propiedad comprensiva
- Las propiedades 5.2 y 5.3 (resolver comensales para masivo vs sobrescritura) se pueden combinar en una sola propiedad sobre resolución correcta de comensales basada en el flag de sobrescritura

### Propiedades Principales

**Propiedad 1: Aplicación de selección masiva**
*Para cualquier* plan de menú y tipo de comida (lunch o dinner), cuando se aplican selecciones masivas de comensales, todas las comidas de ese tipo sin comensales personalizados deben tener los mismos comensales que la selección masiva.
**Valida: Requisitos 1.3, 1.4**

**Propiedad 2: Aislamiento de sobrescritura**
*Para cualquier* plan de menú con algunas comidas teniendo comensales personalizados, cuando cambian las selecciones masivas, solo las comidas sin el flag de comensales personalizados deben actualizarse.
**Valida: Requisitos 1.5, 2.3**

**Propiedad 3: Persistencia del flag de sobrescritura**
*Para cualquier* comida, cuando los comensales se modifican individualmente, el flag has_custom_diners debe establecerse en true y permanecer true hasta que se limpie explícitamente.
**Valida: Requisitos 2.2**

**Propiedad 4: Reversión de sobrescritura**
*Para cualquier* comida con comensales personalizados, cuando se limpia la sobrescritura, los comensales de la comida deben coincidir con la selección masiva actual para su tipo de comida.
**Valida: Requisitos 2.4**

**Propiedad 5: Exclusión de ingredientes de la visualización**
*Para cualquier* plato, la salida de visualización debe contener solo el nombre del plato y no debe incluir campos de ingredientes o descripción.
**Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5**

**Propiedad 6: Persistencia de selección masiva**
*Para cualquier* usuario y tipo de comida, almacenar selecciones masivas de comensales y luego recuperarlas debe devolver el mismo conjunto de IDs de comensales.
**Valida: Requisitos 4.1, 4.5**

**Propiedad 7: Aislamiento de usuario**
*Para cualesquiera* dos usuarios diferentes, las selecciones masivas de comensales almacenadas para un usuario no deben ser visibles o accesibles para el otro usuario.
**Valida: Requisitos 4.3**

**Propiedad 8: Corrección de resolución de comensales**
*Para cualquier* comida, los comensales resueltos deben ser los comensales personalizados de la comida si has_custom_diners es true, de lo contrario la selección masiva para ese tipo de comida.
**Valida: Requisitos 5.2, 5.3**

**Propiedad 9: Precisión de cantidad de lista de compra**
*Para cualquier* plan de menú, las cantidades de la lista de compra deben calcularse usando los comensales resueltos (masivos o personalizados) para cada comida.
**Valida: Requisitos 5.1**

**Propiedad 10: Integridad referencial**
*Para cualquier* asignación de comensal de comida (masiva o personalizada), todos los IDs de miembros de familia referenciados deben existir en la tabla FamilyMember.
**Valida: Requisitos 5.5**

## Manejo de Errores

### Errores de Validación

- **Tipo de comida inválido**: Devolver error 400 cuando el tipo de comida no es 'lunch' o 'dinner'
- **IDs de miembros de familia inválidos**: Devolver error 400 cuando la selección masiva incluye miembros de familia no existentes
- **Acceso no autorizado**: Devolver error 403 cuando el usuario intenta acceder a preferencias de otro usuario
- **Comida no encontrada**: Devolver error 404 cuando se intenta actualizar una comida no existente
- **Plan confirmado**: Devolver error 403 cuando se intenta modificar comidas en un plan confirmado

### Errores de Base de Datos

- **Fallos de conexión**: Reintentar hasta 3 veces con backoff exponencial
- **Violaciones de restricciones**: Devolver error 400 con mensaje descriptivo
- **Fallos de transacción**: Hacer rollback y devolver error 500

### Manejo de Errores Frontend

- **Errores de red**: Mostrar mensaje amigable y opción de reintentar
- **Estado inválido**: Prevenir acciones que crearían estado inválido (ej. deshabilitar cambios de selección masiva cuando el plan está confirmado)
- **Actualizaciones optimistas**: Revertir cambios de UI si la actualización backend falla

## Estrategia de Testing

### Testing Unitario

Los tests unitarios cubrirán ejemplos específicos y casos extremos:

- Selecciones masivas vacías (sin comensales seleccionados)
- Selección de un solo comensal
- Todos los miembros de familia seleccionados
- Comida sin comensales (caso extremo)
- Usuario sin preferencias guardadas (caso extremo)
- Cambio entre comensales masivos y personalizados
- Confirmación de plan con comidas mixtas masivas/personalizadas

### Testing Basado en Propiedades

Los tests basados en propiedades verificarán propiedades universales a través de todas las entradas usando **fast-check** (librería PBT de JavaScript/TypeScript):

- Cada test basado en propiedades ejecutará un mínimo de 100 iteraciones
- Cada test será etiquetado con un comentario referenciando la propiedad del documento de diseño
- Formato de etiqueta: `// Feature: bulk-diner-selection, Property {número}: {texto_propiedad}`
- Los generadores crearán:
  - Planes de menú aleatorios con números variables de comidas
  - Conjuntos aleatorios de miembros de familia
  - Selecciones masivas aleatorias
  - Combinaciones aleatorias de comidas con/sin comensales personalizados
  - IDs de usuario aleatorios para testing de aislamiento

### Testing de Integración

- Flujo end-to-end: Establecer selecciones masivas → Crear plan → Sobrescribir comida individual → Verificar lista de compra
- Persistencia de base de datos: Almacenar preferencias → Reiniciar servicio → Verificar preferencias cargadas
- Escenarios multi-usuario: Múltiples usuarios con diferentes preferencias operando concurrentemente

## Fases de Implementación

### Fase 1: Esquema de Base de Datos y Fundamentos Backend

1. Crear tabla UserDinerPreferences
2. Añadir columna has_custom_diners a tabla Meal
3. Implementar UserDinerPreferencesService
4. Añadir métodos de base de datos para gestión de preferencias

### Fase 2: API Backend y Lógica de Negocio

1. Crear nuevos endpoints de API para preferencias de comensales
2. Modificar MenuPlanService para aplicar selecciones masivas
3. Implementar gestión de flag de sobrescritura
4. Añadir lógica de resolución de comensales

### Fase 3: Componentes Frontend

1. Crear componente BulkDinerSelector
2. Modificar MealCard para mostrar indicador de sobrescritura
3. Actualizar menu-planner.js para usar selecciones masivas
4. Implementar funcionalidad de revertir a masivo

### Fase 4: Simplificación de Visualización

1. Modificar componentes de visualización de platos para excluir ingredientes
2. Actualizar procesamiento de respuesta de IA para extraer solo nombres
3. Ajustar CSS para visualización más limpia de platos

### Fase 5: Testing y Refinamiento

1. Escribir tests unitarios para todos los componentes nuevos
2. Implementar tests basados en propiedades para propiedades principales
3. Ejecutar tests de integración
4. Testing de rendimiento con planes de menú grandes
5. Testing de aceptación de usuario

## Consideraciones de Rendimiento

- **Consultas de selección masiva**: Índice en (user_id, meal_type) en tabla UserDinerPreferences
- **Resolución de comensales**: Cachear selecciones masivas en memoria durante operaciones de plan de menú
- **Cálculo de lista de compra**: Agrupar consultas de resolución de comensales para minimizar viajes de ida y vuelta a base de datos
- **Renderizado frontend**: Usar diffing de DOM virtual para actualizar solo tarjetas de comida cambiadas

## Consideraciones de Seguridad

- **Autorización**: Verificar que el usuario posee el plan de menú antes de permitir modificaciones de comidas
- **Validación de entrada**: Sanitizar todos los IDs de miembros de familia para prevenir ataques de inyección
- **Limitación de tasa**: Limitar actualizaciones de selección masiva para prevenir abuso
- **Aislamiento de datos**: Asegurar que las consultas siempre filtran por ID de usuario autenticado

## Compatibilidad Hacia Atrás

- Las comidas existentes sin flag has_custom_diners tendrán valor por defecto false (usar selección masiva)
- Los planes de menú existentes continuarán funcionando con comensales de comidas individuales
- El script de migración establecerá has_custom_diners=true para todas las comidas existentes para preservar comportamiento actual
- Los endpoints de API antiguos permanecen funcionales, los nuevos endpoints son aditivos

## Mejoras Futuras

- **Plantillas de comidas**: Guardar combinaciones comunes de comensales como plantillas
- **Valores por defecto basados en horario**: Diferentes selecciones masivas para días de semana vs fines de semana
- **Preferencias masivas de platos**: Selección masiva similar para tipos de platos o cocinas
- **Seguimiento de historial**: Rastrear cambios a selecciones masivas a lo largo del tiempo
- **Sugerencias inteligentes**: Sugerir selecciones masivas basadas en planes de menú pasados
