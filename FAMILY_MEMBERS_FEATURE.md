# Family Members Feature

## Descripción

Esta funcionalidad permite a los usuarios gestionar miembros de familia y personas relacionadas que comerán con ellos. Los usuarios pueden:

1. **Añadir miembros de familia** con sus preferencias alimentarias y restricciones dietéticas
2. **Asignar miembros específicos a cada comida** en la planificación
3. **Calcular cantidades precisas** en la lista de compra basándose en el número real de comensales por comida

## Cambios en la Base de Datos

### Nuevas Tablas

#### `FamilyMember`
Almacena información sobre las personas relacionadas con cada usuario.

```sql
CREATE TABLE "FamilyMember" (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES "User"(id),
  name VARCHAR(255) NOT NULL,
  preferences TEXT,
  dietary_restrictions TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `MealDiner`
Tabla de relación muchos-a-muchos entre comidas y miembros de familia.

```sql
CREATE TABLE "MealDiner" (
  id UUID PRIMARY KEY,
  meal_id UUID REFERENCES "Meal"(id),
  family_member_id UUID REFERENCES "FamilyMember"(id),
  created_at TIMESTAMP,
  UNIQUE(meal_id, family_member_id)
);
```

### Migración

Para aplicar los cambios a una base de datos existente, ejecutar:

```bash
psql -U postgres -d menu_planner -f migrations/add_family_members.sql
```

O para una instalación nueva, el schema.sql ya incluye estas tablas.

## Backend API

### Nuevos Endpoints

#### Family Members

- `GET /api/family-members` - Obtener todos los miembros de familia del usuario
- `GET /api/family-members/:id` - Obtener un miembro específico
- `POST /api/family-members` - Crear un nuevo miembro
- `PUT /api/family-members/:id` - Actualizar un miembro
- `DELETE /api/family-members/:id` - Eliminar un miembro

#### Ejemplo de Request

```json
POST /api/family-members
{
  "name": "María",
  "preferences": "Le gusta la pasta y el pescado",
  "dietary_restrictions": "Intolerante a la lactosa"
}
```

#### Ejemplo de Response

```json
{
  "member": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "María",
    "preferences": "Le gusta la pasta y el pescado",
    "dietary_restrictions": "Intolerante a la lactosa",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### Servicios

#### `FamilyMemberService`

Nuevas funciones:
- `getFamilyMembers(userId)` - Obtener todos los miembros
- `getFamilyMemberById(memberId, userId)` - Obtener un miembro específico
- `createFamilyMember(userId, data)` - Crear miembro
- `updateFamilyMember(memberId, userId, data)` - Actualizar miembro
- `deleteFamilyMember(memberId, userId)` - Eliminar miembro
- `addDinersToMeal(mealId, familyMemberIds)` - Asignar comensales a una comida
- `getMealDiners(mealId)` - Obtener comensales de una comida
- `getMealDinerCount(mealId)` - Obtener número de comensales

## Frontend

### Nueva Página: Family Members

**Ruta:** `/family-members.html`

Características:
- Formulario para añadir nuevos miembros
- Lista de miembros existentes en formato de tarjetas
- Edición de miembros mediante modal
- Eliminación de miembros con confirmación

### Archivos Nuevos

- `public/family-members.html` - Página HTML
- `public/js/family-members.js` - Lógica JavaScript
- Estilos añadidos a `public/styles.css`

### Integración con Navegación

Se ha añadido el enlace "Miembros de Familia" en el menú de navegación de todas las páginas:
- Dashboard
- Menu Planner
- Profile
- Shopping List

## Próximos Pasos (Pendientes de Implementación)

### 1. Integración con Meal Cards

Actualizar `meal-card.js` para:
- Mostrar selector de miembros de familia en lugar de inputs de texto
- Permitir seleccionar qué miembros comerán en cada comida
- Guardar la relación en la tabla `MealDiner`

### 2. Actualización de Shopping List

Modificar el cálculo de cantidades para:
- Contar el número real de comensales por comida (desde `MealDiner`)
- Ajustar las cantidades de ingredientes proporcionalmente
- Mostrar información sobre comensales en la lista

### 3. Integración con AI

Actualizar `AIService` para:
- Considerar las preferencias de los miembros seleccionados
- Tener en cuenta las restricciones dietéticas
- Generar menús más personalizados

## Testing

### Backend Tests

Todos los tests existentes pasan correctamente:
- 10 test suites
- 185 tests

### Frontend Tests

Todos los tests existentes pasan correctamente:
- 6 test suites  
- 104 tests (5 skipped)

### Tests Pendientes

Se recomienda añadir tests para:
- Rutas de family members
- Servicio de family members
- Interfaz de usuario de family members

## Uso

### 1. Añadir Miembros de Familia

1. Ir a "Miembros de Familia" desde el menú
2. Completar el formulario con nombre, preferencias y restricciones
3. Hacer clic en "Añadir Miembro"

### 2. Gestionar Miembros

- **Editar:** Click en "Editar" en la tarjeta del miembro
- **Eliminar:** Click en "Eliminar" (requiere confirmación)

### 3. Asignar a Comidas (Próximamente)

En la planificación de menús, podrás seleccionar qué miembros comerán en cada comida específica.

## Notas Técnicas

- La tabla `Diner` antigua se mantiene por compatibilidad pero está marcada como deprecated
- Se usa `MealDiner` para la nueva funcionalidad
- Todas las operaciones requieren autenticación
- Los miembros están vinculados al usuario y solo son visibles para él
- La eliminación de un usuario elimina en cascada sus miembros de familia

## Seguridad

- Todas las rutas requieren autenticación mediante JWT
- Los usuarios solo pueden ver y modificar sus propios miembros
- Validación de datos en backend con Zod
- Protección contra inyección SQL mediante queries parametrizadas
