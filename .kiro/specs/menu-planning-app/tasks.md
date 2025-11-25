# Plan de Implementación - Aplicación de Planificación de Menús

## Instrucciones Importantes

**Después de completar CADA tarea:**
1. Implementar o actualizar tests para verificar la nueva funcionalidad
2. Ejecutar TODOS los tests (backend y frontend) para asegurar que nada está roto
3. Si todos los tests pasan: hacer commit a la rama develop y push
4. Si los tests fallan: arreglar los problemas hasta que todos los tests pasen, luego hacer commit y push
5. Nunca pasar a la siguiente tarea hasta que todos los tests estén pasando y los cambios estén commiteados

**Requisitos de Testing:**
- Cada nueva función/método debe tener tests correspondientes
- Ejecutar `npm test` para tests de backend
- Ejecutar `npm run test:frontend` para tests de frontend
- Asegurar que el 100% de los tests pasen antes de hacer commit
- Evitar tipos `any` en TypeScript

**Flujo de Trabajo Git:**
```bash
# Después de que todos los tests pasen:
git add .
git commit -m "feat: [descripción de la tarea completada]"
git push origin develop
```

---

## Fase 1: Configuración Inicial

- [x] 1. Configurar estructura del proyecto y dependencias
  - Inicializar proyecto Node.js con TypeScript
  - Instalar dependencias: Hono, pg, dotenv, nodemon, bcrypt, jsonwebtoken
  - Configurar tsconfig.json
  - Crear estructura de carpetas: src/models, src/services, src/controllers, src/routes, src/config, public
  - Configurar archivo .env con variables de entorno
  - Configurar scripts en package.json
  - _Requisitos: Todos_

- [x] 2. Configurar base de datos PostgreSQL
  - Crear script de inicialización (schema.sql)
  - Implementar tablas: User, FamilyMember, UserDinerPreferences, MenuPlan, Meal, Diner, Dish, ShoppingList
  - Crear módulo de conexión a PostgreSQL usando pg
  - Implementar pool de conexiones con manejo de errores
  - _Requisitos: Todos_

- [x] 3. Implementar modelos de datos TypeScript
  - Crear interfaces: User, FamilyMember, MenuPlan, Meal, Diner, Dish, ShoppingList, ShoppingItem
  - Crear tipos auxiliares: MealType, DishCourse, MenuPlanStatus
  - Implementar validadores de datos
  - _Requisitos: Todos_

## Fase 2: Backend Core

- [x] 4. Implementar DatabaseService
  - Crear clase DatabaseService con métodos genéricos
  - Implementar métodos CRUD para User
  - Implementar métodos CRUD para FamilyMember
  - Implementar métodos CRUD para MenuPlan, Meal, Diner, Dish
  - Implementar métodos para ShoppingList
  - Añadir manejo de transacciones
  - _Requisitos: Todos_

- [x] 5. Implementar UserService
  - Crear método createUser() con hash de contraseña
  - Crear método updateUser()
  - Crear método updatePreferences()
  - Crear método deleteUser()
  - Implementar validación de email único
  - _Requisitos: 1_

- [x] 6. Implementar sistema de autenticación
  - Crear AuthService con métodos login() y logout()
  - Implementar hash de contraseñas con bcrypt
  - Crear middleware de autenticación JWT
  - Implementar validación de credenciales
  - _Requisitos: 1_

- [x] 7. Implementar AIService para integración con ChatGPT
  - Crear método generateWeeklyMenu()
  - Crear método regenerateMeal()
  - Crear método generateShoppingList()
  - Implementar manejo de errores de API
  - Implementar timeout y retry logic
  - _Requisitos: 5, 9_

## Fase 3: Feature de Selección Masiva de Comensales

- [x] 8. Actualizaciones de esquema de base de datos
  - Crear tabla UserDinerPreferences con índices
  - Añadir columna has_custom_diners a tabla Meal
  - Crear script de migración para comidas existentes
  - _Requisitos: 3, 4, 7_

- [x] 9. Implementar UserDinerPreferencesService
  - Crear método getPreferences(userId, mealType)
  - Crear método setPreferences(userId, mealType, familyMemberIds)
  - Crear método clearPreferences(userId, mealType)
  - Escribir tests unitarios y de propiedades
  - _Requisitos: 3, 7_

- [x] 10. Extender DatabaseService para preferencias
  - Implementar getUserDinerPreferences()
  - Implementar setUserDinerPreferences()
  - Implementar deleteUserDinerPreferences()
  - Implementar setMealCustomDinersFlag()
  - Implementar getMealWithResolvedDiners()
  - Escribir tests de propiedades
  - _Requisitos: 3, 4, 7, 9_

- [x] 11. Implementar MenuPlanService mejorado
  - Modificar createMenuPlan() para aplicar selecciones masivas
  - Modificar updateMeal() para establecer flag has_custom_diners
  - Implementar método applyBulkDiners()
  - Implementar método revertToBulkDiners()
  - Escribir tests de propiedades
  - _Requisitos: 3, 4, 8, 9_

- [x] 12. Actualizar servicio de lista de compra
  - Actualizar cálculo para usar comensales resueltos
  - Manejar comidas con cero comensales
  - Escribir tests de propiedades
  - _Requisitos: 9_

## Fase 4: API Backend

- [x] 13. Implementar rutas de autenticación
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - Escribir tests de integración
  - _Requisitos: 1_

- [x] 14. Implementar rutas de usuario
  - GET /api/users/:id
  - PUT /api/users/:id
  - PUT /api/users/:id/preferences
  - DELETE /api/users/:id
  - Escribir tests de integración
  - _Requisitos: 1_

- [x] 15. Implementar rutas de miembros de familia
  - GET /api/users/:userId/family-members
  - POST /api/users/:userId/family-members
  - PUT /api/family-members/:id
  - DELETE /api/family-members/:id
  - Escribir tests de integración
  - _Requisitos: 2_

- [x] 16. Implementar rutas de preferencias de comensales
  - POST /api/users/:userId/diner-preferences/:mealType
  - GET /api/users/:userId/diner-preferences/:mealType
  - DELETE /api/users/:userId/diner-preferences/:mealType
  - Añadir middleware de autorización
  - Escribir tests de integración
  - _Requisitos: 3, 7_

- [x] 17. Implementar rutas de planificación de menús
  - POST /api/menu-plans
  - GET /api/menu-plans/:id
  - PUT /api/menu-plans/:id/meals/:mealId
  - POST /api/menu-plans/:id/confirm
  - POST /api/menu-plans/:id/meals/:mealId/revert-diners
  - Escribir tests de integración
  - _Requisitos: 3, 4, 8_

- [x] 18. Implementar rutas de lista de compra
  - POST /api/shopping-lists
  - GET /api/shopping-lists/:id
  - Escribir tests de integración
  - _Requisitos: 9_

## Fase 5: Frontend Core

- [x] 19. Crear estructura HTML base
  - Crear index.html (landing page)
  - Crear register.html
  - Crear login.html
  - Crear dashboard.html
  - Crear menu-planner.html
  - Crear family-members.html
  - Crear shopping-list.html
  - _Requisitos: Todos_

- [x] 20. Implementar estilos CSS
  - Crear styles.css con diseño responsive
  - Estilizar formularios
  - Estilizar tarjetas de comida
  - Estilizar selectores de comensales
  - Asegurar accesibilidad
  - _Requisitos: Todos_

- [x] 21. Implementar AuthComponent
  - Crear formulario de registro
  - Crear formulario de login
  - Implementar gestión de sesión
  - Implementar logout
  - Escribir tests unitarios
  - _Requisitos: 1_

- [x] 22. Implementar UserProfileComponent
  - Crear visualización de perfil
  - Crear formulario de edición
  - Implementar actualización de preferencias
  - Implementar eliminación de cuenta
  - Escribir tests unitarios
  - _Requisitos: 1_

- [x] 23. Implementar FamilyMemberComponent
  - Crear lista de miembros de familia
  - Crear formulario de añadir miembro
  - Implementar edición de miembros
  - Implementar eliminación de miembros
  - Escribir tests unitarios
  - _Requisitos: 2_

## Fase 6: Frontend - Selección Masiva

- [x] 24. Implementar componente BulkDinerSelector
  - Crear clase BulkDinerSelector
  - Implementar render() con checkboxes
  - Implementar getSelectedDiners()
  - Implementar setSelectedDiners()
  - Añadir manejador onChange
  - Añadir estilos CSS
  - Escribir tests unitarios
  - _Requisitos: 3_

- [x] 33. Incluir usuario logueado en selectores de comensales
  - Modificar menu-planner.js para incluir usuario en lista de comensales
  - Actualizar BulkDinerSelector para aceptar usuario + miembros de familia
  - Modificar MealCard para incluir usuario en selector de comensales
  - Actualizar tests para verificar inclusión del usuario
  - _Requisitos: 3.3, 4.2_

- [x] 25. Actualizar menu-planner.js
  - Cargar y mostrar preferencias masivas
  - Crear instancias de BulkDinerSelector
  - Guardar preferencias cuando cambien
  - Aplicar selecciones masivas al crear plan
  - Escribir tests unitarios
  - _Requisitos: 3, 7_

- [x] 26. Implementar componente MealCard mejorado
  - Añadir indicador de sobrescritura
  - Añadir botón de revertir a masivo
  - Actualizar funcionalidad de editar comensales
  - Modificar renderizado de platos (solo nombres)
  - Escribir tests unitarios
  - _Requisitos: 4, 6_

- [x] 27. Actualizar menu-planner.html
  - Añadir secciones de selector masivo
  - Actualizar diseño del formulario
  - Asegurar diseño responsive
  - _Requisitos: 3_

- [x] 28. Implementar ShoppingListComponent
  - Crear visualización de lista de compra
  - Implementar generación de lista
  - Implementar exportación/impresión
  - Escribir tests unitarios
  - _Requisitos: 9_

## Fase 7: Testing y Refinamiento

- [x] 29. Checkpoint - Tests de backend pasando
  - Ejecutar todos los tests de backend
  - Verificar cobertura mínima (70%)
  - Verificar ausencia de tipos `any`
  - Arreglar cualquier test fallido
  - _Requisitos: Todos_

- [x] 30. Checkpoint - Tests de frontend pasando
  - Ejecutar todos los tests de frontend
  - Verificar cobertura mínima (70%)
  - Arreglar cualquier test fallido
  - _Requisitos: Todos_

- [x] 31. Testing de integración
  - Testear flujo completo de selección masiva
  - Testear flujo de sobrescritura
  - Testear lista de compra con comidas mixtas
  - Testear persistencia entre sesiones
  - _Requisitos: 3, 4, 7, 9_

- [x] 32. Checkpoint final - Todos los tests pasando
  - Ejecutar suite completa de tests
  - Verificar que todos los tests pasen
  - Verificar ausencia de tipos `any`
  - Documentar estado final
  - _Requisitos: Todos_

## Fase 8: Corrección de Visualización de Comensales

- [ ] 34. Arreglar visualización de comensales en MealCard
  - Modificar constructor de MealCard para extraer IDs de comensales del array `meal.diners`
  - Actualizar `renderDinersInfo()` para usar los objetos de comensales completos
  - Modificar `saveMealSettings()` para manejar correctamente la respuesta del backend
  - Actualizar tests de MealCard para verificar extracción correcta de IDs
  - Escribir test de propiedad para verificar visualización correcta
  - _Requisitos: 10_

- [ ] 35. Checkpoint - Verificar visualización de comensales
  - Ejecutar todos los tests (backend y frontend)
  - Verificar manualmente que los comensales se muestran correctamente
  - Verificar que la selección masiva se aplica correctamente
  - Arreglar cualquier test fallido
  - _Requisitos: 10_

## Estado Final

✅ **Proyecto completado exitosamente**

### Resumen de Tests:
- **Backend**: 214 tests pasando (13 suites)
- **Frontend**: 155 tests pasando, 5 skipped (7 suites)
- **Total**: 369 tests pasando

### Calidad del Código:
- ✅ Sin tipos `any` en TypeScript
- ✅ Todos los tests pasando
- ✅ Código siguiendo principios de clean code
- ✅ Cobertura de tests > 70%

### Funcionalidades Implementadas:
1. ✅ Sistema de autenticación y gestión de usuarios
2. ✅ Gestión de miembros de familia con preferencias
3. ✅ Selección masiva de comensales para lunch y dinner
4. ✅ Persistencia de preferencias en base de datos
5. ✅ Aplicación automática de preferencias masivas
6. ✅ Sobrescritura individual de comidas
7. ✅ Reversión de sobrescrituras a selección masiva
8. ✅ Generación de menús con IA (ChatGPT)
9. ✅ Visualización simplificada de platos (solo nombres)
10. ✅ Resolución correcta de comensales para lista de compra
11. ✅ Generación automática de lista de compra
12. ✅ Componentes frontend completos y testeados
13. ✅ Integración completa backend-frontend
