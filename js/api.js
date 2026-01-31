const API_URL = 'http://localhost:5000/api';

class API {
    // Registrar técnico
    static async registerTech(name, specialty) {
        const response = await fetch(`${API_URL}/register-tech`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, specialty })
        });
        return response.json();
    }

    // Crear solicitud de servicio
    static async createRequest(service, clientName, details, address) {
        const response = await fetch(`${API_URL}/create-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service, clientName, details, address })
        });
        return response.json();
    }

    // Obtener solicitudes por especialidad
    static async getRequestsBySpecialty(specialty) {
        const response = await fetch(`${API_URL}/requests/${specialty}`);
        return response.json();
    }

    // Crear oferta
    static async createOffer(requestId, techId, techName, price, time, message = '') {
        const response = await fetch(`${API_URL}/create-offer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                request_id: requestId,
                tech_id: techId,
                tech_name: techName,
                price,
                time,
                message
            })
        });
        return response.json();
    }

    // Obtener ofertas para una solicitud
    static async getOffers(requestId) {
        const response = await fetch(`${API_URL}/offers/${requestId}`);
        return response.json();
    }

    // Aceptar oferta
    static async acceptOffer(offerId, requestId) {
        const response = await fetch(`${API_URL}/accept-offer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offer_id: offerId, request_id: requestId })
        });
        return response.json();
    }

    // Obtener todos los técnicos
    static async getTechnicians() {
        const response = await fetch(`${API_URL}/technicians`);
        return response.json();
    }
}
