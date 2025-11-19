# 🚀 Guía Rápida - Ejecutar la Aplicación

Esta guía te ayudará a poner en marcha la aplicación Menu Planner en pocos pasos.

## 📋 Requisitos Previos

1. **Node.js** (v18 o superior)
2. **PostgreSQL** (v14 o superior)
3. **Cuenta de OpenAI** con API Key

## ⚡ Inicio Rápido (5 pasos)

### 1️⃣ Configurar Base de Datos

```bash
# Iniciar PostgreSQL (si no está corriendo)
# En macOS con Homebrew:
brew services start postgresql@14

# Crear la base de datos
psql -U postgres -c "CREATE DATABASE menu_planner;"

# Ejecutar el script de inicialización
psql -U postgres -d menu_planner -f schema.sql
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env
```

Contenido del `.env`:
```env
# Base de datos
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/menu_planner

# OpenAI API
OPENAI_API_KEY=sk-tu_api_key_aqui

# JWT Secret (genera uno aleatorio)
JWT_SECRET=tu_secreto_super_seguro_aqui

# Puerto del servidor
PORT=3000
```

### 3️⃣ Instalar Dependencias

```bash
npm install
```

### 4️⃣ Compilar TypeScript

```bash
npm run build
```

### 5️⃣ Iniciar el Servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev

# O modo producción
npm start
```

Deberías ver:
```
✓ Server is running on http://localhost:3000
```

## 🌐 Usar la Aplicación

1. **Abrir en el navegador**: http://localhost:3000

2. **Registrarte**:
   - Click en "Regístrate aquí"
   - Completa el formulario
   - Añade tus preferencias alimentarias

3. **Crear tu primer menú**:
   - Ir a "Planificar Menú"
   - Seleccionar fechas y días
   - Click en "Generar Planificación"
   - Esperar a que la IA genere el menú

4. **Personalizar**:
   - Editar comidas individuales
   - Cambiar número de comensales
   - Regenerar comidas que no te gusten

5. **Confirmar y generar lista**:
   - Click en "Confirmar Planificación"
   - Click en "Generar Lista de Compra"
   - Exportar o imprimir tu lista

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"

**Solución**:
```bash
# Verificar que PostgreSQL esté corriendo
brew services list | grep postgresql

# Si no está corriendo, iniciarlo
brew services start postgresql@14

# Verificar conexión
psql -U postgres -c "SELECT 1;"
```

### Error: "OPENAI_API_KEY not found"

**Solución**:
1. Verifica que el archivo `.env` existe
2. Verifica que `OPENAI_API_KEY` está configurada
3. Reinicia el servidor después de cambiar `.env`

### Error: "Port 3000 already in use"

**Solución**:
```bash
# Opción 1: Cambiar el puerto en .env
PORT=3001

# Opción 2: Matar el proceso en el puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Error: "Module not found"

**Solución**:
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🧪 Verificar que Todo Funciona

```bash
# Ejecutar tests
npm run test:all

# Ejecutar pruebas de integración
npm run test:integration
```

Si todos los tests pasan, ¡todo está funcionando correctamente! ✅

## 📱 Acceder desde Otros Dispositivos

Para acceder desde tu móvil u otro dispositivo en la misma red:

1. Obtén tu IP local:
```bash
# En macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. Accede desde otro dispositivo:
```
http://TU_IP_LOCAL:3000
```

Por ejemplo: `http://192.168.1.100:3000`

## 🛑 Detener la Aplicación

```bash
# Si está corriendo en terminal, presiona:
Ctrl + C

# Para detener PostgreSQL (si lo iniciaste con brew):
brew services stop postgresql@14
```

## 📚 Documentación Adicional

- **Guía de Integración Completa**: `INTEGRATION_TEST_GUIDE.md`
- **Conexión Frontend-Backend**: `FRONTEND_BACKEND_CONNECTION.md`
- **Manejo de Errores**: `public/js/API_ERROR_HANDLING.md`
- **Cobertura de Tests**: `TEST_COVERAGE_SUMMARY.md`

## 💡 Consejos

1. **Usa modo desarrollo** (`npm run dev`) mientras desarrollas - tiene hot reload
2. **Revisa los logs** del servidor para ver qué está pasando
3. **Abre la consola del navegador** (F12) para ver errores del frontend
4. **Guarda tu API Key de OpenAI** de forma segura - no la compartas

## 🎉 ¡Listo!

Tu aplicación Menu Planner está corriendo. Disfruta planificando tus menús semanales con IA.

---

**¿Necesitas ayuda?** Revisa los archivos de documentación o los logs del servidor para más detalles.


## 🤖 Nota sobre el Modelo de IA

La aplicación usa **GPT-3.5-turbo** por defecto, que es más accesible y económico.

Si tienes acceso a GPT-4 y quieres usarlo:

1. Edita `src/services/AIService.ts`
2. Cambia `model: 'gpt-3.5-turbo'` por `model: 'gpt-4'` (3 lugares)
3. Edita `src/config/openai.ts`
4. Cambia `model: 'gpt-3.5-turbo'` por `model: 'gpt-4'`
5. Recompila: `npm run build`
6. Reinicia el servidor

**Modelos disponibles**:
- `gpt-3.5-turbo` - Rápido y económico (recomendado)
- `gpt-4` - Más potente pero requiere acceso especial
- `gpt-4-turbo` - Versión optimizada de GPT-4
