# 🍽️ Menu Planner - Planificador Inteligente de Menús

Aplicación web para planificar menús semanales personalizados usando IA (ChatGPT).

## ✨ Características

- 🤖 **Generación automática de menús** con ChatGPT
- 👥 **Múltiples comensales** con preferencias individuales
- 🔄 **Regeneración de comidas** que no te gusten
- 📝 **Lista de compra automática** agrupada por categorías
- 🔐 **Autenticación segura** con JWT
- 📱 **Diseño responsive** para móvil y desktop

## 🚀 Inicio Rápido

### Requisitos

- Node.js v18+
- PostgreSQL v14+
- Cuenta de OpenAI con API Key

### Instalación

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd appComidasSemana

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
psql -U postgres -c "CREATE DATABASE menu_planner;"
psql -U postgres -d menu_planner -f schema.sql

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 5. Compilar y ejecutar
npm run build
npm run dev
```

### Abrir en el navegador

```
http://localhost:3000
```

## 📖 Documentación

- **[Guía Rápida](QUICK_START.md)** - Cómo ejecutar la app
- **[Configuración de OpenAI](OPENAI_SETUP.md)** - Setup de IA y modo mock
- **[Guía de Integración](INTEGRATION_TEST_GUIDE.md)** - Pruebas completas
- **[Conexión Frontend-Backend](FRONTEND_BACKEND_CONNECTION.md)** - Arquitectura
- **[Manejo de Errores](public/js/API_ERROR_HANDLING.md)** - Sistema de errores
- **[Cobertura de Tests](TEST_COVERAGE_SUMMARY.md)** - 289 tests

## 🛠️ Tecnologías

### Frontend
- Vanilla JavaScript
- HTML5 & CSS3
- Sistema de notificaciones personalizado

### Backend
- Node.js + TypeScript
- Hono (framework web)
- PostgreSQL
- OpenAI API (GPT-3.5-turbo)
- JWT para autenticación

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor con hot reload

# Producción
npm run build           # Compilar TypeScript
npm start               # Iniciar servidor

# Tests
npm test                # Tests del backend
npm run test:frontend   # Tests del frontend
npm run test:all        # Todos los tests
npm run test:integration # Tests de integración

# Cobertura
npm run test:coverage   # Cobertura del backend
npm run test:frontend:coverage # Cobertura del frontend
```

## 🎯 Uso

1. **Registrarse** con email y contraseña
2. **Definir preferencias** alimentarias (vegetariano, alergias, etc.)
3. **Crear planificación**:
   - Seleccionar fechas y días
   - Especificar número de comensales
   - Generar menú con IA
4. **Personalizar**:
   - Editar comidas individuales
   - Cambiar comensales por comida
   - Regenerar comidas
5. **Confirmar** la planificación
6. **Generar lista de compra** automática
7. **Exportar** o imprimir la lista

## 🧪 Tests

La aplicación tiene **289 tests** con cobertura completa:

- ✅ 185 tests del backend
- ✅ 104 tests del frontend
- ✅ Tests unitarios
- ✅ Tests de integración
- ✅ Tests end-to-end

```bash
npm run test:all
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT
- Validación de entrada en frontend y backend
- CORS configurado
- Variables de entorno para secretos

## 📊 Estructura del Proyecto

```
appComidasSemana/
├── public/              # Frontend (HTML, CSS, JS)
│   ├── js/             # JavaScript modules
│   └── *.html          # Páginas HTML
├── src/                # Backend (TypeScript)
│   ├── config/         # Configuración
│   ├── middleware/     # Middleware
│   ├── models/         # Modelos de datos
│   ├── routes/         # Rutas de API
│   └── services/       # Lógica de negocio
├── tests/              # Tests
│   ├── frontend/       # Tests del frontend
│   ├── routes/         # Tests de rutas
│   └── services/       # Tests de servicios
├── schema.sql          # Esquema de base de datos
└── .env                # Variables de entorno
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Autor

Desarrollado como proyecto de planificación inteligente de menús.

## 🆘 Soporte

Si tienes problemas:

1. Revisa la [Guía Rápida](QUICK_START.md)
2. Consulta la [Guía de Integración](INTEGRATION_TEST_GUIDE.md)
3. Revisa los logs del servidor
4. Abre un issue en GitHub

---

**¡Disfruta planificando tus menús con IA!** 🎉
