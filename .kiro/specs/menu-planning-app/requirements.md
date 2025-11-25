# Documento de Requisitos - Aplicación de Planificación de Menús

## Introducción

Esta aplicación web ofrece un sistema inteligente de planificación de menús semanales basado en preferencias y restricciones alimentarias definidas por el usuario. Mediante un modelo de IA integrado, la app sugiere comidas y cenas para los días seleccionados, adaptándose a parámetros como dieta personalizada, alimentación vegana, necesidades específicas (por ejemplo, celiaquía) o limitaciones basadas en gustos individuales.

La funcionalidad principal incluye la selección masiva de comensales a nivel de tipo de comida (todas las comidas, todas las cenas) con la capacidad de sobrescribir comidas individuales cuando sea necesario. El usuario puede revisar el menú propuesto plato por plato, confirmarlo o modificar cualquier sugerencia de manera interactiva. Una vez validado el menú completo, la aplicación genera automáticamente la lista de la compra correspondiente.

## Glosario

- **Planificador de Menús**: La interfaz principal donde los usuarios crean y gestionan planes de menú semanales
- **Tipo de Comida**: Categoría de comida - "lunch" (comida) o "dinner" (cena)
- **Comensal**: Una persona que comerá una comida específica (puede ser el usuario o un miembro de la familia)
- **Selección Masiva**: Establecer comensales para todas las comidas de un tipo específico a la vez
- **Sobrescritura Individual**: Cambiar los comensales de una comida específica, diferente de la selección masiva
- **Visualización de Plato**: La representación visual de una comida sugerida o planificada
- **Miembro de Familia**: Persona registrada en el sistema con preferencias alimentarias propias

## Requisitos Funcionales

### Requisito 1: Gestión de Usuarios

**Historia de Usuario:** Como usuario, quiero registrarme y gestionar mi cuenta en la aplicación, para poder acceder a mis planificaciones de menú personalizadas.

#### Criterios de Aceptación

1. WHEN un usuario accede a la página de registro THEN el sistema SHALL mostrar un formulario con campos para nombre, email, contraseña y preferencias alimentarias
2. WHEN un usuario completa el registro THEN el sistema SHALL crear una cuenta y almacenar las preferencias alimentarias
3. WHEN un usuario inicia sesión THEN el sistema SHALL validar las credenciales y crear una sesión autenticada
4. WHEN un usuario actualiza sus datos THEN el sistema SHALL persistir los cambios en la base de datos
5. WHEN un usuario solicita eliminar su cuenta THEN el sistema SHALL eliminar todos los datos asociados del usuario

### Requisito 2: Gestión de Miembros de Familia

**Historia de Usuario:** Como usuario, quiero gestionar los miembros de mi familia con sus preferencias alimentarias, para poder planificar menús que se adapten a todos.

#### Criterios de Aceptación

1. WHEN un usuario añade un miembro de familia THEN el sistema SHALL almacenar el nombre y preferencias alimentarias del miembro
2. WHEN un usuario actualiza un miembro de familia THEN el sistema SHALL persistir los cambios
3. WHEN un usuario elimina un miembro de familia THEN el sistema SHALL eliminar el miembro y actualizar las comidas asociadas
4. WHEN se muestra la lista de miembros THEN el sistema SHALL mostrar todos los miembros con sus preferencias

### Requisito 3: Selección Masiva de Comensales

**Historia de Usuario:** Como usuario, quiero establecer comensales por defecto para todas las comidas y todas las cenas desde la interfaz principal de planificación, para no tener que seleccionar comensales para cada comida individual.

#### Criterios de Aceptación

1. WHEN un usuario accede al planificador de menús THEN el sistema SHALL mostrar controles para establecer comensales por defecto para todas las comidas
2. WHEN un usuario accede al planificador de menús THEN el sistema SHALL mostrar controles para establecer comensales por defecto para todas las cenas
3. WHEN se muestran los selectores de comensales THEN el sistema SHALL incluir al usuario logueado como opción de comensal junto con los miembros de familia
4. WHEN un usuario accede al planificador de menús por primera vez THEN el sistema SHALL mostrar al usuario logueado como seleccionado por defecto en ambos selectores
5. WHEN un usuario selecciona comensales para todas las comidas THEN el sistema SHALL aplicar esos comensales a cada comida del tipo lunch en el plan actual
6. WHEN un usuario selecciona comensales para todas las cenas THEN el sistema SHALL aplicar esos comensales a cada comida del tipo dinner en el plan actual
7. WHEN se genera un plan de menú THEN el sistema SHALL incluir siempre al usuario logueado como comensal en todas las comidas
8. WHEN un usuario cambia la selección masiva de comensales THEN el sistema SHALL actualizar todas las comidas de ese tipo que no hayan sido sobrescritas individualmente

### Requisito 4: Sobrescritura Individual de Comensales

**Historia de Usuario:** Como usuario, quiero sobrescribir los comensales por defecto para comidas individuales específicas, para poder manejar excepciones sin cambiar la selección masiva.

#### Criterios de Aceptación

1. WHEN un usuario abre una tarjeta de comida individual THEN el sistema SHALL mostrar los comensales actuales para esa comida
2. WHEN se muestra el selector de comensales en una comida individual THEN el sistema SHALL incluir al usuario logueado como opción junto con los miembros de familia
3. WHEN un usuario modifica los comensales de una comida individual THEN el sistema SHALL marcar esa comida como teniendo una sobrescritura individual
4. WHEN una comida tiene una sobrescritura individual THEN el sistema SHALL no actualizar los comensales de esa comida cuando cambien las selecciones masivas
5. WHEN un usuario elimina una sobrescritura individual THEN el sistema SHALL revertir esa comida para usar la selección masiva de su tipo de comida
6. WHEN se muestra una comida con sobrescritura individual THEN el sistema SHALL proporcionar indicación visual de que difiere de la selección masiva

### Requisito 5: Generación de Menús con IA

**Historia de Usuario:** Como usuario, quiero que la IA genere menús personalizados basados en las preferencias de los comensales, para obtener sugerencias adaptadas a mis necesidades.

#### Criterios de Aceptación

1. WHEN un usuario solicita generar un menú THEN el sistema SHALL enviar las preferencias de todos los comensales a la IA
2. WHEN la IA genera un menú THEN el sistema SHALL crear comidas con platos que respeten las preferencias alimentarias
3. WHEN un usuario regenera una comida específica THEN el sistema SHALL mantener los comensales y solo cambiar los platos
4. WHEN la IA genera platos THEN el sistema SHALL incluir nombre, descripción e ingredientes
5. WHEN hay múltiples comensales con preferencias diferentes THEN el sistema SHALL generar platos que acomoden todas las restricciones

### Requisito 6: Visualización Simplificada de Platos

**Historia de Usuario:** Como usuario, quiero ver solo los nombres de los platos sin listas de ingredientes en la visualización de comidas, para que la interfaz sea más limpia y fácil de escanear.

#### Criterios de Aceptación

1. WHEN el sistema genera sugerencias de comidas THEN el sistema SHALL mostrar solo el nombre del plato
2. WHEN el sistema muestra comidas guardadas THEN el sistema SHALL mostrar solo el nombre del plato
3. WHEN un usuario ve una tarjeta de comida THEN el sistema SHALL no mostrar la lista de ingredientes en la vista principal
4. WHEN el sistema formatea información de platos para mostrar THEN el sistema SHALL excluir detalles de ingredientes de la salida
5. WHEN el servicio de IA devuelve sugerencias de comidas THEN el sistema SHALL extraer solo el nombre del plato para propósitos de visualización

### Requisito 7: Persistencia de Preferencias

**Historia de Usuario:** Como usuario, quiero que la selección masiva de comensales persista entre sesiones, para no tener que reconfigurarla cada vez que uso el planificador.

#### Criterios de Aceptación

1. WHEN un usuario establece selecciones masivas de comensales THEN el sistema SHALL almacenar esas selecciones en la base de datos
2. WHEN un usuario carga el planificador de menús THEN el sistema SHALL recuperar y mostrar las selecciones masivas de comensales guardadas
3. WHEN se almacenan selecciones masivas de comensales THEN el sistema SHALL asociarlas con el usuario específico
4. WHEN un usuario no tiene selecciones masivas guardadas THEN el sistema SHALL usar selecciones vacías como valor por defecto
5. WHEN se actualizan las selecciones masivas THEN el sistema SHALL persistir los cambios inmediatamente

### Requisito 8: Gestión de Planes de Menú

**Historia de Usuario:** Como usuario, quiero crear, visualizar y confirmar planes de menú semanales, para organizar mis comidas de manera eficiente.

#### Criterios de Aceptación

1. WHEN un usuario crea un plan de menú THEN el sistema SHALL permitir seleccionar días de la semana y tipos de comida
2. WHEN un usuario visualiza un plan THEN el sistema SHALL mostrar todas las comidas organizadas por día y tipo
3. WHEN un usuario confirma un plan THEN el sistema SHALL marcar el plan como confirmado y prevenir modificaciones
4. WHEN un plan está en borrador THEN el sistema SHALL permitir modificaciones de comidas individuales
5. WHEN un usuario tiene múltiples planes THEN el sistema SHALL mostrar una lista de todos sus planes

### Requisito 9: Generación de Lista de Compra

**Historia de Usuario:** Como usuario, quiero generar automáticamente una lista de compra desde mi plan de menú confirmado, para facilitar mis compras.

#### Criterios de Aceptación

1. WHEN se calculan cantidades de lista de compra THEN el sistema SHALL usar los comensales reales asignados a cada comida
2. WHEN una comida usa selección masiva THEN el sistema SHALL resolver los comensales de la selección masiva actual para ese tipo de comida
3. WHEN una comida tiene una sobrescritura individual THEN el sistema SHALL usar los comensales de la sobrescritura para los cálculos
4. WHEN no se establecen comensales para una comida THEN el sistema SHALL tratarla como teniendo cero comensales para cálculos de cantidad
5. WHEN el sistema actualiza comensales de comidas THEN el sistema SHALL mantener integridad referencial con las tablas FamilyMember y User
6. WHEN se genera una lista de compra THEN el sistema SHALL agregar ingredientes comunes y calcular cantidades totales

### Requisito 10: Visualización de Comensales en Tarjetas de Comida

**Historia de Usuario:** Como usuario, quiero ver claramente qué comensales están asignados a cada comida en el plan generado, para verificar que la selección masiva se aplicó correctamente.

#### Criterios de Aceptación

1. WHEN el sistema muestra una tarjeta de comida THEN el sistema SHALL mostrar los nombres de todos los comensales asignados a esa comida
2. WHEN una comida tiene comensales de selección masiva THEN el sistema SHALL mostrar esos comensales resueltos desde las preferencias del usuario
3. WHEN una comida tiene comensales personalizados THEN el sistema SHALL mostrar esos comensales específicos
4. WHEN una comida no tiene comensales asignados THEN el sistema SHALL mostrar un mensaje indicando que no hay comensales
5. WHEN el frontend recibe datos de comida del backend THEN el sistema SHALL procesar correctamente el array de objetos de comensales
6. WHEN se inicializa una tarjeta de comida THEN el sistema SHALL extraer los IDs de comensales del array de objetos de comensales

## Requisitos No Funcionales

### Rendimiento

1. El sistema SHALL responder a las peticiones de usuario en menos de 2 segundos (excluyendo llamadas a IA)
2. La generación de menús con IA SHALL completarse en menos de 30 segundos
3. El sistema SHALL soportar al menos 100 usuarios concurrentes

### Seguridad

1. Las contraseñas SHALL almacenarse hasheadas usando bcrypt
2. Las sesiones de usuario SHALL expirar después de 24 horas de inactividad
3. El sistema SHALL validar y sanitizar todas las entradas de usuario
4. El acceso a datos de usuario SHALL requerir autenticación

### Usabilidad

1. La interfaz SHALL ser responsive y funcionar en dispositivos móviles
2. Los mensajes de error SHALL ser claros y orientados al usuario
3. El sistema SHALL proporcionar feedback visual para todas las acciones

### Mantenibilidad

1. El código SHALL seguir principios de clean code
2. El código TypeScript SHALL evitar el uso de tipos `any`
3. El sistema SHALL tener una cobertura de tests mínima del 70%
4. La documentación SHALL mantenerse actualizada con los cambios del código
