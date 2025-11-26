# 🔧 Solución al Error ENETUNREACH en Render

## El Problema

Tu aplicación en Render no puede conectarse a Supabase y muestra este error:

```
Error: connect ENETUNREACH 2a05:d019:fa8:a404:7c92:7e63:d6e2:c3a0:5432
```

**Causa:** Estás usando la conexión directa de PostgreSQL (puerto 5432) que usa IPv6. Render tiene problemas con IPv6.

## La Solución (5 minutos)

### Paso 1: Obtener el Connection String correcto de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Database**
4. En la sección **Connection string**, busca el dropdown
5. Selecciona **"Transaction"** (NO "Session")
6. Copia el connection string que aparece

**Debe verse así:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Puntos clave:**
- ✅ Debe tener puerto **6543** (no 5432)
- ✅ Debe tener `.pooler.supabase.com` en el host
- ⚠️ Reemplaza `[YOUR-PASSWORD]` con tu contraseña real

### Paso 2: Actualizar en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio (comidas-activa)
3. Ve a **Environment** en el menú lateral
4. Busca la variable `DATABASE_URL`
5. Click en **Edit**
6. Pega el nuevo connection string (el del Paso 1)
7. Click en **Save Changes**

### Paso 3: Esperar el Redeploy

1. Render automáticamente hará un nuevo deploy
2. Espera 2-3 minutos
3. Ve a **Logs** para verificar
4. Busca este mensaje: `✓ PostgreSQL connection test successful`

### Paso 4: Probar la Aplicación

1. Ve a tu URL de Render: `https://comidas-activa.onrender.com`
2. Intenta registrar un usuario
3. Debería funcionar correctamente ✅

## Verificación Local (Opcional)

Si quieres probar la conexión antes de desplegar:

1. Actualiza tu archivo `.env` local con el nuevo connection string
2. Ejecuta:
   ```bash
   npm run test:db
   ```
3. Deberías ver: `✅ All tests passed! Database connection is working correctly.`

## ¿Por qué funciona esto?

- **Puerto 5432** = Conexión directa a PostgreSQL (usa IPv6)
- **Puerto 6543** = Connection Pooling de Supabase (usa IPv4)
- Render funciona mejor con IPv4
- Connection Pooling también es más eficiente para aplicaciones web

## 🏠 ¿Y en Desarrollo Local?

No te preocupes, la configuración ya está lista para funcionar en ambos entornos:

**Desarrollo Local:**
- Usa tu PostgreSQL local en `localhost:5432`
- Sin SSL (no es necesario)
- Configurado en `.env.development` o `.env`

**Producción (Render):**
- Usa Supabase con puerto 6543
- Con SSL habilitado automáticamente
- Configurado en variables de entorno de Render

La aplicación detecta automáticamente el entorno usando `NODE_ENV`:
- `development` → Sin SSL, localhost
- `production` → Con SSL, Supabase pooling

## Cambios Realizados en el Código

He actualizado el código para:

1. ✅ Agregar soporte SSL para conexiones de producción
2. ✅ Crear un script de diagnóstico (`npm run test:db`)
3. ✅ Actualizar la documentación con instrucciones claras
4. ✅ Agregar troubleshooting detallado

## Si Aún No Funciona

1. Verifica que copiaste el connection string completo (incluyendo la contraseña)
2. Asegúrate de que seleccionaste "Transaction" mode en Supabase
3. Revisa los logs en Render para ver el error específico
4. Ejecuta `npm run test:db` localmente para diagnosticar

## Recursos

- [Documentación de Supabase sobre Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Documentación de Render sobre PostgreSQL](https://render.com/docs/databases)

---

**Resumen:** Cambia de puerto 5432 a puerto 6543 usando el connection string de "Transaction mode" en Supabase. Eso es todo. 🎉
