# Implementation Plan

- [x] 1. Configurar estructura del proyecto y dependencias
  - Inicializar proyecto Node.js con TypeScript
  - Instalar dependencias: Hono, pg, dotenv, nodemon, @types/node, @types/pg
  - Configurar tsconfig.json para TypeScript
  - Crear estructura de carpetas: src/models, src/services, src/controllers, src/routes, src/config, public
  - Configurar archivo .env con variables de entorno (DATABASE_URL, OPENAI_API_KEY, PORT)
  - comprobar con pruebas conexiones con bd en postgres y con API ChatGPT
  - Configurar scripts en package.json (dev, build, start)
  - _Requirements: Todos_

- [x] 2. Configurar base de datos PostgreSQL
  - Crear script de inicialización de base de datos (schema.sql)
  - Implementar tablas: User, MenuPlan, Meal, Diner, Dish, ShoppingList según el esquema definido
  - Crear módulo de conexión a PostgreSQL usando pg
  - Implementar pool de conexiones con manejo de errores
  - _Requirements: Todos_

- [x] 3. Implementar modelos de datos TypeScript
  - Crear interfaces TypeScript: User, MenuPlan, Meal, Diner, Dish, ShoppingList, ShoppingItem
  - Crear tipos auxiliares: MealType, DishCourse, MenuPlanStatus
  - Implementar validadores de datos para cada modelo
  - _Requirements: Todos_

- [x] 4. Implementar DatabaseService
  - Crear clase DatabaseService con métodos genéricos de acceso a datos
  - Implementar métodos CRUD para User
  - Implementar métodos CRUD para MenuPlan
  - Implementar métodos CRUD para Meal, Diner, Dish
  - Implementar métodos para ShoppingList
  - Añadir manejo de transacciones y rollback
  - _Requirements: Todos_

- [x] 5. Implementar UserService
  - Crear método createUser() con hash de contraseña
  - Crear método updateUser() para actualizar datos del usuario
  - Crear método updatePreferences() para actualizar preferencias alimentarias
  - Crear método deleteUser() para eliminar cuenta
  - Implementar validación de email único
  - _Requirements: Registro, actualizar datos, eliminar cuenta, actualizar preferencias_

- [x] 6. Implementar sistema de autenticación
  - Crear AuthService con métodos login() y logout()
  - Implementar hash de contraseñas con bcrypt
  - Crear middleware de autenticación JWT o sesiones
  - Implementar validación de credenciales
  - _Requirements: Registro, login_

- [x] 7. Implementar AIService para integración con ChatGPT
  - Configurar cliente de OpenAI API
  - Crear método generateWeeklyMenu() que recibe preferencias, comensales y restricciones
  - Implementar prompt engineering para generar menús personalizados
  - Crear método regenerateMeal() para regenerar comidas individuales
  - Crear método generateShoppingList() para generar lista de compra
  - Implementar parseo de respuestas JSON de ChatGPT
  - Añadir manejo de errores: timeout, rate limiting, respuestas malformadas
  - _Requirements: Generar planificación, cambiar comida individual, generar lista de compra_

- [x] 8. Implementar MenuPlanService
  - Crear método createMenuPlan() que coordina con AIService
  - Implementar lógica para considerar preferencias de múltiples comensales
  - Crear método updateMeal() para actualizar comida específica
  - Crear método confirmPlan() para cambiar estado a 'confirmed'
  - Implementar validación de número de comensales y platos
  - _Requirements: Generar planificación, especificar comensales, definir número de platos, confirmar dieta_

- [x] 9. Implementar controladores y rutas de autenticación
  - Crear POST /api/auth/register con validación de datos y campo de preferencias
  - Crear POST /api/auth/login con validación de credenciales
  - Crear POST /api/auth/logout
  - Implementar manejo de errores HTTP (400, 401, 500)
  - _Requirements: Registro con preferencias_

- [x] 10. Implementar controladores y rutas de usuario
  - Crear GET /api/users/:id para obtener datos del usuario
  - Crear PUT /api/users/:id para actualizar datos
  - Crear PUT /api/users/:id/preferences para actualizar preferencias
  - Crear DELETE /api/users/:id para eliminar cuenta
  - Añadir middleware de autenticación a todas las rutas
  - _Requirements: Actualizar datos, actualizar preferencias, eliminar cuenta_

- [x] 11. Implementar controladores y rutas de planificación de menús
  - Crear POST /api/menu-plans para crear nueva planificación con comensales por defecto
  - Crear GET /api/menu-plans/:id para obtener planificación
  - Crear PUT /api/menu-plans/:id/meals/:mealId para actualizar comida específica
  - Crear POST /api/menu-plans/:id/confirm para confirmar planificación
  - Implementar validación de permisos (usuario propietario)
  - _Requirements: Generar planificación, cambiar comida individual, confirmar dieta_

- [x] 12. Implementar controladores y rutas de lista de compra
  - Crear POST /api/shopping-lists para generar lista desde planificación confirmada
  - Crear GET /api/shopping-lists/:id para obtener lista
  - Validar que la planificación esté confirmada antes de generar lista
  - _Requirements: Generar lista de compra_

- [-] 13. Implementar middleware de manejo de errores global
  - Crear middleware onError en Hono
  - Mapear excepciones a códigos HTTP apropiados
  - Implementar formato de respuesta de error consistente
  - Añadir logging de errores
  - _Requirements: Todos_

- [ ] 14. Crear estructura HTML base del frontend
  - Crear index.html con estructura básica
  - Crear páginas: register.html, login.html, profile.html, menu-planner.html, shopping-list.html
  - Añadir enlaces de navegación entre páginas
  - Incluir meta tags y configuración responsive
  - _Requirements: Todos_

- [ ] 15. Implementar estilos CSS
  - Crear styles.css con estilos globales
  - Diseñar formularios de registro y login
  - Diseñar interfaz de planificador de menús
  - Diseñar tarjetas de comidas (MealCard)
  - Diseñar interfaz de lista de compra
  - Implementar diseño responsive
  - _Requirements: Todos_

- [ ] 16. Implementar AuthComponent en frontend
  - Crear auth.js con funciones de registro y login
  - Implementar formulario de registro con campo de preferencias (textarea)
  - Implementar formulario de login
  - Añadir validación de formularios en cliente
  - Implementar gestión de token/sesión en localStorage
  - Añadir redirección después de login exitoso
  - _Requirements: Registro con preferencias_

- [ ] 17. Implementar UserProfileComponent en frontend
  - Crear profile.js para gestión de perfil
  - Mostrar datos del usuario actual
  - Implementar formulario de edición de datos
  - Implementar formulario de edición de preferencias alimentarias
  - Añadir botón de eliminar cuenta con confirmación
  - Implementar llamadas a API de usuario
  - _Requirements: Actualizar datos, actualizar preferencias, eliminar cuenta_

- [ ] 18. Implementar MenuPlannerComponent en frontend
  - Crear menu-planner.js para planificación de menús
  - Implementar selector de días de la semana (checkboxes)
  - Añadir campo para número de comensales por defecto
  - Crear botón "Generar Planificación" que llama a API
  - Mostrar loading mientras se genera el menú
  - Renderizar menú generado usando MealCard
  - _Requirements: Generar planificación, especificar comensales por defecto_

- [ ] 19. Implementar MealCardComponent en frontend
  - Crear meal-card.js para visualización de comidas individuales
  - Mostrar día, tipo de comida (lunch/dinner) y platos
  - Implementar editor de número de comensales por comida
  - Añadir campos para definir nombres de comensales
  - Implementar selector de número de platos
  - Añadir botón "Regenerar comida" que llama a API
  - Mostrar ingredientes de cada plato
  - _Requirements: Cambiar comensales por comida, definir número de platos, cambiar comida individual_

- [ ] 20. Implementar confirmación de planificación en frontend
  - Añadir botón "Confirmar Planificación" en menu-planner.js
  - Implementar llamada a API POST /api/menu-plans/:id/confirm
  - Mostrar mensaje de éxito al confirmar
  - Deshabilitar edición después de confirmar
  - Mostrar botón para generar lista de compra
  - _Requirements: Confirmar dieta_

- [ ] 21. Implementar ShoppingListComponent en frontend
  - Crear shopping-list.js para lista de compra
  - Implementar botón "Generar Lista de Compra" que llama a API
  - Renderizar lista de ingredientes con cantidades
  - Agrupar ingredientes por categorías (opcional)
  - Añadir funcionalidad de impresión/exportación
  - _Requirements: Generar lista de compra_

- [ ] 22. Implementar manejo de errores en frontend
  - Crear función handleApiCall() para centralizar llamadas a API
  - Implementar función showErrorNotification() para mostrar errores al usuario
  - Añadir manejo de errores de red
  - Implementar retry para errores de IA
  - Mostrar mensajes de error amigables
  - _Requirements: Todos_

- [ ] 23. Conectar frontend con backend
  - Crear módulo api.js con funciones para cada endpoint
  - Implementar fetch con headers de autenticación
  - Configurar CORS en backend si es necesario
  - Probar flujo completo: registro → login → crear plan → confirmar → lista
  - _Requirements: Todos_

- [ ]* 24. Implementar tests unitarios del backend
  - Escribir tests para UserService (createUser, updateUser, deleteUser, updatePreferences)
  - Escribir tests para MenuPlanService (createMenuPlan, updateMeal, confirmPlan)
  - Escribir tests para AIService (parseo de respuestas, manejo de errores)
  - Escribir tests para validadores
  - Configurar mocks para ChatGPT API
  - _Requirements: Todos_

- [ ]* 25. Implementar tests de integración
  - Escribir tests para endpoints de autenticación
  - Escribir tests para endpoints de usuario
  - Escribir tests para endpoints de planificación
  - Escribir tests para endpoints de lista de compra
  - Configurar base de datos de prueba
  - _Requirements: Todos_
