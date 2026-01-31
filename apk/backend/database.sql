-- Crear base de datos
CREATE DATABASE IF NOT EXISTS herool_db;
USE herool_db;

-- Tabla de usuarios (Cliente y Técnico)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    tipo_usuario ENUM('cliente', 'tecnico') NOT NULL,
    foto_perfil VARCHAR(255),
    calificacion DECIMAL(3, 2) DEFAULT 0,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de servicios disponibles
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de especialidades de técnicos
CREATE TABLE tecnico_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tecnico_id INT NOT NULL,
    servicio_id INT NOT NULL,
    experiencia INT,
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tecnico_servicio (tecnico_id, servicio_id)
);

-- Tabla de solicitudes de servicio
CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    estado ENUM('abierta', 'en_progreso', 'completada', 'cancelada') DEFAULT 'abierta',
    fecha_creada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completada TIMESTAMP NULL,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
);

-- Tabla de ofertas de técnicos
CREATE TABLE ofertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
    fecha_oferta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tecnico_solicitud (solicitud_id, tecnico_id)
);

-- Tabla de reseñas y calificaciones
CREATE TABLE resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    cliente_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    fecha_creada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar servicios iniciales
INSERT INTO servicios (nombre, descripcion, icono) VALUES
('Fontanero', 'Servicios de plomería y reparaciones', '🔧'),
('Electricista', 'Servicios eléctricos y mantenimiento', '⚡'),
('Carpintero', 'Trabajos de carpintería y mueblería', '🪛');

-- Índices para mejor rendimiento
CREATE INDEX idx_cliente_id ON solicitudes(cliente_id);
CREATE INDEX idx_servicio_id ON solicitudes(servicio_id);
CREATE INDEX idx_tecnico_id ON ofertas(tecnico_id);
CREATE INDEX idx_solicitud_id ON ofertas(solicitud_id);
CREATE INDEX idx_estado ON solicitudes(estado);
CREATE INDEX idx_tecnico_servicios ON tecnico_servicios(tecnico_id);
