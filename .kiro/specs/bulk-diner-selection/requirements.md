# Documento de Requisitos

## Introducción

Esta funcionalidad mejora la experiencia de usuario para gestionar comensales en la planificación de menús, permitiendo la selección masiva de comensales a nivel de tipo de comida (todas las comidas, todas las cenas) con la capacidad de sobrescribir comidas individuales cuando sea necesario. Además, simplifica la visualización de platos mostrando solo los nombres sin listas de ingredientes.

## Glosario

- **Planificador de Menús**: La interfaz principal donde los usuarios crean y gestionan planes de menú semanales
- **Tipo de Comida**: Categoría de comida - "lunch" (comida) o "dinner" (cena)
- **Comensal**: Una persona que comerá una comida específica (puede ser el usuario o un miembro de la familia)
- **Selección Masiva**: Establecer comensales para todas las comidas de un tipo específico a la vez
- **Sobrescritura Individual**: Cambiar los comensales de una comida específica, diferente de la selección masiva
- **Visualización de Plato**: La representación visual de una comida sugerida o planificada

## Requisitos

### Requisito 1

**Historia de Usuario:** Como usuario, quiero establecer comensales por defecto para todas las comidas y todas las cenas desde la interfaz principal de planificación, para no tener que seleccionar comensales para cada comida individual.

#### Criterios de Aceptación

1. WHEN un usuario accede al planificador de menús THEN el sistema SHALL mostrar controles para establecer comensales por defecto para todas las comidas
2. WHEN un usuario accede al planificador de menús THEN el sistema SHALL mostrar controles para establecer comensales por defecto para todas las cenas
3. WHEN un usuario selecciona comensales para todas las comidas THEN el sistema SHALL aplicar esos comensales a cada comida del tipo lunch en el plan actual
4. WHEN un usuario selecciona comensales para todas las cenas THEN el sistema SHALL aplicar esos comensales a cada comida del tipo dinner en el plan actual
5. WHEN un usuario cambia la selección masiva de comensales THEN el sistema SHALL actualizar todas las comidas de ese tipo que no hayan sido sobrescritas individualmente

### Requisito 2

**Historia de Usuario:** Como usuario, quiero sobrescribir los comensales por defecto para comidas individuales específicas, para poder manejar excepciones sin cambiar la selección masiva.

#### Criterios de Aceptación

1. WHEN un usuario abre una tarjeta de comida individual THEN el sistema SHALL mostrar los comensales actuales para esa comida
2. WHEN un usuario modifica los comensales de una comida individual THEN el sistema SHALL marcar esa comida como teniendo una sobrescritura individual
3. WHEN una comida tiene una sobrescritura individual THEN el sistema SHALL no actualizar los comensales de esa comida cuando cambien las selecciones masivas
4. WHEN un usuario elimina una sobrescritura individual THEN el sistema SHALL revertir esa comida para usar la selección masiva de su tipo de comida
5. WHEN se muestra una comida con sobrescritura individual THEN el sistema SHALL proporcionar indicación visual de que difiere de la selección masiva

### Requisito 3

**Historia de Usuario:** Como usuario, quiero ver solo los nombres de los platos sin listas de ingredientes en la visualización de comidas, para que la interfaz sea más limpia y fácil de escanear.

#### Criterios de Aceptación

1. WHEN el sistema genera sugerencias de comidas THEN el sistema SHALL mostrar solo el nombre del plato
2. WHEN el sistema muestra comidas guardadas THEN el sistema SHALL mostrar solo el nombre del plato
3. WHEN un usuario ve una tarjeta de comida THEN el sistema SHALL no mostrar la lista de ingredientes en la vista principal
4. WHEN el sistema formatea información de platos para mostrar THEN el sistema SHALL excluir detalles de ingredientes de la salida
5. WHEN el servicio de IA devuelve sugerencias de comidas THEN el sistema SHALL extraer solo el nombre del plato para propósitos de visualización

### Requisito 4

**Historia de Usuario:** Como usuario, quiero que la selección masiva de comensales persista entre sesiones, para no tener que reconfigurarla cada vez que uso el planificador.

#### Criterios de Aceptación

1. WHEN un usuario establece selecciones masivas de comensales THEN el sistema SHALL almacenar esas selecciones en la base de datos
2. WHEN un usuario carga el planificador de menús THEN el sistema SHALL recuperar y mostrar las selecciones masivas de comensales guardadas
3. WHEN se almacenan selecciones masivas de comensales THEN el sistema SHALL asociarlas con el usuario específico
4. WHEN un usuario no tiene selecciones masivas guardadas THEN el sistema SHALL usar selecciones vacías como valor por defecto
5. WHEN se actualizan las selecciones masivas THEN el sistema SHALL persistir los cambios inmediatamente

### Requisito 5

**Historia de Usuario:** Como sistema, quiero mantener la integridad de datos entre selecciones masivas y comensales de comidas individuales, para que los cálculos de la lista de compra permanezcan precisos.

#### Criterios de Aceptación

1. WHEN se calculan cantidades de lista de compra THEN el sistema SHALL usar los comensales reales asignados a cada comida
2. WHEN una comida usa selección masiva THEN el sistema SHALL resolver los comensales de la selección masiva actual para ese tipo de comida
3. WHEN una comida tiene una sobrescritura individual THEN el sistema SHALL usar los comensales de la sobrescritura para los cálculos
4. WHEN no se establecen comensales para una comida THEN el sistema SHALL tratarla como teniendo cero comensales para cálculos de cantidad
5. WHEN el sistema actualiza comensales de comidas THEN el sistema SHALL mantener integridad referencial con las tablas FamilyMember y User
