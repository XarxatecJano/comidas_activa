#!/bin/bash

# Script para configurar el entorno de desarrollo

echo "🔧 Configurando entorno de desarrollo..."
echo ""

# Verificar si existe .env.development
if [ ! -f ".env.development" ]; then
    echo "❌ Error: .env.development no encontrado"
    echo "   Crea el archivo .env.development con tus variables locales"
    echo "   Puedes usar .env.example como plantilla"
    exit 1
fi

# Copiar .env.development a .env
cp .env.development .env

echo "✅ Archivo .env configurado para desarrollo"
echo ""
echo "📋 Variables configuradas:"
echo "   - DATABASE_URL: Base de datos local"
echo "   - NODE_ENV: development"
echo "   - PORT: 3000"
echo ""
echo "🚀 Puedes iniciar el servidor con: npm run dev"
