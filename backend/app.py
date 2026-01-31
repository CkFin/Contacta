from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)

# Configurar CORS explícitamente para Capacitor
CORS(app, 
     origins=["*"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True,
     max_age=3600)

# Agregar headers CORS a todas las respuestas
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

# Configuración de base de datos desde variables de entorno
DB_CONFIG = {
    'host': os.environ.get('MYSQLHOST', 'localhost'),
    'user': os.environ.get('MYSQLUSER', 'root'),
    'password': os.environ.get('MYSQLPASSWORD', ''),
    'database': os.environ.get('MYSQLDATABASE', 'railway'),
    'port': int(os.environ.get('MYSQLPORT', 3306))
}

def get_db_connection():
    """Crear conexión a MySQL"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def init_database():
    """Inicializar tablas en la base de datos"""
    conn = get_db_connection()
    if not conn:
        print("No se pudo conectar a la BD para inicializar")
        return
    
    cursor = conn.cursor()
    
    # Crear tablas si no existen
    tables = [
        """CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            contraseña VARCHAR(255) NOT NULL,
            telefono VARCHAR(20),
            tipo_usuario ENUM('cliente', 'tecnico') NOT NULL,
            activo BOOLEAN DEFAULT TRUE,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        
        """CREATE TABLE IF NOT EXISTS servicios (
            id_servicio INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            precio_promedio DECIMAL(10, 2)
        )""",
        
        """CREATE TABLE IF NOT EXISTS solicitudes (
            id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
            id_cliente INT NOT NULL,
            id_servicio INT NOT NULL,
            descripcion TEXT,
            estado ENUM('abierta', 'aceptada', 'completada', 'cancelada') DEFAULT 'abierta',
            fecha_creada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio)
        )""",
        
        """CREATE TABLE IF NOT EXISTS ofertas (
            id_oferta INT AUTO_INCREMENT PRIMARY KEY,
            id_solicitud INT NOT NULL,
            id_tecnico INT NOT NULL,
            precio DECIMAL(10, 2),
            descripcion TEXT,
            estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
            fecha_oferta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
            FOREIGN KEY (id_tecnico) REFERENCES usuarios(id_usuario)
        )""",
        
        """CREATE TABLE IF NOT EXISTS resenas (
            id_resena INT AUTO_INCREMENT PRIMARY KEY,
            id_solicitud INT NOT NULL,
            id_cliente INT NOT NULL,
            id_tecnico INT NOT NULL,
            calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5),
            comentario TEXT,
            fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
            FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (id_tecnico) REFERENCES usuarios(id_usuario)
        )""",
        
        """CREATE TABLE IF NOT EXISTS tecnico_servicios (
            id_tecnico INT NOT NULL,
            id_servicio INT NOT NULL,
            PRIMARY KEY (id_tecnico, id_servicio),
            FOREIGN KEY (id_tecnico) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio)
        )"""
    ]
    
    for table_sql in tables:
        try:
            cursor.execute(table_sql)
            print(f"✅ Tabla creada/verificada")
        except Error as e:
            print(f"⚠️ Error al crear tabla: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Base de datos inicializada")


# ==================== RUTAS DE AUTENTICACIÓN ====================

@app.route('/api/login', methods=['POST'])
def login():
    """Login de usuario"""
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuarios WHERE email = %s AND contraseña = %s", 
                      (data['email'], data['contraseña']))
        usuario = cursor.fetchone()
        
        if usuario:
            return jsonify({'success': True, 'usuario': usuario}), 200
        else:
            return jsonify({'error': 'Credenciales inválidas'}), 401
    finally:
        cursor.close()
        conn.close()

@app.route('/api/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""INSERT INTO usuarios (nombre, email, contraseña, telefono, tipo_usuario) 
                         VALUES (%s, %s, %s, %s, %s)""",
                      (data['nombre'], data['email'], data['contraseña'], 
                       data.get('telefono', ''), data.get('tipo_usuario', 'cliente')))
        conn.commit()
        return jsonify({'success': True, 'id_usuario': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# ==================== RUTAS DE SERVICIOS ====================

@app.route('/api/servicios', methods=['GET'])
def get_servicios():
    """Obtener lista de servicios"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM servicios")
        servicios = cursor.fetchall()
        return jsonify(servicios), 200
    finally:
        cursor.close()
        conn.close()

# ==================== RUTAS DE SOLICITUDES ====================

@app.route('/api/solicitudes', methods=['POST'])
def crear_solicitud():
    """Crear nueva solicitud de servicio"""
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""INSERT INTO solicitudes (id_cliente, id_servicio, descripcion) 
                         VALUES (%s, %s, %s)""",
                      (data['id_cliente'], data['id_servicio'], data.get('descripcion', '')))
        conn.commit()
        return jsonify({'success': True, 'id_solicitud': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/solicitudes/abiertas', methods=['GET'])
def get_solicitudes_abiertas():
    """Obtener todas las solicitudes abiertas"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT 
            s.id_solicitud,
            s.descripcion,
            s.estado,
            s.fecha_creada,
            u.nombre as cliente_nombre,
            u.telefono,
            srv.nombre as servicio_nombre
        FROM solicitudes s
        LEFT JOIN usuarios u ON s.id_cliente = u.id_usuario
        LEFT JOIN servicios srv ON s.id_servicio = srv.id_servicio
        WHERE s.estado = 'abierta'
        ORDER BY s.fecha_creada DESC
        """
        cursor.execute(query)
        solicitudes = cursor.fetchall()
        return jsonify(solicitudes), 200
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# ==================== RUTAS DE OFERTAS ====================

@app.route('/api/ofertas', methods=['POST'])
def crear_oferta():
    """Crear oferta para una solicitud"""
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("""INSERT INTO ofertas (id_solicitud, id_tecnico, precio, descripcion) 
                         VALUES (%s, %s, %s, %s)""",
                      (data['id_solicitud'], data['id_tecnico'], 
                       data.get('precio', 0), data.get('descripcion', '')))
        conn.commit()
        return jsonify({'success': True, 'id_oferta': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/ofertas/<int:id_solicitud>', methods=['GET'])
def get_ofertas_solicitud(id_solicitud):
    """Obtener ofertas de una solicitud específica"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT o.*, u.nombre as tecnico_nombre 
        FROM ofertas o
        LEFT JOIN usuarios u ON o.id_tecnico = u.id_usuario
        WHERE o.id_solicitud = %s
        ORDER BY o.fecha_oferta DESC
        """
        cursor.execute(query, (id_solicitud,))
        ofertas = cursor.fetchall()
        return jsonify(ofertas), 200
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/ofertas/tecnico/<int:id_tecnico>', methods=['GET'])
def get_ofertas_tecnico(id_tecnico):
    """Obtener ofertas hechas por un técnico específico"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
        SELECT o.*, s.descripcion as solicitud_descripcion, u.nombre as cliente_nombre
        FROM ofertas o
        LEFT JOIN solicitudes s ON o.id_solicitud = s.id_solicitud
        LEFT JOIN usuarios u ON s.id_cliente = u.id_usuario
        WHERE o.id_tecnico = %s
        ORDER BY o.fecha_oferta DESC
        """
        cursor.execute(query, (id_tecnico,))
        ofertas = cursor.fetchall()
        return jsonify(ofertas), 200
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/ofertas/<int:id_oferta>/aceptar', methods=['PUT'])
def aceptar_oferta(id_oferta):
    """Aceptar una oferta"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor()
    try:
        # Actualizar oferta a aceptada
        cursor.execute("UPDATE ofertas SET estado = 'aceptada' WHERE id_oferta = %s", (id_oferta,))
        
        # Obtener id_solicitud de la oferta
        cursor.execute("SELECT id_solicitud FROM ofertas WHERE id_oferta = %s", (id_oferta,))
        result = cursor.fetchone()
        if result:
            id_solicitud = result[0]
            # Actualizar solicitud a aceptada
            cursor.execute("UPDATE solicitudes SET estado = 'aceptada' WHERE id_solicitud = %s", (id_solicitud,))
        
        conn.commit()
        return jsonify({'success': True}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/ofertas/<int:id_oferta>/rechazar', methods=['PUT'])
def rechazar_oferta(id_oferta):
    """Rechazar una oferta"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de conexión a BD'}), 500
    
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE ofertas SET estado = 'rechazada' WHERE id_oferta = %s", (id_oferta,))
        conn.commit()
        return jsonify({'success': True}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cursor.close()
        conn.close()

# ==================== RUTAS DE SALUD ====================

@app.route('/api/health', methods=['GET'])
def health():
    """Verificar estado de la API"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    else:
        return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500

# ==================== INICIALIZACIÓN ====================

if __name__ == '__main__':
    # Inicializar base de datos
    init_database()
    
    # Ejecutar app
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
