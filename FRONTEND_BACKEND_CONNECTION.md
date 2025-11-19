# Conexión Frontend-Backend

Este documento describe cómo está conectado el frontend con el backend en la aplicación Menu Planner.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  (Vanilla JavaScript + HTML + CSS)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   auth.js    │  │   api.js     │  │ Components   │     │
│  │              │  │              │  │              │     │
│  │ - Login      │  │ - Error      │  │ - Menu       │     │
│  │ - Register   │  │   Handling   │  │   Planner    │     │
│  │ - Token Mgmt │  │ - API Calls  │  │ - Profile    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTP/JSON over REST
                             │
┌────────────────────────────┴─────────────────────────────────┐
│                         BACKEND                               │
│  (Node.js + TypeScript + Hono)                               │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │   Services   │  │  Database    │      │
│  │              │  │              │  │              │      │
│  │ - Auth       │  │ - User       │  │ PostgreSQL   │      │
│  │ - User       │  │ - MenuPlan   │  │              │      │
│  │ - MenuPlan   │  │ - AI         │  │              │      │
│  │ - Shopping   │  │ - Database   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐    ┌─────▼─────┐
              │ PostgreSQL│    │  OpenAI   │
              │  Database │    │    API    │
              └───────────┘    └───────────┘
```

## Configuración

### Backend (Puerto 3000)

El servidor backend corre en `http://localhost:3000` y sirve:

1. **API REST** en `/api/*`
2. **Archivos estáticos** (HTML, CSS, JS) desde la carpeta `public/`

### CORS

El backend tiene CORS configurado para permitir peticiones desde cualquier origen:

```typescript
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

## Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |

### Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/:id` | Obtener datos del usuario | Sí |
| PUT | `/api/users/:id` | Actualizar datos del usuario | Sí |
| PUT | `/api/users/:id/preferences` | Actualizar preferencias | Sí |
| DELETE | `/api/users/:id` | Eliminar cuenta | Sí |

### Planificación de Menús

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/menu-plans` | Crear nueva planificación | Sí |
| GET | `/api/menu-plans/:id` | Obtener planificación | Sí |
| PUT | `/api/menu-plans/:id/meals/:mealId` | Actualizar comida | Sí |
| POST | `/api/menu-plans/:id/confirm` | Confirmar planificación | Sí |

### Lista de Compra

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/shopping-lists` | Generar lista de compra | Sí |
| GET | `/api/shopping-lists/:id` | Obtener lista de compra | Sí |

## Autenticación

### JWT (JSON Web Tokens)

La aplicación usa JWT para autenticación:

1. **Login**: El usuario envía email y contraseña
2. **Token**: El servidor devuelve un JWT
3. **Almacenamiento**: El token se guarda en `localStorage`
4. **Uso**: El token se envía en el header `Authorization: Bearer {token}`
5. **Expiración**: Si el token expira (401), el usuario es redirigido al login

### Flujo de Autenticación

```javascript
// 1. Login
const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});

const data = await response.json();
const token = data.token;

// 2. Guardar token
localStorage.setItem('authToken', token);

// 3. Usar token en peticiones
const response = await fetch(`${API_URL}/users/${userId}`, {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
});
```

## Manejo de Errores

### Sistema Centralizado

El frontend usa un sistema centralizado de manejo de errores (`api.js`):

```javascript
// Función principal para llamadas a la API
const result = await handleApiCall(
    async () => await enhancedAuthenticatedFetch(url, options),
    {
        showLoading: true,
        successMessage: 'Operación exitosa',
        retryOnAIError: true,
        maxRetries: 2
    }
);

if (result.success) {
    // Manejar éxito
} else {
    // El error ya fue mostrado al usuario
}
```

### Tipos de Error

1. **NetworkError**: Error de conexión
2. **APIError**: Error del servidor con código y mensaje
3. **Reintentos automáticos**: Para errores de IA

### Notificaciones

El sistema muestra notificaciones automáticas:

- **Error**: Rojo, con icono ❌
- **Éxito**: Verde, con icono ✅
- **Advertencia**: Amarillo, con icono ⚠️
- **Info**: Azul, con icono ℹ️

## Flujo de Datos

### Ejemplo: Crear Planificación de Menú

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ 1. Completa formulario
       ▼
┌─────────────────────────┐
│  menu-planner.js        │
│  - Valida datos         │
│  - Prepara petición     │
└──────┬──────────────────┘
       │ 2. handleApiCall()
       ▼
┌─────────────────────────┐
│  api.js                 │
│  - Muestra loading      │
│  - Añade auth token     │
└──────┬──────────────────┘
       │ 3. POST /api/menu-plans
       ▼
┌─────────────────────────┐
│  Backend (Hono)         │
│  - Valida token         │
│  - Valida datos         │
└──────┬──────────────────┘
       │ 4. Llama a AIService
       ▼
┌─────────────────────────┐
│  AIService              │
│  - Llama a OpenAI       │
│  - Genera menú          │
└──────┬──────────────────┘
       │ 5. Guarda en DB
       ▼
┌─────────────────────────┐
│  DatabaseService        │
│  - Guarda en PostgreSQL │
└──────┬──────────────────┘
       │ 6. Respuesta JSON
       ▼
┌─────────────────────────┐
│  api.js                 │
│  - Oculta loading       │
│  - Muestra éxito        │
└──────┬──────────────────┘
       │ 7. Callback onSuccess
       ▼
┌─────────────────────────┐
│  menu-planner.js        │
│  - Renderiza menú       │
│  - Actualiza UI         │
└──────┬──────────────────┘
       │ 8. Muestra resultado
       ▼
┌─────────────┐
│   Usuario   │
└─────────────┘
```

## Archivos Clave

### Frontend

- **`public/js/auth.js`**: Autenticación y gestión de tokens
- **`public/js/api.js`**: Manejo centralizado de errores y API calls
- **`public/js/menu-planner.js`**: Lógica del planificador de menús
- **`public/js/meal-card.js`**: Componente de tarjeta de comida
- **`public/js/shopping-list.js`**: Lógica de lista de compra
- **`public/js/profile.js`**: Gestión de perfil de usuario

### Backend

- **`src/index.ts`**: Servidor principal y configuración
- **`src/routes/*.routes.ts`**: Definición de endpoints
- **`src/services/*.ts`**: Lógica de negocio
- **`src/middleware/auth.ts`**: Middleware de autenticación
- **`src/middleware/errorHandler.ts`**: Manejo de errores global

## Variables de Entorno

El backend requiere las siguientes variables en `.env`:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/menu_planner

# OpenAI
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET=tu_secreto_super_seguro

# Servidor
PORT=3000
```

## Iniciar la Aplicación

### 1. Iniciar Base de Datos

```bash
# PostgreSQL debe estar corriendo
psql -U postgres -c "CREATE DATABASE menu_planner;"
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar Servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm run build
npm start
```

### 5. Abrir en Navegador

Navega a `http://localhost:3000`

## Pruebas de Integración

### Ejecutar Tests Automatizados

```bash
# Pruebas de integración
npm run test:integration

# Todas las pruebas
npm run test:all
```

### Prueba Manual

1. Abrir `http://localhost:3000`
2. Registrar un nuevo usuario
3. Iniciar sesión
4. Crear una planificación de menú
5. Editar comidas
6. Confirmar planificación
7. Generar lista de compra

## Solución de Problemas

### Error: "Error de conexión"

**Causa**: El servidor no está corriendo o no es accesible

**Solución**:
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3000/api

# Si no responde, iniciar el servidor
npm run dev
```

### Error: "Sesión expirada"

**Causa**: El token JWT ha expirado

**Solución**: Volver a iniciar sesión

### Error: "Error al comunicarse con la IA"

**Causa**: Problema con la API de OpenAI

**Solución**:
1. Verificar que `OPENAI_API_KEY` esté configurada
2. Verificar que tengas créditos en OpenAI
3. Revisar logs del servidor para más detalles

### CORS Errors

**Causa**: Problema de configuración de CORS

**Solución**: Verificar que el backend tenga CORS configurado correctamente en `src/index.ts`

## Seguridad

### Mejores Prácticas Implementadas

1. **JWT para autenticación**: Tokens seguros con expiración
2. **Contraseñas hasheadas**: Usando bcrypt
3. **Validación de entrada**: En frontend y backend
4. **HTTPS recomendado**: Para producción
5. **Variables de entorno**: Secretos no en el código
6. **Middleware de autenticación**: Protege rutas privadas
7. **Validación de permisos**: Usuario solo accede a sus datos

## Monitoreo

### Logs del Servidor

El servidor registra:
- Peticiones HTTP recibidas
- Errores de la base de datos
- Errores de la API de OpenAI
- Errores de validación

### Logs del Frontend

El frontend registra en la consola del navegador:
- Errores de API
- Errores de red
- Eventos importantes

## Próximos Pasos

Para mejorar la conexión frontend-backend:

1. **Implementar WebSockets**: Para actualizaciones en tiempo real
2. **Caché de respuestas**: Para mejorar rendimiento
3. **Paginación**: Para listas grandes
4. **Rate limiting**: Para prevenir abuso
5. **Logging avanzado**: Con herramientas como Winston
6. **Monitoreo**: Con herramientas como Sentry
