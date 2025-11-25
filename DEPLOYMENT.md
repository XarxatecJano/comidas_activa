# Guía de Despliegue en Render

Esta guía te ayudará a desplegar la aplicación de Planificación de Menús en Render con Supabase como base de datos.

## Requisitos Previos

- ✅ Base de datos PostgreSQL en Supabase configurada
- ✅ Cuenta en Render.com
- ✅ API Key de OpenAI
- ✅ Repositorio Git con el código

## Paso 1: Preparar Supabase

1. **Obtener Connection String:**
   - Ve a tu proyecto en Supabase
   - Settings → Database → Connection string
   - Copia el connection string en modo "URI"
   - Formato: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

2. **Verificar que las tablas están creadas:**
   - Ve a Table Editor en Supabase
   - Deberías ver todas las tablas: User, MenuPlan, Meal, Diner, etc.

## Paso 2: Desplegar en Render

### Opción A: Usando render.yaml (Recomendado)

1. **Conectar repositorio:**
   - Ve a [Render Dashboard](https://dashboard.render.com/)
   - Click en "New +" → "Blueprint"
   - Conecta tu repositorio de GitHub/GitLab
   - Render detectará automáticamente el archivo `render.yaml`

2. **Configurar variables de entorno:**
   - En el dashboard de Render, ve a tu servicio
   - Environment → Add Environment Variable
   - Añade las siguientes variables:

   ```
   DATABASE_URL=tu-connection-string-de-supabase
   OPENAI_API_KEY=tu-api-key-de-openai
   NODE_ENV=production
   ```

   **Nota:** `JWT_SECRET` y `PORT` se generan automáticamente por render.yaml

### Opción B: Configuración Manual

1. **Crear nuevo Web Service:**
   - Ve a [Render Dashboard](https://dashboard.render.com/)
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio

2. **Configurar el servicio:**
   - **Name:** comidas-activa
   - **Region:** Frankfurt (o la más cercana)
   - **Branch:** develop (o main)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

3. **Añadir variables de entorno:**
   ```
   DATABASE_URL=tu-connection-string-de-supabase
   JWT_SECRET=genera-un-string-aleatorio-seguro
   OPENAI_API_KEY=tu-api-key-de-openai
   NODE_ENV=production
   PORT=10000
   ```

## Paso 3: Verificar el Despliegue

1. **Esperar a que termine el build:**
   - Render mostrará los logs en tiempo real
   - El proceso toma aproximadamente 2-5 minutos

2. **Verificar que el servidor está corriendo:**
   - Render te dará una URL como: `https://comidas-activa.onrender.com`
   - Visita: `https://tu-app.onrender.com/api`
   - Deberías ver: `{"message": "Menu Planner API - Server is running"}`

3. **Probar la aplicación:**
   - Visita: `https://tu-app.onrender.com`
   - Deberías ver la página de inicio de la aplicación
   - Intenta registrarte y crear un plan de menú

## Paso 4: Configuración Post-Despliegue

### Actualizar CORS (si es necesario)

Si vas a acceder desde un dominio personalizado, actualiza el CORS en `src/index.ts`:

```typescript
app.use('/*', cors({
  origin: ['https://tu-dominio.com', 'https://comidas-activa.onrender.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

### Configurar Dominio Personalizado (Opcional)

1. En Render Dashboard → Settings → Custom Domain
2. Añade tu dominio
3. Configura los registros DNS según las instrucciones de Render

## Troubleshooting

### Error: "Cannot connect to database"

- Verifica que el `DATABASE_URL` esté correctamente configurado
- Asegúrate de que Supabase permite conexiones desde cualquier IP
- En Supabase: Settings → Database → Connection pooling → Enable

### Error: "OpenAI API error"

- Verifica que `OPENAI_API_KEY` esté configurada
- Verifica que tu cuenta de OpenAI tenga créditos disponibles

### La aplicación se queda "dormida"

- En el plan Free de Render, el servicio se duerme después de 15 minutos de inactividad
- La primera petición después de dormir puede tardar 30-60 segundos
- Considera actualizar a un plan de pago si necesitas disponibilidad 24/7

### Logs y Debugging

- Ve a Render Dashboard → tu servicio → Logs
- Los logs muestran todos los console.log y errores
- Útil para debugging de problemas de producción

## Mantenimiento

### Actualizar la aplicación

1. Haz push de tus cambios a la rama configurada (develop/main)
2. Render detectará automáticamente los cambios
3. Iniciará un nuevo deploy automáticamente

### Rollback a versión anterior

1. Ve a Render Dashboard → tu servicio → Events
2. Encuentra el deploy anterior que funcionaba
3. Click en "Rollback"

### Monitoreo

- Render proporciona métricas básicas de CPU, memoria y requests
- Ve a Dashboard → tu servicio → Metrics

## Costos

- **Render Free Tier:**
  - 750 horas/mes gratis
  - El servicio se duerme después de 15 min de inactividad
  - Suficiente para desarrollo y pruebas

- **Supabase Free Tier:**
  - 500 MB de base de datos
  - 2 GB de transferencia
  - Suficiente para empezar

## Seguridad

- ✅ Nunca commitees el archivo `.env` al repositorio
- ✅ Usa variables de entorno en Render para secretos
- ✅ Genera un `JWT_SECRET` fuerte y único
- ✅ Mantén actualizada tu `OPENAI_API_KEY`
- ✅ Revisa regularmente los logs de Render para detectar actividad sospechosa

## Soporte

Si encuentras problemas:
1. Revisa los logs en Render Dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Prueba la conexión a Supabase localmente primero
4. Consulta la documentación de Render: https://render.com/docs

