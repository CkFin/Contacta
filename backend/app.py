from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Almacenamiento en memoria (en producción usar base de datos)
requests_db = []
offers_db = []
technicians_db = []

@app.route('/api/register-tech', methods=['POST'])
def register_tech():
    """Registrar técnico con su especialidad"""
    data = request.json
    tech = {
        'id': len(technicians_db) + 1,
        'name': data['name'],
        'specialty': data['specialty'],
        'active': True,
        'rating': 5.0,
        'completed_jobs': 0
    }
    technicians_db.append(tech)
    return jsonify({'success': True, 'tech': tech}), 201

@app.route('/api/create-request', methods=['POST'])
def create_request():
    """Cliente crea una solicitud de servicio"""
    data = request.json
    new_request = {
        'id': len(requests_db) + 1,
        'service': data['service'],
        'clientName': data['clientName'],
        'details': data['details'],
        'address': data['address'],
        'timestamp': datetime.now().isoformat(),
        'status': 'pending',
        'offers': []
    }
    requests_db.append(new_request)
    
    # Notificar a técnicos disponibles
    notify_technicians(new_request)
    
    return jsonify({'success': True, 'request': new_request}), 201

@app.route('/api/requests/<specialty>', methods=['GET'])
def get_requests_by_specialty(specialty):
    """Obtener solicitudes por especialidad"""
    filtered = [r for r in requests_db if r['service'] == specialty and r['status'] == 'pending']
    return jsonify(filtered)

@app.route('/api/create-offer', methods=['POST'])
def create_offer():
    """Técnico hace una oferta"""
    data = request.json
    offer = {
        'id': len(offers_db) + 1,
        'request_id': data['request_id'],
        'tech_id': data['tech_id'],
        'tech_name': data['tech_name'],
        'price': data['price'],
        'time': data['time'],
        'message': data.get('message', ''),
        'timestamp': datetime.now().isoformat()
    }
    offers_db.append(offer)
    
    # Agregar oferta a la solicitud
    for req in requests_db:
        if req['id'] == data['request_id']:
            req['offers'].append(offer)
            break
    
    return jsonify({'success': True, 'offer': offer}), 201

@app.route('/api/offers/<int:request_id>', methods=['GET'])
def get_offers(request_id):
    """Obtener ofertas para una solicitud específica"""
    request_offers = [o for o in offers_db if o['request_id'] == request_id]
    return jsonify(request_offers)

@app.route('/api/accept-offer', methods=['POST'])
def accept_offer():
    """Cliente acepta una oferta"""
    data = request.json
    offer_id = data['offer_id']
    request_id = data['request_id']
    
    # Actualizar estado de la solicitud
    for req in requests_db:
        if req['id'] == request_id:
            req['status'] = 'accepted'
            req['accepted_offer_id'] = offer_id
            break
    
    return jsonify({'success': True, 'message': 'Oferta aceptada'}), 200

@app.route('/api/technicians', methods=['GET'])
def get_technicians():
    """Obtener lista de técnicos"""
    return jsonify(technicians_db)

@app.route('/api/requests', methods=['GET'])
def get_all_requests():
    """Obtener todas las solicitudes"""
    return jsonify(requests_db)

def notify_technicians(request_data):
    """Simular notificación a técnicos"""
    specialty = request_data['service']
    available_techs = [t for t in technicians_db if t['specialty'] == specialty and t['active']]
    print(f"📢 Notificando a {len(available_techs)} técnicos de {specialty}")
    return available_techs

if __name__ == '__main__':
    app.run(debug=True, port=5000)
