from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)

# Configuración de MySQL
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'tonypecas16',
    'database': 'herool_db'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ===================== USUARIOS =====================

# Registro de usuario
@app.route('/api/usuarios/register', methods=['POST'])
def register():
    data = request.get_json()
    password_raw = data.get('contraseña') or data.get('contrasena')

    if not all(k in data for k in ['nombre', 'email', 'tipo_usuario', 'telefono']) or not password_raw:
        return jsonify({'error': 'Datos incompletos'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        contraseña_hash = hash_password(password_raw)
        
        query = """INSERT INTO usuarios (nombre, email, contraseña, tipo_usuario, telefono) 
                   VALUES (%s, %s, %s, %s, %s)"""
        
        cursor.execute(query, (data['nombre'], data['email'], contraseña_hash, 
                              data['tipo_usuario'], data['telefono']))
        conn.commit()
        
        usuario_id = cursor.lastrowid
        
        return jsonify({
            'id': usuario_id,
            'nombre': data['nombre'],
            'email': data['email'],
            'tipo_usuario': data['tipo_usuario']
        }), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# Login
@app.route('/api/usuarios/login', methods=['POST'])
def login():
    data = request.get_json()
    password_raw = data.get('contraseña') or data.get('contrasena')

    if not all(k in data for k in ['email']) or not password_raw:
        return jsonify({'error': 'Email y contraseña requeridos'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        contraseña_hash = hash_password(password_raw)

        query = "SELECT * FROM usuarios WHERE email = %s AND (contraseña = %s OR contraseña = %s)"
        cursor.execute(query, (data['email'], contraseña_hash, password_raw))
        
        usuario = cursor.fetchone()
        
        if usuario:
            return jsonify({
                'id': usuario['id'],
                'nombre': usuario['nombre'],
                'email': usuario['email'],
                'tipo_usuario': usuario['tipo_usuario'],
                'telefono': usuario['telefono'],
                'calificacion': float(usuario['calificacion']) if usuario['calificacion'] else 0
            }), 200
        else:
            return jsonify({'error': 'Credenciales inválidas'}), 401
            
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Obtener datos de un usuario
@app.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
def get_usuario(usuario_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM usuarios WHERE id = %s"
        cursor.execute(query, (usuario_id,))
        usuario = cursor.fetchone()
        
        if usuario:
            return jsonify({
                'id': usuario['id'],
                'nombre': usuario['nombre'],
                'email': usuario['email'],
                'tipo_usuario': usuario['tipo_usuario'],
                'telefono': usuario['telefono'],
                'calificacion': float(usuario['calificacion']) if usuario['calificacion'] else 0,
                'descripcion': usuario['descripcion']
            }), 200
        else:
            return jsonify({'error': 'Usuario no encontrado'}), 404
            
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===================== SERVICIOS =====================

# Obtener todos los servicios
@app.route('/api/servicios', methods=['GET'])
def get_servicios():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM servicios"
        cursor.execute(query)
        servicios = cursor.fetchall()
        
        return jsonify(servicios), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===================== SOLICITUDES =====================

# Crear nueva solicitud
@app.route('/api/solicitudes', methods=['POST'])
def create_solicitud():
    data = request.get_json()
    
    if not all(k in data for k in ['cliente_id', 'servicio_id', 'descripcion', 'ubicacion']):
        return jsonify({'error': 'Datos incompletos'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        query = """INSERT INTO solicitudes (cliente_id, servicio_id, descripcion, ubicacion, latitude, longitude) 
                   VALUES (%s, %s, %s, %s, %s, %s)"""
        
        cursor.execute(query, (data['cliente_id'], data['servicio_id'], data['descripcion'], 
                              data['ubicacion'], latitude, longitude))
        conn.commit()
        
        return jsonify({
            'id': cursor.lastrowid,
            'mensaje': 'Solicitud creada exitosamente'
        }), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Obtener solicitudes abiertas de un servicio
@app.route('/api/solicitudes/servicio/<int:servicio_id>', methods=['GET'])
def get_solicitudes_servicio(servicio_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """SELECT s.*, u.nombre as cliente_nombre, u.telefono 
                   FROM solicitudes s
                   JOIN usuarios u ON s.cliente_id = u.id
                   WHERE s.servicio_id = %s AND s.estado = 'abierta'
                   ORDER BY s.fecha_creada DESC"""
        
        cursor.execute(query, (servicio_id,))
        solicitudes = cursor.fetchall()
        
        return jsonify(solicitudes), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Obtener solicitudes de un cliente
@app.route('/api/solicitudes/cliente/<int:cliente_id>', methods=['GET'])
def get_solicitudes_cliente(cliente_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """SELECT s.*, sv.nombre as servicio_nombre 
                   FROM solicitudes s
                   JOIN servicios sv ON s.servicio_id = sv.id
                   WHERE s.cliente_id = %s
                   ORDER BY s.fecha_creada DESC"""
        
        cursor.execute(query, (cliente_id,))
        solicitudes = cursor.fetchall()
        
        return jsonify(solicitudes), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Obtener detalles de una solicitud
@app.route('/api/solicitudes/<int:solicitud_id>', methods=['GET'])
def get_solicitud(solicitud_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """SELECT s.*, sv.nombre as servicio_nombre, u.nombre as cliente_nombre, u.telefono
                   FROM solicitudes s
                   JOIN servicios sv ON s.servicio_id = sv.id
                   JOIN usuarios u ON s.cliente_id = u.id
                   WHERE s.id = %s"""
        
        cursor.execute(query, (solicitud_id,))
        solicitud = cursor.fetchone()
        
        if solicitud:
            return jsonify(solicitud), 200
        else:
            return jsonify({'error': 'Solicitud no encontrada'}), 404
            
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Obtener todas las solicitudes abiertas (para técnicos)
@app.route('/api/solicitudes/abiertas', methods=['GET'])
def get_solicitudes_abiertas():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """SELECT s.*, sv.nombre as servicio_nombre, u.nombre as cliente_nombre, u.telefono
                   FROM solicitudes s
                   JOIN servicios sv ON s.servicio_id = sv.id
                   JOIN usuarios u ON s.cliente_id = u.id
                   WHERE s.estado = 'abierta'
                   ORDER BY s.fecha_creada DESC"""
        
        cursor.execute(query)
        solicitudes = cursor.fetchall()
        
        return jsonify(solicitudes), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===================== OFERTAS =====================

# Crear oferta
@app.route('/api/ofertas', methods=['POST'])
def create_oferta():
    data = request.get_json()
    
    if not all(k in data for k in ['solicitud_id', 'tecnico_id', 'precio']):
        return jsonify({'error': 'Datos incompletos'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        descripcion = data.get('descripcion', '')
        
        query = """INSERT INTO ofertas (solicitud_id, tecnico_id, precio, descripcion) 
                   VALUES (%s, %s, %s, %s)"""
        
        cursor.execute(query, (data['solicitud_id'], data['tecnico_id'], data['precio'], descripcion))
        conn.commit()
        
        return jsonify({
            'id': cursor.lastrowid,
            'mensaje': 'Oferta creada exitosamente'
        }), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# Obtener ofertas de una solicitud
@app.route('/api/ofertas/solicitud/<int:solicitud_id>', methods=['GET'])
def get_ofertas_solicitud(solicitud_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """SELECT o.*, u.nombre as tecnico_nombre, u.calificacion, u.telefono
                   FROM ofertas o
                   JOIN usuarios u ON o.tecnico_id = u.id
                   WHERE o.solicitud_id = %s
                   ORDER BY o.precio ASC"""
        
        cursor.execute(query, (solicitud_id,))
        ofertas = cursor.fetchall()
        
        return jsonify(ofertas), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Obtener ofertas de un técnico
@app.route('/api/ofertas/tecnico/<int:tecnico_id>', methods=['GET'])
def get_ofertas_tecnico(tecnico_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        query = """SELECT o.*, s.descripcion as solicitud_descripcion, s.ubicacion,
                          sv.nombre as servicio_nombre, u.nombre as cliente_nombre
                   FROM ofertas o
                   JOIN solicitudes s ON o.solicitud_id = s.id
                   JOIN servicios sv ON s.servicio_id = sv.id
                   JOIN usuarios u ON s.cliente_id = u.id
                   WHERE o.tecnico_id = %s
                   ORDER BY o.fecha_oferta DESC"""

        cursor.execute(query, (tecnico_id,))
        ofertas = cursor.fetchall()

        return jsonify(ofertas), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Aceptar oferta
@app.route('/api/ofertas/<int:oferta_id>/aceptar', methods=['PUT'])
def aceptar_oferta(oferta_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Obtener la oferta
        cursor.execute("SELECT * FROM ofertas WHERE id = %s", (oferta_id,))
        oferta = cursor.fetchone()
        
        if not oferta:
            return jsonify({'error': 'Oferta no encontrada'}), 404
        
        # Actualizar oferta a aceptada
        cursor.execute("UPDATE ofertas SET estado = 'aceptada' WHERE id = %s", (oferta_id,))
        
        # Rechazar otras ofertas de la misma solicitud
        cursor.execute("UPDATE ofertas SET estado = 'rechazada' WHERE solicitud_id = %s AND id != %s", 
                      (oferta['solicitud_id'], oferta_id))
        
        # Cambiar estado de solicitud a en_progreso
        cursor.execute("UPDATE solicitudes SET estado = 'en_progreso' WHERE id = %s", 
                      (oferta['solicitud_id'],))
        
        conn.commit()
        
        return jsonify({'mensaje': 'Oferta aceptada'}), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Rechazar oferta
@app.route('/api/ofertas/<int:oferta_id>/rechazar', methods=['PUT'])
def rechazar_oferta(oferta_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE ofertas SET estado = 'rechazada' WHERE id = %s", (oferta_id,))
        conn.commit()
        
        return jsonify({'mensaje': 'Oferta rechazada'}), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===================== RUTAS DE ERROR =====================

@app.route('/', methods=['GET'])
def index():
    return jsonify({'mensaje': 'API HerOol funcionando correctamente'}), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Ruta no encontrada'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
