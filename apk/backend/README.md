# HerOol - Sistema de Servicios Técnicos (MVP)

## Estructura del Proyecto

```
apk/
├── backend/
│   ├── app.py (Flask API)
│   ├── database.sql (Script BD)
│   └── requirements.txt
└── frontend/
    └── [Ionic App - se integrará después]
```

---

## Setup Backend

### 1. Crear la Base de Datos

```bash
mysql -u root -p < apk/backend/database.sql
```

**Nota:** Si tu MySQL tiene contraseña, usa:
```bash
mysql -u root -p[tu_contraseña] < apk/backend/database.sql
```

### 2. Instalar dependencias

```bash
cd apk/backend
pip install -r requirements.txt
```

### 3. Configurar credenciales (si es necesario)

Edita `app.py` línea ~16 y cambia:
```python
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Tu contraseña aquí
    'database': 'herool_db'
}
```

### 4. Iniciar servidor

```bash
python app.py
```

El servidor estará en `http://localhost:5000`

---

## Endpoints API

### Usuarios
- **POST** `/api/usuarios/register` - Registrar usuario
- **POST** `/api/usuarios/login` - Login
- **GET** `/api/usuarios/<id>` - Obtener datos usuario

### Servicios
- **GET** `/api/servicios` - Listar todos los servicios

### Solicitudes
- **POST** `/api/solicitudes` - Crear solicitud
- **GET** `/api/solicitudes/cliente/<id>` - Solicitudes de un cliente
- **GET** `/api/solicitudes/servicio/<id>` - Solicitudes abiertas de un servicio
- **GET** `/api/solicitudes/<id>` - Detalles de una solicitud

### Ofertas
- **POST** `/api/ofertas` - Crear oferta
- **GET** `/api/ofertas/solicitud/<id>` - Ofertas de una solicitud
- **PUT** `/api/ofertas/<id>/aceptar` - Aceptar oferta
- **PUT** `/api/ofertas/<id>/rechazar` - Rechazar oferta

---

## Estructura Base de Datos

**Tablas principales:**
- `usuarios` - Clientes y Técnicos
- `servicios` - Fontanero, Electricista, Carpintero
- `tecnico_servicios` - Especialidades de técnicos
- `solicitudes` - Pedidos de clientes
- `ofertas` - Ofertas de técnicos
- `resenas` - Calificaciones

---

## Flujo de la App

### Cliente
1. **Registrarse/Login** como Cliente
2. **Crear solicitud** - Servicio + Descripción + Ubicación
3. **Ver ofertas** - Técnicos responden con sus precios
4. **Aceptar oferta** - Selecciona el técnico

### Técnico
1. **Registrarse/Login** como Técnico
2. **Ver solicitudes** - De su especialidad
3. **Hacer ofertas** - Con su precio propuesto
4. **Esperar aceptación** del cliente

---

## Próximos pasos

1. ✅ Backend Python + BD MySQL
2. 📱 Conectar Ionic con API
3. 🎨 Diseño minimalista naranja
4. 📍 Integrar GPS/Ubicación
5. 🔔 Notificaciones en tiempo real
6. 📦 Generar APK

---

## Base de Datos Test

Usuarios de prueba creados automáticamente:
- Servicios: Fontanero, Electricista, Carpintero

Para agregar usuarios de prueba manualmente en MySQL:

```sql
INSERT INTO usuarios (nombre, email, contraseña, tipo_usuario, telefono) 
VALUES ('Juan Cliente', 'cliente@test.com', SHA2('123456', 256), 'cliente', '123456789');

INSERT INTO usuarios (nombre, email, contraseña, tipo_usuario, telefono, descripcion) 
VALUES ('Carlos Fontanero', 'tecnico@test.com', SHA2('123456', 256), 'tecnico', '987654321', '10 años de experiencia');
```

