# Guía de Pruebas de Integración Frontend-Backend

Esta guía describe cómo probar el flujo completo de la aplicación desde el registro hasta la generación de la lista de compra.

## Requisitos Previos

1. **Base de datos PostgreSQL** debe estar corriendo
2. **Variables de entorno** configuradas en `.env`:
   ```
   DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/menu_planner
   OPENAI_API_KEY=tu_api_key_de_openai
   PORT=3000
   JWT_SECRET=tu_secreto_jwt
   ```

## Iniciar el Servidor

```bash
# Compilar TypeScript
npm run build

# Iniciar servidor en modo desarrollo
npm run dev

# O iniciar servidor en modo producción
npm start
```

El servidor debería mostrar:
```
✓ Server is running on http://localhost:3000
```

## Flujo de Prueba Completo

### 1. Verificar que el servidor está corriendo

```bash
curl http://localhost:3000/api
```

Respuesta esperada:
```json
{
  "message": "Menu Planner API - Server is running"
}
```

### 2. Registro de Usuario

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Test",
    "email": "test@example.com",
    "password": "Test1234",
    "preferences": "No me gusta el tomate natural, soy vegetariano",
    "defaultDiners": 2
  }'
```

Respuesta esperada:
```json
{
  "user": {
    "id": "uuid",
    "name": "Usuario Test",
    "email": "test@example.com",
    "preferences": "No me gusta el tomate natural, soy vegetariano",
    "defaultDiners": 2
  },
  "token": "jwt_token"
}
```

### 3. Login

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

Respuesta esperada:
```json
{
  "user": {
    "id": "uuid",
    "name": "Usuario Test",
    "email": "test@example.com"
  },
  "token": "jwt_token"
}
```

**Guardar el token** para las siguientes peticiones.

### 4. Obtener Datos del Usuario

**Endpoint:** `GET /api/users/:id`

```bash
curl http://localhost:3000/api/users/{USER_ID} \
  -H "Authorization: Bearer {TOKEN}"
```

### 5. Crear Planificación de Menú

**Endpoint:** `POST /api/menu-plans`

```bash
curl -X POST http://localhost:3000/api/menu-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "startDate": "2024-01-15",
    "endDate": "2024-01-21",
    "days": ["monday", "tuesday", "wednesday"],
    "mealTypes": ["lunch", "dinner"],
    "customDiners": 2
  }'
```

Respuesta esperada:
```json
{
  "menuPlan": {
    "id": "uuid",
    "userId": "uuid",
    "startDate": "2024-01-15",
    "endDate": "2024-01-21",
    "status": "draft",
    "meals": [
      {
        "id": "uuid",
        "dayOfWeek": "monday",
        "mealType": "lunch",
        "diners": [...],
        "dishes": [...]
      }
    ]
  }
}
```

### 6. Actualizar Comida Específica

**Endpoint:** `PUT /api/menu-plans/:planId/meals/:mealId`

```bash
curl -X PUT http://localhost:3000/api/menu-plans/{PLAN_ID}/meals/{MEAL_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "diners": [
      {"name": "Juan", "preferences": ""},
      {"name": "María", "preferences": ""}
    ],
    "numberOfDishes": 2,
    "regenerate": false
  }'
```

### 7. Confirmar Planificación

**Endpoint:** `POST /api/menu-plans/:id/confirm`

```bash
curl -X POST http://localhost:3000/api/menu-plans/{PLAN_ID}/confirm \
  -H "Authorization: Bearer {TOKEN}"
```

Respuesta esperada:
```json
{
  "menuPlan": {
    "id": "uuid",
    "status": "confirmed",
    ...
  }
}
```

### 8. Generar Lista de Compra

**Endpoint:** `POST /api/shopping-lists`

```bash
curl -X POST http://localhost:3000/api/shopping-lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "menuPlanId": "{PLAN_ID}"
  }'
```

Respuesta esperada:
```json
{
  "shoppingList": {
    "id": "uuid",
    "menuPlanId": "uuid",
    "items": [
      {
        "ingredient": "Arroz",
        "quantity": "500",
        "unit": "g"
      }
    ]
  }
}
```

## Prueba desde el Frontend

### 1. Abrir la aplicación

Navega a `http://localhost:3000` en tu navegador.

### 2. Flujo completo de usuario

1. **Registro**
   - Ir a `/register.html`
   - Completar formulario con:
     - Nombre: "Usuario Test"
     - Email: "test@example.com"
     - Contraseña: "Test1234"
     - Preferencias: "No me gusta el tomate natural"
     - Comensales por defecto: 2
   - Click en "Registrarse"
   - Deberías ser redirigido a `/login.html`

2. **Login**
   - Completar formulario con email y contraseña
   - Click en "Iniciar Sesión"
   - Deberías ser redirigido a `/dashboard.html`

3. **Crear Planificación**
   - Ir a `/menu-planner.html`
   - Seleccionar fechas de inicio y fin
   - Seleccionar días de la semana
   - Seleccionar tipos de comida (almuerzo/cena)
   - Especificar número de comensales
   - Click en "Generar Planificación"
   - Esperar a que la IA genere el menú

4. **Editar Comida**
   - Click en "Editar" en cualquier comida
   - Cambiar número de comensales
   - Definir nombres de comensales
   - Cambiar número de platos
   - Click en "Guardar Cambios"

5. **Regenerar Comida**
   - Click en "Regenerar" en cualquier comida
   - Confirmar la acción
   - Esperar a que la IA genere una nueva comida

6. **Confirmar Planificación**
   - Click en "Confirmar Planificación"
   - Confirmar la acción
   - La planificación quedará bloqueada para edición

7. **Generar Lista de Compra**
   - Click en "Generar Lista de Compra"
   - Serás redirigido a `/shopping-list.html`
   - Verás la lista de ingredientes agrupados por categorías

8. **Exportar Lista**
   - Click en "Imprimir" para imprimir
   - Click en "Exportar TXT" para descargar
   - Click en "Copiar" para copiar al portapapeles

## Verificación de CORS

Si tienes problemas de CORS, verifica:

1. El servidor tiene configurado CORS en `src/index.ts`:
```typescript
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

2. Las peticiones desde el frontend incluyen los headers correctos:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

## Solución de Problemas

### Error: "Error de conexión"

- Verifica que el servidor esté corriendo en `http://localhost:3000`
- Verifica que la base de datos PostgreSQL esté corriendo
- Revisa los logs del servidor para ver errores

### Error: "Sesión expirada"

- El token JWT ha expirado
- Vuelve a hacer login para obtener un nuevo token

### Error: "Error al comunicarse con la IA"

- Verifica que `OPENAI_API_KEY` esté configurada correctamente en `.env`
- Verifica que tengas créditos disponibles en tu cuenta de OpenAI
- Revisa los logs del servidor para ver el error específico

### Error: "Menu plan must be confirmed"

- Debes confirmar la planificación antes de generar la lista de compra
- Click en "Confirmar Planificación" primero

## Logs del Servidor

Para ver logs detallados del servidor:

```bash
# En modo desarrollo
npm run dev

# Los logs mostrarán:
# - Peticiones HTTP recibidas
# - Errores de la base de datos
# - Errores de la API de OpenAI
# - Errores de validación
```

## Tests Automatizados

Para ejecutar tests automatizados:

```bash
# Tests del backend
npm test

# Tests del frontend
npm run test:frontend

# Tests de integración
npm run test:integration

# Todos los tests
npm run test:all
```

## Checklist de Verificación

- [ ] Servidor corriendo en puerto 3000
- [ ] Base de datos PostgreSQL conectada
- [ ] Variables de entorno configuradas
- [ ] Registro de usuario funciona
- [ ] Login funciona y devuelve token
- [ ] Crear planificación funciona
- [ ] Editar comida funciona
- [ ] Regenerar comida funciona
- [ ] Confirmar planificación funciona
- [ ] Generar lista de compra funciona
- [ ] Notificaciones de error se muestran correctamente
- [ ] Notificaciones de éxito se muestran correctamente
- [ ] Reintentos automáticos funcionan para errores de IA

## Notas Adicionales

- El sistema usa JWT para autenticación
- Los tokens se almacenan en localStorage del navegador
- Las preferencias del usuario se consideran al generar menús
- La IA puede tardar varios segundos en generar un menú completo
- Los reintentos automáticos se aplican solo a errores de IA
