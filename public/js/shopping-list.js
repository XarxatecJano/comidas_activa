// Require authentication
requireAuth();

let currentShoppingList = null;

// Get plan ID from URL
function getPlanIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('planId');
}

// Load or generate shopping list
async function loadShoppingList() {
    const planId = getPlanIdFromURL();
    
    if (!planId) {
        showError('No se especificó una planificación');
        return;
    }
    
    try {
        // Try to generate shopping list
        const response = await authenticatedFetch(`${API_URL}/shopping-lists`, {
            method: 'POST',
            body: JSON.stringify({ menuPlanId: planId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentShoppingList = data.shoppingList;
            displayShoppingList(data.shoppingList);
        } else {
            showError(data.error?.message || 'Error al generar lista de compra');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Categorize ingredients
function categorizeIngredients(items) {
    const categories = {
        'Frutas y Verduras': ['tomate', 'cebolla', 'ajo', 'pimiento', 'lechuga', 'zanahoria', 'patata', 'manzana', 'plátano', 'naranja', 'limón', 'perejil', 'cilantro'],
        'Carnes y Pescados': ['pollo', 'ternera', 'cerdo', 'cordero', 'pescado', 'salmón', 'atún', 'merluza', 'gambas', 'mejillones', 'calamar'],
        'Lácteos y Huevos': ['leche', 'queso', 'yogur', 'mantequilla', 'nata', 'huevo', 'huevos'],
        'Cereales y Legumbres': ['arroz', 'pasta', 'pan', 'harina', 'lentejas', 'garbanzos', 'alubias'],
        'Aceites y Condimentos': ['aceite', 'vinagre', 'sal', 'pimienta', 'azúcar', 'especias'],
        'Otros': []
    };
    
    const categorized = {};
    
    items.forEach(item => {
        let assigned = false;
        const ingredientLower = item.ingredient.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (category === 'Otros') continue;
            
            if (keywords.some(keyword => ingredientLower.includes(keyword))) {
                if (!categorized[category]) {
                    categorized[category] = [];
                }
                categorized[category].push(item);
                assigned = true;
                break;
            }
        }
        
        if (!assigned) {
            if (!categorized['Otros']) {
                categorized['Otros'] = [];
            }
            categorized['Otros'].push(item);
        }
    });
    
    return categorized;
}

// Display shopping list
function displayShoppingList(shoppingList) {
    const container = document.getElementById('shoppingListContent');
    
    if (!container) return;
    
    if (!shoppingList.items || shoppingList.items.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay items en la lista de compra</p>';
        return;
    }
    
    // Categorize items
    const categorized = categorizeIngredients(shoppingList.items);
    
    let html = '<div class="shopping-items">';
    
    // Render by categories
    Object.entries(categorized).forEach(([category, items]) => {
        if (items.length === 0) return;
        
        html += `
            <div class="shopping-category">
                <h3 class="category-title">${category}</h3>
                <div class="category-items">
        `;
        
        items.forEach(item => {
            html += `
                <div class="shopping-item">
                    <label class="shopping-item-checkbox">
                        <input type="checkbox" class="item-checkbox">
                        <span class="shopping-item-name">${item.ingredient}</span>
                    </label>
                    <span class="shopping-item-quantity">${item.quantity} ${item.unit}</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Show error
function showError(message) {
    const container = document.getElementById('shoppingListContent');
    if (container) {
        container.innerHTML = `
            <div class="message error">
                ${message}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <a href="/dashboard.html" class="btn btn-primary">Volver al Dashboard</a>
            </div>
        `;
    }
}

// Print list
function printList() {
    window.print();
}

// Export list as text
function exportList() {
    if (!currentShoppingList || !currentShoppingList.items) {
        alert('No hay lista para exportar');
        return;
    }
    
    const categorized = categorizeIngredients(currentShoppingList.items);
    
    let text = '=== LISTA DE COMPRA ===\n\n';
    
    Object.entries(categorized).forEach(([category, items]) => {
        if (items.length === 0) return;
        
        text += `${category.toUpperCase()}\n`;
        text += '─'.repeat(30) + '\n';
        
        items.forEach(item => {
            text += `☐ ${item.ingredient} - ${item.quantity} ${item.unit}\n`;
        });
        
        text += '\n';
    });
    
    text += `\nGenerado el ${new Date().toLocaleDateString('es-ES')}\n`;
    
    // Create blob and download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-compra-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Copy list to clipboard
async function copyToClipboard() {
    if (!currentShoppingList || !currentShoppingList.items) {
        alert('No hay lista para copiar');
        return;
    }
    
    const categorized = categorizeIngredients(currentShoppingList.items);
    
    let text = '=== LISTA DE COMPRA ===\n\n';
    
    Object.entries(categorized).forEach(([category, items]) => {
        if (items.length === 0) return;
        
        text += `${category.toUpperCase()}\n`;
        
        items.forEach(item => {
            text += `☐ ${item.ingredient} - ${item.quantity} ${item.unit}\n`;
        });
        
        text += '\n';
    });
    
    try {
        await navigator.clipboard.writeText(text);
        showSuccessMessage('Lista copiada al portapapeles');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('No se pudo copiar al portapapeles');
    }
}

// Show success message
function showSuccessMessage(message) {
    const container = document.getElementById('shoppingListContent');
    if (container) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message success';
        messageDiv.textContent = message;
        messageDiv.style.marginBottom = '20px';
        
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Load shopping list on page load
document.addEventListener('DOMContentLoaded', loadShoppingList);
