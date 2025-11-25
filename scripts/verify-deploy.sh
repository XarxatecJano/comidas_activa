#!/bin/bash

# Script de verificación pre-deploy
# Verifica que todo esté listo para desplegar en producción

echo "🔍 Verificando configuración para despliegue..."
echo ""

# Verificar que existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    exit 1
fi
echo "✅ package.json encontrado"

# Verificar que existe tsconfig.json
if [ ! -f "tsconfig.json" ]; then
    echo "❌ Error: tsconfig.json no encontrado"
    exit 1
fi
echo "✅ tsconfig.json encontrado"

# Verificar que existe render.yaml
if [ ! -f "render.yaml" ]; then
    echo "⚠️  Advertencia: render.yaml no encontrado (opcional)"
else
    echo "✅ render.yaml encontrado"
fi

# Verificar que existe .env.example
if [ ! -f ".env.example" ]; then
    echo "⚠️  Advertencia: .env.example no encontrado"
else
    echo "✅ .env.example encontrado"
fi

# Verificar que .env NO está en git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "❌ Error: .env está en el repositorio! Elimínalo con: git rm --cached .env"
    exit 1
fi
echo "✅ .env no está en el repositorio"

# Verificar que existe el script de build
if ! grep -q '"build"' package.json; then
    echo "❌ Error: Script 'build' no encontrado en package.json"
    exit 1
fi
echo "✅ Script 'build' encontrado"

# Verificar que existe el script de start
if ! grep -q '"start"' package.json; then
    echo "❌ Error: Script 'start' no encontrado en package.json"
    exit 1
fi
echo "✅ Script 'start' encontrado"

# Intentar build
echo ""
echo "🔨 Intentando build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Build falló"
    exit 1
fi
echo "✅ Build exitoso"

# Verificar que dist/ existe
if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio dist/ no fue creado"
    exit 1
fi
echo "✅ Directorio dist/ creado"

# Verificar que dist/index.js existe
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js no fue creado"
    exit 1
fi
echo "✅ dist/index.js creado"

# Ejecutar tests
echo ""
echo "🧪 Ejecutando tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: Algunos tests fallaron"
    echo "   Considera arreglarlos antes de desplegar"
else
    echo "✅ Todos los tests pasaron"
fi

echo ""
echo "✅ ¡Verificación completada!"
echo ""
echo "📋 Checklist para desplegar en Render:"
echo "   1. ✅ Código compilado correctamente"
echo "   2. ⬜ Variables de entorno configuradas en Render:"
echo "      - DATABASE_URL (Supabase connection string)"
echo "      - OPENAI_API_KEY"
echo "      - JWT_SECRET (se genera automáticamente)"
echo "      - NODE_ENV=production"
echo "   3. ⬜ Base de datos en Supabase configurada"
echo "   4. ⬜ Repositorio conectado a Render"
echo ""
echo "📖 Lee DEPLOYMENT.md para instrucciones detalladas"
