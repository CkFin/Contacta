let currentService = '';
let currentRequestId = null;
let offersInterval = null;

function selectService(service) {
    currentService = service;
    document.getElementById('requestForm').classList.remove('hidden');
    
    // Resaltar servicio seleccionado
    document.querySelectorAll('.service-card').forEach(card => {
        card.style.border = 'none';
    });
    event.target.closest('.service-card').style.border = '3px solid var(--primary-orange)';
    
    // Scroll suave al formulario
    document.getElementById('requestForm').scrollIntoView({ behavior: 'smooth' });
}

async function sendRequest() {
    const clientName = document.getElementById('clientName').value.trim();
    const details = document.getElementById('serviceDetails').value.trim();
    const address = document.getElementById('address').value.trim();
    
    if (!clientName || !details || !address) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!currentService) {
        showNotification('Por favor selecciona un servicio', 'error');
        return;
    }

    try {
        const result = await API.createRequest(currentService, clientName, details, address);
        
        if (result.success) {
            currentRequestId = result.request.id;
            showNotification('¡Solicitud enviada! Esperando ofertas...', 'success');
            
            // Limpiar formulario
            document.getElementById('clientName').value = '';
            document.getElementById('serviceDetails').value = '';
            document.getElementById('address').value = '';
            
            // Mostrar sección de ofertas
            document.getElementById('offersSection').classList.remove('hidden');
            document.getElementById('offersSection').scrollIntoView({ behavior: 'smooth' });
            
            // Comenzar a verificar ofertas cada 3 segundos
            startCheckingOffers();
        }
    } catch (error) {
        showNotification('Error al enviar solicitud. Verifica que el servidor esté activo.', 'error');
        console.error(error);
    }
}

function startCheckingOffers() {
    if (offersInterval) clearInterval(offersInterval);
    
    offersInterval = setInterval(async () => {
        if (currentRequestId) {
            await loadOffers();
        }
    }, 3000);
    
    // Cargar ofertas inmediatamente
    loadOffers();
}

async function loadOffers() {
    try {
        const offers = await API.getOffers(currentRequestId);
        displayOffers(offers);
    } catch (error) {
        console.error('Error al cargar ofertas:', error);
    }
}

function displayOffers(offers) {
    const offersList = document.getElementById('offersList');
    
    if (offers.length === 0) {
        offersList.innerHTML = '<p class="no-offers">Esperando ofertas de técnicos cercanos...</p>';
        return;
    }
    
    offersList.innerHTML = '';
    offers.forEach(offer => {
        offersList.innerHTML += `
            <div class="offer-card" data-offer-id="${offer.id}">
                <h4>🔧 ${offer.tech_name}</h4>
                <p><strong>💰 Precio:</strong> ${offer.price}</p>
                <p><strong>⏱️ Tiempo estimado:</strong> ${offer.time}</p>
                ${offer.message ? `<p><strong>📝 Mensaje:</strong> ${offer.message}</p>` : ''}
                <p class="offer-time">Hace ${getTimeAgo(offer.timestamp)}</p>
                <button class="btn-accept" onclick="acceptOffer(${offer.id})">Aceptar Oferta</button>
            </div>
        `;
    });
}

async function acceptOffer(offerId) {
    if (!confirm('¿Estás seguro de aceptar esta oferta?')) return;
    
    try {
        const result = await API.acceptOffer(offerId, currentRequestId);
        
        if (result.success) {
            showNotification('¡Oferta aceptada! El técnico se pondrá en contacto contigo.', 'success');
            
            // Detener verificación de ofertas
            if (offersInterval) clearInterval(offersInterval);
            
            // Resaltar oferta aceptada
            document.querySelectorAll('.offer-card').forEach(card => {
                card.style.opacity = '0.5';
            });
            document.querySelector(`[data-offer-id="${offerId}"]`).style.opacity = '1';
            document.querySelector(`[data-offer-id="${offerId}"]`).style.border = '3px solid #28a745';
        }
    } catch (error) {
        showNotification('Error al aceptar oferta', 'error');
        console.error(error);
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'menos de un minuto';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutos`;
    return `${Math.floor(diff / 3600)} horas`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
