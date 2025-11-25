# Flujo de Trabajo - Desarrollo y Producción

Este documento explica cómo trabajar con los diferentes entornos.

## Entornos

### 🔧 Desarrollo (Rama `develop`)
- **Base de datos:** PostgreSQL local
- **Puerto:** 3000
- **Variables:** `.env.development`

### 🚀 Producción (Rama `master`)
- **Base de datos:** Supabase
- **Puerto:** 10000 (configurado por Render)
- **Variables:** Configuradas en Render Dashboard

## Configuración Inicial

### 1. Configurar Entorno de Desarrollo

```bash
# Crear archivo .env.development con tus variables locales
cp .env.example .env.development

# Editar .env.development con tus valores locales
# DATABASE_URL=postgresql://janosoler:qwerty33@localhost:5432/comidas_activa
# OPENAI_API_KEY=tu-api-key

# Configurar el entorno
npm run setup:dev

# Iniciar servidor de desarrollo
npm run dev
```

### 2. Verificar que .env.development NO está en Git

```bash
git status
# .env.development NO debe aparecer en la lista
```

## Flujo de Trabajo Diario

### Trabajando en Desarrollo

```bash
# 1. Asegúrate de estar en la rama develop
git checkout develop

# 2. Configura el entorno de desarrollo (si es necesario)
npm run setup:dev

# 3. Inicia el servidor
npm run dev

# 4. Haz tus cambios y pruebas
# La aplicación usa la base de datos local

# 5. Ejecuta los tests
npm run test:all

# 6. Commit y push a develop
git add .
git commit -m "feat: tu cambio"
git push origin develop
```

### Desplegando a Producción

```bash
# 1. Asegúrate de que develop está actualizado y funcionando
git checkout develop
npm run test:all

# 2. Cambia a master
git checkout master

# 3. Merge de develop a master
git merge develop

# 4. Push a master (esto dispara el deploy en Render)
git push origin master

# 5. Render automáticamente:
#    - Detecta el push a master
#    - Ejecuta npm install && npm run build
#    - Inicia el servidor con npm start
#    - Usa las variables de entorno configuradas en Render (Supabase)
```

## Estructura de Archivos de Configuración

```
.
├── .env.example              # Plantilla de variables (en Git)
├── .env.development          # Variables de desarrollo (NO en Git)
├── .env.production.example   # Ejemplo para producción (en Git)
├── .env                      # Generado por setup-env.sh (NO en Git)
├── render.yaml               # Configuración de Render (en Git)
└── DEPLOYMENT.md             # Guía de despliegue (en Git)
```

## Variables de Entorno por Entorno

### Desarrollo (.env.development)
```bash
DATABASE_URL=postgresql://janosoler:qwerty33@localhost:5432/comidas_activa
JWT_SECRET=dev-secret-key
OPENAI_API_KEY=tu-api-key
PORT=3000
NODE_ENV=development
```

### Producción (Render Dashboard)
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].supabase.co:5432/postgres
JWT_SECRET=<generado-automáticamente>
OPENAI_API_KEY=tu-api-key
PORT=10000
NODE_ENV=production
```

## Comandos Útiles

```bash
# Configurar entorno de desarrollo
npm run setup:dev

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar todos los tests
npm run test:all

# Build para producción (lo hace Render automáticamente)
npm run build

# Iniciar servidor de producción (lo hace Render automáticamente)
npm start

# Verificar que todo está listo para deploy
./scripts/verify-deploy.sh
```

## Troubleshooting

### "Cannot connect to database" en desarrollo

1. Verifica que PostgreSQL está corriendo localmente
2. Verifica que `.env.development` tiene el DATABASE_URL correcto
3. Ejecuta `npm run setup:dev` para regenerar `.env`

### "Cannot connect to database" en producción

1. Verifica que DATABASE_URL está configurado en Render
2. Verifica que Supabase permite conexiones externas
3. Revisa los logs en Render Dashboard

### Los cambios no se reflejan en producción

1. Verifica que hiciste push a la rama `master`
2. Verifica en Render Dashboard → Events que el deploy se ejecutó
3. Espera a que termine el build (2-5 minutos)
4. Limpia la caché del navegador

### Render usa la base de datos incorrecta

1. Ve a Render Dashboard → tu servicio → Environment
2. Verifica que DATABASE_URL apunta a Supabase
3. Si cambias variables, Render redesplegará automáticamente

## Mejores Prácticas

✅ **DO:**
- Trabaja siempre en la rama `develop`
- Ejecuta tests antes de hacer merge a `master`
- Usa `npm run setup:dev` al cambiar de rama
- Verifica que `.env.development` NO está en Git
- Haz merge a `master` solo cuando todo funciona en `develop`

❌ **DON'T:**
- No trabajes directamente en `master`
- No commitees archivos `.env*` (excepto `.env.example`)
- No uses la base de datos de producción en desarrollo
- No hagas push a `master` sin probar en `develop` primero

## Monitoreo

### Desarrollo
- Logs en la terminal donde ejecutas `npm run dev`
- Errores visibles inmediatamente

### Producción
- Logs en Render Dashboard → tu servicio → Logs
- Métricas en Render Dashboard → tu servicio → Metrics

## Rollback en Producción

Si algo sale mal en producción:

```bash
# Opción 1: Rollback en Render
# Ve a Render Dashboard → tu servicio → Events
# Click en "Rollback" en el deploy anterior

# Opción 2: Revertir el commit en master
git checkout master
git revert HEAD
git push origin master
```

## Contacto y Soporte

- Documentación de Render: https://render.com/docs
- Documentación de Supabase: https://supabase.com/docs
- Logs de la aplicación: Render Dashboard → Logs
