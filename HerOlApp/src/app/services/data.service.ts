import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  contraseña?: string;
  tipo_usuario: 'cliente' | 'tecnico';
  telefono: string;
  calificacion?: number;
  descripcion?: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
}

export interface Solicitud {
  id?: number;
  cliente_id: number;
  servicio_id: number;
  descripcion: string;
  ubicacion: string;
  latitude?: number;
  longitude?: number;
  estado?: string;
  fecha_creada?: string;
  cliente_nombre?: string;
  servicio_nombre?: string;
}

export interface Oferta {
  id?: number;
  solicitud_id: number;
  tecnico_id: number;
  precio: number;
  descripcion?: string;
  estado?: string;
  fecha_oferta?: string;
  tecnico_nombre?: string;
  calificacion?: number;
  solicitud_descripcion?: string;
  ubicacion?: string;
  servicio_nombre?: string;
  cliente_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl: string;
  private usuarioActual = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioActual.asObservable();

  constructor(private http: HttpClient) {
    this.initializeApiUrl();
    this.cargarUsuarioLocal();
  }

  private initializeApiUrl() {
    // Detectar ambiente
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDevelopment = !this.isNativeApp();
    
    if (isDevelopment && isLocalhost) {
      // Desarrollo en navegador web
      this.apiUrl = 'http://localhost:5000/api';
    } else if (this.isNativeApp()) {
      // App nativa - usar URL de servidor en nube (Railway)
      this.apiUrl = 'https://contacta-production.up.railway.app/api';
    } else {
      // Fallback
      this.apiUrl = 'https://contacta-production.up.railway.app/api';
    }
    
    console.log('API URL inicializada:', this.apiUrl);
  }

  private isNativeApp(): boolean {
    return window.location.protocol.startsWith('http') && 
           (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
  }

  setApiUrl(url: string) {
    // Permitir cambiar URL dinámicamente para testing
    this.apiUrl = url;
    console.log('API URL actualizada a:', this.apiUrl);
  }

  private cargarUsuarioLocal() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      this.usuarioActual.next(JSON.parse(usuario));
    }
  }

  // USUARIOS
  login(email: string, contraseña: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/login`, { email, contrasena: contraseña });
  }

  registrar(usuario: Usuario): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/register`, usuario);
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }

  guardarUsuario(usuario: Usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioActual.next(usuario);
  }

  logout() {
    localStorage.removeItem('usuario');
    this.usuarioActual.next(null);
  }

  // SERVICIOS
  getServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/servicios`);
  }

  // SOLICITUDES
  crearSolicitud(solicitud: Solicitud): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes`, solicitud);
  }

  getSolicitudesCliente(clienteId: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/solicitudes/cliente/${clienteId}`);
  }

  getSolicitudesServicio(servicioId: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/solicitudes/servicio/${servicioId}`);
  }

  getSolicitudesAbiertas(): Observable<Solicitud[]> {
    // Obtener todas las solicitudes abiertas cargando todos los servicios
    return this.http.get<Solicitud[]>(`${this.apiUrl}/solicitudes/abiertas`);
  }

  getSolicitud(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/solicitudes/${id}`);
  }

  // OFERTAS
  crearOferta(oferta: Oferta): Observable<any> {
    return this.http.post(`${this.apiUrl}/ofertas`, oferta);
  }

  getOfertasSolicitud(solicitudId: number): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/ofertas/solicitud/${solicitudId}`);
  }

  getOfertasTecnico(tecnicoId: number): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.apiUrl}/ofertas/tecnico/${tecnicoId}`);
  }

  aceptarOferta(ofertaId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/ofertas/${ofertaId}/aceptar`, {});
  }

  rechazarOferta(ofertaId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/ofertas/${ofertaId}/rechazar`, {});
  }
}
