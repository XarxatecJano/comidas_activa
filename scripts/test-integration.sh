#!/bin/bash

# Script de prueba de integración Frontend-Backend
# Este script verifica que el servidor esté corriendo y que los endpoints respondan correctamente

set -e

echo "🧪 Iniciando pruebas de integración..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base del servidor
BASE_URL="http://localhost:3000"

# Función para verificar respuesta
check_response() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Probando: $description... "
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" || echo "000")
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $status_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        return 1
    fi
}

# Contador de tests
total_tests=0
passed_tests=0

# Test 1: Verificar que el servidor está corriendo
echo "1. Verificando servidor..."
total_tests=$((total_tests + 1))
if check_response "/api" "200" "Servidor corriendo"; then
    passed_tests=$((passed_tests + 1))
fi
echo ""

# Test 2: Verificar archivos estáticos
echo "2. Verificando archivos estáticos..."
total_tests=$((total_tests + 1))
if check_response "/" "200" "Página principal"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/register.html" "200" "Página de registro"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/login.html" "200" "Página de login"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/dashboard.html" "200" "Página de dashboard"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/menu-planner.html" "200" "Página de planificador"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/shopping-list.html" "200" "Página de lista de compra"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/profile.html" "200" "Página de perfil"; then
    passed_tests=$((passed_tests + 1))
fi
echo ""

# Test 3: Verificar archivos JavaScript
echo "3. Verificando archivos JavaScript..."
total_tests=$((total_tests + 1))
if check_response "/js/auth.js" "200" "auth.js"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/js/api.js" "200" "api.js"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/js/menu-planner.js" "200" "menu-planner.js"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/js/meal-card.js" "200" "meal-card.js"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/js/shopping-list.js" "200" "shopping-list.js"; then
    passed_tests=$((passed_tests + 1))
fi

total_tests=$((total_tests + 1))
if check_response "/js/profile.js" "200" "profile.js"; then
    passed_tests=$((passed_tests + 1))
fi
echo ""

# Test 4: Verificar CSS
echo "4. Verificando archivos CSS..."
total_tests=$((total_tests + 1))
if check_response "/styles.css" "200" "styles.css"; then
    passed_tests=$((passed_tests + 1))
fi
echo ""

# Test 5: Verificar endpoints de API (sin autenticación)
echo "5. Verificando endpoints de API..."
total_tests=$((total_tests + 1))
echo -n "Probando: POST /api/auth/register (sin datos)... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{}' || echo "000")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "400" ]; then
    echo -e "${GREEN}✓ OK${NC} (Status: $status_code - Validación funciona)"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected: 400, Got: $status_code)"
fi

total_tests=$((total_tests + 1))
echo -n "Probando: POST /api/auth/login (sin datos)... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}' || echo "000")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "400" ]; then
    echo -e "${GREEN}✓ OK${NC} (Status: $status_code - Validación funciona)"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected: 400, Got: $status_code)"
fi

total_tests=$((total_tests + 1))
echo -n "Probando: GET /api/users/123 (sin token)... "
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/users/123" || echo "000")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✓ OK${NC} (Status: $status_code - Autenticación requerida)"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected: 401, Got: $status_code)"
fi

total_tests=$((total_tests + 1))
echo -n "Probando: POST /api/menu-plans (sin token)... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/menu-plans" \
    -H "Content-Type: application/json" \
    -d '{}' || echo "000")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✓ OK${NC} (Status: $status_code - Autenticación requerida)"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected: 401, Got: $status_code)"
fi

total_tests=$((total_tests + 1))
echo -n "Probando: POST /api/shopping-lists (sin token)... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/shopping-lists" \
    -H "Content-Type: application/json" \
    -d '{}' || echo "000")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✓ OK${NC} (Status: $status_code - Autenticación requerida)"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected: 401, Got: $status_code)"
fi
echo ""

# Test 6: Verificar ruta no encontrada
echo "6. Verificando manejo de 404..."
total_tests=$((total_tests + 1))
if check_response "/api/ruta-inexistente" "404" "Ruta no encontrada"; then
    passed_tests=$((passed_tests + 1))
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE PRUEBAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total de pruebas: $total_tests"
echo -e "Pruebas exitosas: ${GREEN}$passed_tests${NC}"
echo -e "Pruebas fallidas: ${RED}$((total_tests - passed_tests))${NC}"
echo ""

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}✓ Todas las pruebas pasaron exitosamente!${NC}"
    echo ""
    echo "El servidor está funcionando correctamente y listo para usar."
    echo "Puedes abrir http://localhost:3000 en tu navegador."
    exit 0
else
    echo -e "${RED}✗ Algunas pruebas fallaron${NC}"
    echo ""
    echo "Verifica que:"
    echo "  1. El servidor esté corriendo (npm run dev)"
    echo "  2. La base de datos PostgreSQL esté conectada"
    echo "  3. Las variables de entorno estén configuradas"
    exit 1
fi
