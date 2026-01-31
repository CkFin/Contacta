let techProfile = null;
let requestsInterval = null;

async function setTechProfile() {
    const name = document.getElementById('techName').value.trim();
    const specialty = document.getElementById('techSpecialty').value;
    
    if (!name || !specialty) {
        showNotification('Por favor completa tu perfil', 'error');
        return;
    }
    
    try {
        const result = await API.registerTech(name, specialty);
        
        if (result.success) {
            techProfile = result.tech;
            localStorage.setItem('techProfile', JSON.stringify(techProfile));
            
            showNotification('¡Perfil guardado exitosamente!', 'success');
            document.getElementById('requestsSection').classList.remove('hidden');
            
            // Comenzar a verificar solicitudes
            startCheckingRequests();
        }
    } catch (error) {
        showNotification('Error al guardar perfil. Verifica que el servidor esté activo.', 'error');
        console.error(error);
    }
}

function startCheckingRequests() {
    if (requestsInterval) clearInterval(requestsInterval);
    
    requestsInterval = setInterval(async () => {
        if (techProfile) {
            await loadRequests();
        }
    }, 5000);
    
    // Cargar solicitudes inmediatamente
    loadRequests();
}

async function loadRequests() {
    if (!techProfile) return;
    
    try {
        const requests = await API.getRequestsBySpecialty(techProfile.specialty);
        displayRequests(requests);
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

function displayRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        requestsList.innerHTML = '<p class="no-requests">No hay solicitudes disponibles en este momento. Te notificaremos cuando llegue una nueva.</p>';
        return;
    }
    
    requestsList.innerHTML = '<h3>🔔 Nuevas Solicitudes</h3>';
    requests.forEach(request => {
        const hasOffered = request.offers && request.offers.some(o => o.tech_id === techProfile.id);
        
        requestsList.innerHTML += `
            <div class="request-card ${hasOffered ? 'already-offered' : ''}">
                <h4>📋 Solicitud de ${request.service}</h4>
                <p><strong>👤 Cliente:</strong> ${request.clientName}</p>
                <p><strong>📝 Detalles:</strong> ${request.details}</p>
                <p><strong>📍 Dirección:</strong> ${request.address}</p>
                <p><strong>🕐 Publicado:</strong> ${getTimeAgo(request.timestamp)}</p>
                <p class="offers-count">💼 ${request.offers ? request.offers.length : 0} ofertas recibidas</p>
                ${hasOffered 
                    ? '<p class="offered-label">✅ Ya has enviado una oferta</p>'
                    : `<button class="btn-offer" onclick="showOfferModal(${request.id})">Hacer Oferta</button>`
                }
            </div>
        `;
    });
}

function showOfferModal(requestId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Hacer Oferta</h3>
            <input type="number" id="offerPrice" placeholder="Precio (ej: 50)" min="1">
            <input type="text" id="offerTime" placeholder="Tiempo estimado (ej: 30 min)">
            <textarea id="offerMessage" placeholder="Mensaje opcional para el cliente" rows="3"></textarea>
            <div class="modal-buttons">
                <button class="btn-primary" onclick="sendOffer(${requestId})">Enviar Oferta</button>
                <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('show'), 10);
}

async function sendOffer(requestId) {
    const price = document.getElementById('offerPrice').value;
    const time = document.getElementById('offerTime').value;
    const message = document.getElementById('offerMessage').value;
    
    if (!price || !time) {
        showNotification('Por favor completa precio y tiempo', 'error');
        return;
    }
    
    try {
        const result = await API.createOffer(
            requestId,
            techProfile.id,
            techProfile.name,
            `$${price}`,
            time,
            message
        );
        
        if (result.success) {
            showNotification('¡Oferta enviada exitosamente!', 'success');
            closeModal();
            loadRequests(); // Recargar solicitudes
        }
    } catch (error) {
        showNotification('Error al enviar oferta', 'error');
        console.error(error);
    }
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'hace menos de un minuto';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`;
    return `hace ${Math.floor(diff / 3600)} horas`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Cargar perfil guardado al iniciar
window.addEventListener('DOMContentLoaded', () => {
    const savedProfile = localStorage.getItem('techProfile');
    if (savedProfile) {
        techProfile = JSON.parse(savedProfile);
        document.getElementById('techName').value = techProfile.name;
        document.getElementById('techSpecialty').value = techProfile.specialty;
        document.getElementById('requestsSection').classList.remove('hidden');
        startCheckingRequests();
    }
});
