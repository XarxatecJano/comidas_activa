// Require authentication
requireAuth();

let familyMembers = [];

// Load family members on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFamilyMembers();
    setupAddMemberForm();
    setupEditMemberForm();
});

// Load all family members
async function loadFamilyMembers() {
    const loadingEl = document.getElementById('loadingMembers');
    const containerEl = document.getElementById('membersContainer');
    const emptyStateEl = document.getElementById('emptyState');

    try {
        loadingEl.style.display = 'block';
        containerEl.style.display = 'none';
        emptyStateEl.style.display = 'none';

        const response = await authenticatedFetch(`${API_URL}/family-members`);
        const data = await response.json();

        if (response.ok) {
            familyMembers = data.members || [];
            displayFamilyMembers();
        } else {
            showMessage('addMessage', data.error?.message || 'Error al cargar miembros', 'error');
        }
    } catch (error) {
        console.error('Error loading family members:', error);
        showMessage('addMessage', 'Error de conexión', 'error');
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Display family members in the grid
function displayFamilyMembers() {
    const containerEl = document.getElementById('membersContainer');
    const emptyStateEl = document.getElementById('emptyState');

    if (familyMembers.length === 0) {
        containerEl.style.display = 'none';
        emptyStateEl.style.display = 'block';
        return;
    }

    containerEl.innerHTML = '';
    containerEl.style.display = 'grid';
    emptyStateEl.style.display = 'none';

    familyMembers.forEach(member => {
        const memberCard = createMemberCard(member);
        containerEl.appendChild(memberCard);
    });
}

// Create a member card element
function createMemberCard(member) {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.dataset.memberId = member.id;

    const nameEl = document.createElement('h4');
    nameEl.textContent = member.name;

    const detailsEl = document.createElement('div');
    detailsEl.className = 'member-details';

    if (member.preferences) {
        const prefEl = document.createElement('p');
        prefEl.innerHTML = `<strong>Preferencias:</strong> ${member.preferences}`;
        detailsEl.appendChild(prefEl);
    }

    if (member.dietary_restrictions) {
        const restEl = document.createElement('p');
        restEl.innerHTML = `<strong>Restricciones:</strong> ${member.dietary_restrictions}`;
        detailsEl.appendChild(restEl);
    }

    const actionsEl = document.createElement('div');
    actionsEl.className = 'member-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-small btn-secondary';
    editBtn.textContent = 'Editar';
    editBtn.onclick = () => openEditModal(member);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-small btn-danger';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.onclick = () => deleteMember(member.id, member.name);

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(deleteBtn);

    card.appendChild(nameEl);
    card.appendChild(detailsEl);
    card.appendChild(actionsEl);

    return card;
}

// Setup add member form
function setupAddMemberForm() {
    const form = document.getElementById('addMemberForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            preferences: formData.get('preferences') || '',
            dietary_restrictions: formData.get('dietary_restrictions') || ''
        };

        toggleAddLoading(true);

        try {
            const response = await authenticatedFetch(`${API_URL}/family-members`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('addMessage', 'Miembro añadido exitosamente', 'success');
                form.reset();
                await loadFamilyMembers();
            } else {
                showMessage('addMessage', result.error?.message || 'Error al añadir miembro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('addMessage', 'Error de conexión', 'error');
        } finally {
            toggleAddLoading(false);
        }
    });
}

// Setup edit member form
function setupEditMemberForm() {
    const form = document.getElementById('editMemberForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const memberId = document.getElementById('editMemberId').value;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            preferences: formData.get('preferences') || '',
            dietary_restrictions: formData.get('dietary_restrictions') || ''
        };

        try {
            const response = await authenticatedFetch(`${API_URL}/family-members/${memberId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('editMessage', 'Miembro actualizado exitosamente', 'success');
                setTimeout(() => {
                    closeEditModal();
                    loadFamilyMembers();
                }, 1000);
            } else {
                showMessage('editMessage', result.error?.message || 'Error al actualizar miembro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('editMessage', 'Error de conexión', 'error');
        }
    });
}

// Open edit modal
function openEditModal(member) {
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberPreferences').value = member.preferences || '';
    document.getElementById('editMemberRestrictions').value = member.dietary_restrictions || '';
    document.getElementById('editMessage').style.display = 'none';
    document.getElementById('editModal').style.display = 'flex';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editMemberForm').reset();
}

// Delete member
async function deleteMember(memberId, memberName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${memberName}?`)) {
        return;
    }

    try {
        const response = await authenticatedFetch(`${API_URL}/family-members/${memberId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('addMessage', 'Miembro eliminado exitosamente', 'success');
            await loadFamilyMembers();
        } else {
            showMessage('addMessage', result.error?.message || 'Error al eliminar miembro', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('addMessage', 'Error de conexión', 'error');
    }
}

// Toggle add form loading state
function toggleAddLoading(isLoading) {
    const btnText = document.getElementById('addBtnText');
    const btnLoading = document.getElementById('addBtnLoading');
    const submitBtn = document.querySelector('#addMemberForm button[type="submit"]');

    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show message
function showMessage(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = message;
        container.className = `message ${type}`;
        container.style.display = 'block';

        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
};
