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

// Display shopping list
function displayShoppingList(shoppingList) {
    const container = document.getElementById('shoppingListContent');
    
    if (!container) return;
    
    if (!shoppingList.items || shoppingList.items.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay items en la lista de compra</p>';
        return;
    }
    
    let html = '<div class="shopping-items">';
    
    shoppingList.items.forEach(item => {
        html += `
            <div class="shopping-item">
                <span class="shopping-item-name">${item.ingredient}</span>
                <span class="shopping-item-quantity">${item.quantity} ${item.unit}</span>
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

// Load shopping list on page load
document.addEventListener('DOMContentLoaded', loadShoppingList);
