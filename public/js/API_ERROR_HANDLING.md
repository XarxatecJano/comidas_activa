# Sistema de Manejo de Errores del Frontend

Este documento describe el sistema centralizado de manejo de errores implementado en el frontend de la aplicación.

## Características

- **Notificaciones globales**: Sistema de notificaciones visuales para errores, éxitos, advertencias e información
- **Manejo centralizado de API**: Función `handleApiCall()` que centraliza todas las llamadas a la API
- **Reintentos automáticos**: Soporte para reintentar operaciones de IA que fallen
- **Mensajes amigables**: Conversión automática de errores técnicos a mensajes comprensibles para el usuario
- **Tipos de error personalizados**: `APIError` y `NetworkError` para mejor manejo de errores

## Uso Básico

### 1. Mostrar Notificaciones

```javascript
// Mostrar error
showErrorNotification('Ha ocurrido un error');

// Mostrar éxito
showSuccessNotification('Operación completada exitosamente');

// Mostrar advertencia
showWarningNotification('Ten cuidado con esta acción');

// Mostrar información
showInfoNotification('Procesando tu solicitud...');
```

### 2. Hacer Llamadas a la API con Manejo de Errores

```javascript
// Ejemplo básico
const result = await handleApiCall(async () => {
    return await enhancedAuthenticatedFetch(`${API_URL}/users/${userId}`);
});

if (result.success) {
    console.log('Datos:', result.data);
} else {
    console.error('Error:', result.error);
}
```

### 3. Llamadas con Opciones Avanzadas

```javascript
const result = await handleApiCall(
    async () => {
        return await enhancedAuthenticatedFetch(`${API_URL}/menu-plans`, {
            method: 'POST',
            body: JSON.stringify(menuData)
        });
    },
    {
        showLoading: true,
        loadingMessage: 'Generando menú...',
        successMessage: '¡Menú generado exitosamente!',
        errorMessage: 'No se pudo generar el menú',
        retryOnAIError: true,
        maxRetries: 2,
        onSuccess: (data) => {
            console.log('Menú creado:', data);
            displayMenu(data.menuPlan);
        },
        onError: (error) => {
            console.error('Error al crear menú:', error);
        }
    }
);
```

## Opciones de handleApiCall

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `showLoading` | boolean | false | Muestra notificación de carga |
| `loadingMessage` | string | 'Cargando...' | Mensaje de carga |
| `successMessage` | string | null | Mensaje a mostrar en éxito |
| `errorMessage` | string | null | Mensaje personalizado de error |
| `retryOnAIError` | boolean | false | Reintentar si falla la IA |
| `maxRetries` | number | 2 | Número máximo de reintentos |
| `onSuccess` | function | null | Callback en éxito |
| `onError` | function | null | Callback en error |

## Reintentos para Operaciones de IA

Para operaciones que usan IA (ChatGPT), puedes usar `retryAIOperation`:

```javascript
const result = await retryAIOperation(
    async () => {
        return await enhancedAuthenticatedFetch(`${API_URL}/ai/generate-menu`, {
            method: 'POST',
            body: JSON.stringify(preferences)
        });
    },
    2 // máximo 2 reintentos
);
```

## Tipos de Error

### APIError

Error que viene del servidor con información estructurada:

```javascript
throw new APIError(
    'Datos inválidos',  // mensaje
    400,                // código HTTP
    'VALIDATION_ERROR', // código de error
    { field: 'email' }  // detalles opcionales
);
```

### NetworkError

Error de conexión de red:

```javascript
throw new NetworkError('No se pudo conectar al servidor');
```

## Mensajes de Error Automáticos

El sistema convierte automáticamente códigos de error HTTP en mensajes amigables:

- **400**: "Datos inválidos. Por favor, verifica la información ingresada."
- **401**: "Sesión expirada. Por favor, inicia sesión nuevamente."
- **403**: "No tienes permisos para realizar esta acción."
- **404**: "Recurso no encontrado."
- **429**: "Demasiadas solicitudes. Por favor, espera un momento."
- **500 (AI_ERROR)**: "Error al comunicarse con la IA. Por favor, intenta de nuevo."
- **500 (otros)**: "Error del servidor. Por favor, intenta de nuevo más tarde."
- **Network Error**: "Error de conexión. Por favor, verifica tu conexión a internet."

## Migración de Código Existente

### Antes:

```javascript
try {
    const response = await authenticatedFetch(`${API_URL}/users/${userId}`);
    const data = await response.json();
    
    if (response.ok) {
        // manejar éxito
    } else {
        showError(data.error?.message || 'Error');
    }
} catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
}
```

### Después:

```javascript
const result = await handleApiCall(
    async () => await enhancedAuthenticatedFetch(`${API_URL}/users/${userId}`),
    {
        successMessage: 'Datos cargados correctamente',
        onSuccess: (data) => {
            // manejar éxito
        }
    }
);
```

## Ejemplos Completos

### Ejemplo 1: Cargar Perfil de Usuario

```javascript
async function loadProfile() {
    const userData = getUserData();
    
    const result = await handleApiCall(
        async () => await enhancedAuthenticatedFetch(`${API_URL}/users/${userData.id}`),
        {
            showLoading: true,
            loadingMessage: 'Cargando perfil...',
            onSuccess: (data) => {
                document.getElementById('name').value = data.user.name;
                document.getElementById('email').value = data.user.email;
            },
            onError: () => {
                // Manejo adicional si es necesario
            }
        }
    );
}
```

### Ejemplo 2: Generar Menú con Reintentos

```javascript
async function generateMenu(menuData) {
    const result = await handleApiCall(
        async () => {
            return await enhancedAuthenticatedFetch(`${API_URL}/menu-plans`, {
                method: 'POST',
                body: JSON.stringify(menuData)
            });
        },
        {
            showLoading: true,
            loadingMessage: 'Generando menú con IA...',
            successMessage: '¡Menú generado exitosamente!',
            retryOnAIError: true,
            maxRetries: 2,
            onSuccess: (data) => {
                currentMenuPlan = data.menuPlan;
                displayMenuPlan(data.menuPlan);
            }
        }
    );
    
    return result;
}
```

### Ejemplo 3: Eliminar Cuenta con Confirmación

```javascript
async function deleteAccount() {
    if (!confirm('¿Estás seguro?')) return;
    
    const result = await handleApiCall(
        async () => {
            return await enhancedAuthenticatedFetch(`${API_URL}/users/${userId}`, {
                method: 'DELETE'
            });
        },
        {
            successMessage: 'Cuenta eliminada exitosamente',
            errorMessage: 'No se pudo eliminar la cuenta',
            onSuccess: () => {
                logout();
            }
        }
    );
}
```

## Notas Importantes

1. **Siempre incluye api.js**: Asegúrate de que `api.js` esté incluido antes que otros scripts en tus archivos HTML:
   ```html
   <script src="/js/auth.js"></script>
   <script src="/js/api.js"></script>
   <script src="/js/tu-script.js"></script>
   ```

2. **Usa enhancedAuthenticatedFetch**: Reemplaza `authenticatedFetch` con `enhancedAuthenticatedFetch` para mejor manejo de errores.

3. **Reintentos solo para IA**: Los reintentos automáticos solo se aplican a errores de IA. Otros errores no se reintentarán automáticamente.

4. **Notificaciones automáticas**: Las notificaciones se ocultan automáticamente después de unos segundos, pero puedes ocultarlas manualmente con `errorNotification.hide()`.

5. **Callbacks opcionales**: Los callbacks `onSuccess` y `onError` son opcionales. Úsalos solo cuando necesites lógica adicional.
