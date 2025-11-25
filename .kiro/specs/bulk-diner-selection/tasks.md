# Plan de Implementación

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

**Flujo de Trabajo Git:**
```bash
# Después de que todos los tests pasen:
git add .
git commit -m "feat(bulk-diners): [descripción de la tarea completada]"
git push origin develop
```

---

- [x] 1. Actualizaciones de esquema de base de datos y migraciones
  - Crear tabla UserDinerPreferences con índices apropiados
  - Añadir columna has_custom_diners a tabla Meal
  - Crear script de migración para establecer has_custom_diners=true para comidas existentes
  - _Requisitos: 4.1, 4.3, 2.2_

- [x] 2. Backend: Implementación de UserDinerPreferencesService
  - [x] 2.1 Crear clase UserDinerPreferencesService con operaciones CRUD
    - Implementar método getPreferences(userId, mealType)
    - Implementar método setPreferences(userId, mealType, familyMemberIds)
    - Implementar método clearPreferences(userId, mealType)
    - _Requisitos: 4.1, 4.2, 4.5_

  - [x] 2.2 Escribir test de propiedad para persistencia de selección masiva
    - **Propiedad 6: Persistencia de selección masiva**
    - **Valida: Requisitos 4.1, 4.5**

  - [x] 2.3 Escribir test de propiedad para aislamiento de usuario
    - **Propiedad 7: Aislamiento de usuario**
    - **Valida: Requisitos 4.3**

  - [x] 2.4 Escribir tests unitarios para UserDinerPreferencesService
    - Testear selecciones vacías (caso extremo)
    - Testear selección de un solo comensal
    - Testear todos los miembros de familia seleccionados
    - Testear limpieza de preferencias
    - _Requisitos: 4.1, 4.2, 4.4, 4.5_

- [x] 3. Backend: Extensiones de DatabaseService
  - [x] 3.1 Añadir métodos de base de datos para preferencias de comensales
    - Implementar getUserDinerPreferences(userId, mealType)
    - Implementar setUserDinerPreferences(userId, mealType, familyMemberIds)
    - Implementar deleteUserDinerPreferences(userId, mealType)
    - Implementar setMealCustomDinersFlag(mealId, hasCustom)
    - _Requisitos: 4.1, 4.5, 2.2_

  - [x] 3.2 Implementar lógica de resolución de comensales
    - Crear método getMealWithResolvedDiners(mealId)
    - Resolver selecciones masivas cuando has_custom_diners es false
    - Usar comensales personalizados de la comida cuando has_custom_diners es true
    - _Requisitos: 5.2, 5.3_

  - [x] 3.3 Escribir test de propiedad para corrección de resolución de comensales
    - **Propiedad 8: Corrección de resolución de comensales**
    - **Valida: Requisitos 5.2, 5.3**

  - [x] 3.4 Escribir test de propiedad para integridad referencial
    - **Propiedad 10: Integridad referencial**
    - **Valida: Requisitos 5.5**

- [x] 4. Backend: Rutas de API para preferencias de comensales
  - [x] 4.1 Crear nuevas rutas en user.routes.ts
    - POST /api/users/:userId/diner-preferences/:mealType
    - GET /api/users/:userId/diner-preferences/:mealType
    - DELETE /api/users/:userId/diner-preferences/:mealType
    - Añadir middleware de autorización para verificar que el usuario posee las preferencias
    - _Requisitos: 4.1, 4.2, 4.3_

  - [x] 4.2 Añadir endpoint de revertir a masivo en menuPlan.routes.ts
    - POST /api/menu-plans/:planId/meals/:mealId/revert-diners
    - Verificar que el usuario posee el plan
    - Limpiar flag has_custom_diners
    - Aplicar selección masiva para el tipo de comida
    - _Requisitos: 2.4_

  - [x] 4.3 Escribir tests unitarios para nuevos endpoints de API
    - Testear almacenamiento y recuperación exitosa de preferencias
    - Testear acceso no autorizado (error 403)
    - Testear tipo de comida inválido (error 400)
    - Testear funcionalidad de revertir a masivo
    - _Requisitos: 4.1, 4.2, 4.3, 2.4_

- [x] 5. Backend: MenuPlanService mejorado
  - [x] 5.1 Modificar createMenuPlan para aplicar selecciones masivas
    - Cargar preferencias masivas de comensales del usuario para lunch y dinner
    - Aplicar selección masiva apropiada a cada comida basada en el tipo de comida
    - Establecer has_custom_diners=false para todas las comidas nuevas
    - _Requisitos: 1.3, 1.4_

  - [x] 5.2 Modificar updateMeal para establecer flag de comensales personalizados
    - Establecer has_custom_diners=true cuando se proporcionan customDiners
    - Mantener flag al regenerar platos sin cambiar comensales
    - _Requisitos: 2.2_

  - [x] 5.3 Implementar método applyBulkDiners
    - Actualizar todas las comidas sin flag de comensales personalizados
    - Aplicar selección masiva basada en tipo de comida
    - Saltar comidas con has_custom_diners=true
    - _Requisitos: 1.5, 2.3_

  - [x] 5.4 Escribir test de propiedad para aplicación de selección masiva
    - **Propiedad 1: Aplicación de selección masiva**
    - **Valida: Requisitos 1.3, 1.4**

  - [x] 5.5 Escribir test de propiedad para aislamiento de sobrescritura
    - **Propiedad 2: Aislamiento de sobrescritura**
    - **Valida: Requisitos 1.5, 2.3**

  - [x] 5.6 Escribir test de propiedad para persistencia de flag de sobrescritura
    - **Propiedad 3: Persistencia de flag de sobrescritura**
    - **Valida: Requisitos 2.2**

  - [x] 5.7 Escribir test de propiedad para reversión de sobrescritura
    - **Propiedad 4: Reversión de sobrescritura**
    - **Valida: Requisitos 2.4**

- [x] 6. Backend: Actualizaciones del servicio de lista de compra
  - [x] 6.1 Actualizar cálculo de lista de compra para usar comensales resueltos
    - Usar getMealWithResolvedDiners para cada comida
    - Calcular cantidades basadas en el conteo real de comensales
    - Manejar comidas con cero comensales (caso extremo)
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.2 Escribir test de propiedad para precisión de cantidad de lista de compra
    - **Propiedad 9: Precisión de cantidad de lista de compra**
    - **Valida: Requisitos 5.1**

  - [x] 6.3 Escribir tests unitarios para lista de compra con comidas mixtas
    - Testear plan con todas las comidas de selección masiva
    - Testear plan con todas las comidas de comensales personalizados
    - Testear plan con comidas mixtas masivas y personalizadas
    - Testear comida con cero comensales (caso extremo)
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Checkpoint - Tests de backend pasando
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas
  - ✅ 214 tests de backend pasando
  - ✅ 109 tests de frontend pasando
  - ✅ Código sin tipos `any` en TypeScript

- [x] 8. Frontend: Componente BulkDinerSelector
  - [x] 8.1 Crear clase BulkDinerSelector
    - Implementar constructor(mealType, familyMembers, initialSelection)
    - Implementar método render() con checkboxes para cada miembro de familia
    - Implementar método getSelectedDiners()
    - Implementar método setSelectedDiners(dinerIds)
    - Añadir manejador de evento onChange
    - _Requisitos: 1.1, 1.2_

  - [x] 8.2 Añadir estilos CSS para selector masivo de comensales
    - Estilizar lista de checkboxes
    - Añadir agrupación visual para selectores de lunch vs dinner
    - Asegurar diseño responsive
    - _Requisitos: 1.1, 1.2_

  - [x] 8.3 Escribir tests unitarios para componente BulkDinerSelector
    - Testear renderizado con miembros de familia vacíos
    - Testear renderizado con múltiples miembros de familia
    - Testear gestión de estado de selección
    - Testear disparo de evento onChange
    - ✅ 29 tests pasando
    - _Requisitos: 1.1, 1.2_

- [x] 9. Frontend: Actualizar menu-planner.js
  - [x] 9.1 Cargar y mostrar preferencias masivas de comensales
    - Obtener preferencias masivas del usuario al cargar la página
    - Crear instancias de BulkDinerSelector para lunch y dinner
    - Renderizar selectores en el formulario
    - _Requisitos: 1.1, 1.2, 4.2_

  - [x] 9.2 Guardar preferencias masivas cuando cambien
    - Añadir event listeners a selectores masivos
    - Llamar a API para guardar preferencias cuando cambie la selección
    - Mostrar mensajes de éxito/error
    - _Requisitos: 4.1, 4.5_

  - [x] 9.3 Aplicar selecciones masivas al crear plan de menú
    - Incluir selecciones masivas en la petición de creación de plan de menú
    - Actualizar llamada a API para pasar preferencias masivas de comensales
    - _Requisitos: 1.3, 1.4_

  - [x] 9.4 Escribir tests unitarios para flujo de selección masiva del planificador de menús
    - Testear carga de preferencias guardadas
    - Testear guardado de cambios de preferencias
    - Testear creación de plan con selecciones masivas
    - ✅ 6 tests nuevos pasando
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.5_

- [x] 10. Frontend: Componente MealCard mejorado
  - [x] 10.1 Añadir indicador de sobrescritura a tarjetas de comida
    - Verificar flag meal.hasCustomDiners
    - Mostrar badge/icono cuando la comida tiene comensales personalizados
    - Añadir tooltip explicando el indicador
    - _Requisitos: 2.5_

  - [x] 10.2 Añadir botón de revertir a masivo
    - Mostrar botón solo cuando la comida tiene comensales personalizados
    - Llamar a endpoint de API de revertir cuando se haga clic
    - Actualizar visualización de tarjeta de comida después de revertir
    - Mostrar diálogo de confirmación antes de revertir
    - _Requisitos: 2.4_

  - [x] 10.3 Actualizar funcionalidad de editar comensales
    - Establecer flag has_custom_diners cuando se editan comensales
    - Actualizar indicador de sobrescritura después de editar
    - _Requisitos: 2.2_

  - [x] 10.4 Escribir tests unitarios para características de sobrescritura de MealCard
    - Testear visualización de indicador de sobrescritura
    - Testear funcionalidad de botón de revertir a masivo
    - Testear actualizaciones de flag de comensales personalizados
    - _Requisitos: 2.2, 2.4, 2.5_

- [x] 11. Frontend: Simplificar visualización de platos
  - [x] 11.1 Modificar renderizado de platos para mostrar solo nombres
    - Actualizar lógica de visualización de platos de MealCard
    - Eliminar lista de ingredientes de la salida renderizada
    - Eliminar descripción de la salida renderizada
    - Mantener ingredientes en el modelo de datos para lista de compra
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 11.2 Actualizar CSS para visualización más limpia de platos
    - Ajustar espaciado sin listas de ingredientes
    - Asegurar que los nombres de platos sean prominentes
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 11.3 Escribir test de propiedad para exclusión de ingredientes
    - **Propiedad 5: Exclusión de ingredientes de la visualización**
    - **Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 11.4 Escribir tests unitarios para visualización de platos
    - Testear que el renderizado de platos contiene solo el nombre
    - Testear que los ingredientes no están presentes en el DOM
    - Testear que la descripción no está presente en el DOM
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Frontend: Actualizar menu-planner.html
  - [x] 12.1 Añadir secciones de selector masivo de comensales al formulario
    - Añadir sección para selección de comensales de lunch
    - Añadir sección para selección de comensales de dinner
    - Añadir etiquetas e instrucciones
    - Posicionar antes o después de campos de formulario existentes
    - _Requisitos: 1.1, 1.2_

  - [x] 12.2 Actualizar diseño y estilo del formulario
    - Asegurar que los selectores masivos sean visualmente distintos
    - Añadir secciones colapsables si es necesario
    - Mantener diseño responsive
    - _Requisitos: 1.1, 1.2_

- [x] 13. Testing de integración
  - [x] 13.1 Testear flujo completo de selección masiva
    - Establecer preferencias masivas → Crear plan → Verificar que las comidas tienen comensales correctos
    - Cambiar preferencias masivas → Verificar que las comidas no sobrescritas se actualizan
    - _Requisitos: 1.3, 1.4, 1.5_

  - [x] 13.2 Testear flujo de sobrescritura
    - Crear plan con masivo → Sobrescribir comida individual → Cambiar masivo → Verificar que sobrescritura se preserva
    - Sobrescribir comida → Revertir a masivo → Verificar que masivo se aplica
    - _Requisitos: 2.2, 2.3, 2.4_

  - [x] 13.3 Testear lista de compra con comidas mixtas
    - Crear plan con comidas masivas y personalizadas → Generar lista de compra → Verificar cantidades correctas
    - _Requisitos: 5.1, 5.2, 5.3_

  - [x] 13.4 Testear persistencia entre sesiones
    - Establecer preferencias masivas → Recargar página → Verificar que las preferencias se cargan
    - _Requisitos: 4.2_

- [ ] 14. Checkpoint final - Todos los tests pasando
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas
