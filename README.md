# HerOl

Plataforma para conectar clientes con tecnicos (fontanero, electricista, carpintero) mediante solicitudes y ofertas de servicio.

## Estado del proyecto

- Frontend principal: Ionic + Angular en `HerOlApp/`.
- Backend API: Flask + MySQL en `backend/`.
- Prototipo frontend (flujo cliente/tecnico): scripts en `js/`.

## Estructura

- `HerOlApp/`: app movil/web con Ionic.
- `backend/`: API REST en Python (Flask) y conexion a MySQL.
- `js/`: logica de prototipo para cliente y tecnico.
- `css/`: estilos auxiliares.
- `Procfile`: comando de arranque para despliegue.
- `runtime.txt`: version de Python para despliegue.

## Requisitos

- Python 3.11+
- Node.js 20+
- npm 10+
- MySQL 8+

## Backend (Flask)

### 1. Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Variables de entorno

Configura estas variables para la base de datos:

- `MYSQLHOST`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`
- `PORT` (opcional, por defecto `5000`)

Ejemplo en PowerShell:

```powershell
$env:MYSQLHOST="localhost"
$env:MYSQLUSER="root"
$env:MYSQLPASSWORD="tu_password"
$env:MYSQLDATABASE="railway"
$env:MYSQLPORT="3306"
$env:PORT="5000"
```

### 3. Ejecutar API

```bash
python app.py
```

La API queda disponible en:

- `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Frontend principal (Ionic)

### 1. Instalar dependencias

```bash
cd HerOlApp
npm install
```

### 2. Ejecutar en desarrollo

```bash
npm start
```

Por defecto abre en:

- `http://localhost:4200`

## Endpoints principales de la API

### Autenticacion

- `POST /api/login`
- `POST /api/register`

### Servicios y solicitudes

- `GET /api/servicios`
- `POST /api/solicitudes`
- `GET /api/solicitudes/abiertas`

### Ofertas

- `POST /api/ofertas`
- `GET /api/ofertas/{id_solicitud}`
- `GET /api/ofertas/tecnico/{id_tecnico}`
- `PUT /api/ofertas/{id_oferta}/aceptar`
- `PUT /api/ofertas/{id_oferta}/rechazar`

## Flujo funcional

1. El cliente crea una solicitud de servicio.
2. Los tecnicos ven solicitudes abiertas.
3. Los tecnicos envian ofertas.
4. El cliente acepta o rechaza ofertas.

## Git y GitHub

Inicializacion rapida:

```bash
git init
git add .
git commit -m "Initial commit"
```

Conectar a GitHub:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

## Notas

- El backend inicializa tablas automaticamente al arrancar.
- El proyecto esta en evolucion; el prototipo de frontend y la app Ionic pueden convivir mientras se unifica el flujo final.
