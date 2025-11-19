# 🤖 Configuración de OpenAI

Esta guía te ayuda a configurar OpenAI para la aplicación Menu Planner.

## ⚠️ Problema: Cuota Excedida

Si ves este error:
```
429 You exceeded your current quota
```

Significa que tu cuenta de OpenAI no tiene créditos disponibles.

## 💰 Solución 1: Añadir Créditos a OpenAI (Recomendado)

### Paso 1: Verificar tu Cuenta

1. Ve a https://platform.openai.com/account/billing
2. Inicia sesión con tu cuenta de OpenAI
3. Revisa tu saldo actual

### Paso 2: Añadir Método de Pago

1. Click en "Payment methods"
2. Añade una tarjeta de crédito/débito
3. Guarda el método de pago

### Paso 3: Comprar Créditos

1. Ve a "Billing" → "Add to credit balance"
2. Compra créditos (mínimo $5 USD)
3. Los créditos se añaden inmediatamente

### Paso 4: Verificar Límites

1. Ve a "Usage limits"
2. Configura límites mensuales si lo deseas
3. Esto evita gastos inesperados

### Costos Aproximados

Con GPT-3.5-turbo:
- **Generar un menú semanal**: ~$0.02 - $0.05
- **Regenerar una comida**: ~$0.01
- **Generar lista de compra**: ~$0.01

**Con $5 USD puedes generar aproximadamente 100-200 menús semanales.**

## 🧪 Solución 2: Usar Modo Mock (Sin OpenAI)

Si no quieres usar créditos de OpenAI, puedes usar datos de prueba.

### Activar Modo Mock

1. Edita tu archivo `.env`:
```env
# Mantén tu API key (opcional)
OPENAI_API_KEY=sk-...

# Activa el modo mock explícitamente
USE_MOCK_AI=true
```

2. Reinicia el servidor:
```bash
npm run dev
```

3. Verás este mensaje:
```
⚠️  WARNING: Using Mock AI Service (no OpenAI API calls)
   Set OPENAI_API_KEY in .env to use real AI
```

### Qué Hace el Modo Mock

- ✅ Genera menús de prueba con datos predefinidos
- ✅ Permite probar toda la funcionalidad de la app
- ✅ No requiere API key ni créditos
- ✅ Respuestas instantáneas (sin esperar a la IA)
- ⚠️ Los menús son siempre los mismos (no personalizados)
- ⚠️ No considera tus preferencias alimentarias

### Datos de Prueba Incluidos

El modo mock genera:
- **Menús variados**: Ensaladas, pastas, carnes, pescados
- **Listas de compra**: Con ingredientes realistas
- **Diferentes platos**: Para almuerzo y cena

## 🔄 Cambiar Entre Modos

### De Mock a OpenAI Real

1. Edita `.env`:
```env
OPENAI_API_KEY=sk-tu_api_key_real
USE_MOCK_AI=false
```

2. Reinicia el servidor

### De OpenAI Real a Mock

1. Edita `.env`:
```env
# OPENAI_API_KEY=sk-...
USE_MOCK_AI=true
```

2. Reinicia el servidor

## 🆓 Obtener API Key Gratuita

OpenAI ofrece créditos gratuitos para nuevas cuentas:

1. Ve a https://platform.openai.com/signup
2. Crea una cuenta nueva
3. Verifica tu email y número de teléfono
4. Recibirás $5 USD en créditos gratuitos
5. Los créditos expiran después de 3 meses

**Nota**: Los créditos gratuitos solo están disponibles una vez por persona.

## 🔑 Obtener tu API Key

1. Ve a https://platform.openai.com/api-keys
2. Click en "Create new secret key"
3. Dale un nombre (ej: "Menu Planner")
4. Copia la key (empieza con `sk-`)
5. Pégala en tu archivo `.env`:
```env
OPENAI_API_KEY=sk-tu_key_aqui
```

⚠️ **Importante**: Guarda tu API key de forma segura. No la compartas ni la subas a GitHub.

## 📊 Monitorear Uso

Para ver cuánto estás gastando:

1. Ve a https://platform.openai.com/usage
2. Revisa tu uso diario/mensual
3. Configura alertas si lo deseas

## 🛡️ Mejores Prácticas

### Seguridad

- ✅ Nunca compartas tu API key
- ✅ Usa variables de entorno (`.env`)
- ✅ Añade `.env` a `.gitignore`
- ✅ Rota tu key si se compromete

### Ahorro de Costos

- ✅ Usa modo mock para desarrollo
- ✅ Configura límites de gasto mensuales
- ✅ Usa GPT-3.5-turbo (más barato que GPT-4)
- ✅ Monitorea tu uso regularmente

### Desarrollo

- ✅ Usa mock durante desarrollo inicial
- ✅ Prueba con OpenAI real antes de producción
- ✅ Configura límites de rate limiting
- ✅ Implementa caché si es posible

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta usar la app?

Con GPT-3.5-turbo, muy poco:
- Uso personal: ~$1-2 USD/mes
- Uso familiar: ~$3-5 USD/mes

### ¿Puedo usar GPT-4?

Sí, pero:
- Es ~10x más caro que GPT-3.5-turbo
- Requiere acceso especial de OpenAI
- Para cambiar, edita `src/services/AIService.ts`

### ¿El modo mock es suficiente?

Para probar la app: Sí
Para uso real: No (menús no personalizados)

### ¿Qué pasa si se acaban mis créditos?

- La app mostrará error 429
- Puedes añadir más créditos
- O activar modo mock temporalmente

### ¿Puedo usar otra IA?

Actualmente solo OpenAI está soportado, pero podrías:
- Implementar un servicio para Anthropic Claude
- Usar Ollama para modelos locales
- Implementar tu propia lógica de generación

## 🆘 Solución de Problemas

### Error: "Invalid API Key"

- Verifica que la key empiece con `sk-`
- Verifica que no tenga espacios extra
- Genera una nueva key si es necesario

### Error: "Model not found"

- Tu cuenta no tiene acceso a ese modelo
- Usa `gpt-3.5-turbo` en lugar de `gpt-4`

### Error: "Rate limit exceeded"

- Estás haciendo demasiadas peticiones
- Espera 1 minuto e intenta de nuevo
- Considera aumentar tu límite de rate

### La app es muy lenta

- OpenAI puede tardar 5-10 segundos
- Esto es normal para generar menús completos
- Usa modo mock para desarrollo más rápido

## 📚 Recursos Adicionales

- [Documentación de OpenAI](https://platform.openai.com/docs)
- [Precios de OpenAI](https://openai.com/pricing)
- [Límites de Rate](https://platform.openai.com/docs/guides/rate-limits)
- [Mejores Prácticas](https://platform.openai.com/docs/guides/production-best-practices)

---

**¿Necesitas ayuda?** Revisa los logs del servidor o contacta con soporte de OpenAI.
