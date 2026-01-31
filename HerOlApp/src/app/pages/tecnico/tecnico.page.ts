import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonCard, IonCardContent,
  IonList, IonItem, IonText, IonRouterOutlet
} from '@ionic/angular/standalone';
import { DataService, Usuario, Solicitud, Servicio, Oferta } from '../../services/data.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { home, personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-tecnico',
  templateUrl: './tecnico.page.html',
  styleUrls: ['./tecnico.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonCard, IonCardContent,
    IonList, IonItem, IonText, IonRouterOutlet
  ]
})
export class TecnicoPage implements OnInit {
  usuario: Usuario | null = null;
  solicitudes: Solicitud[] = [];
  servicios: Servicio[] = [];
  ofertas: Oferta[] = [];
  
  tabActiva: 'solicitudes' | 'ofertas' | 'perfil' = 'solicitudes';
  
  // Crear oferta
  solicitudSeleccionada: Solicitud | null = null;
  precio: number = 0;
  descripcion: string = '';
  mostrarFormularioOferta: boolean = false;
  
  cargando: boolean = false;
  error: string = '';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    addIcons({ home, personCircle });
  }

  ngOnInit() {
    this.dataService.usuarioActual$.subscribe(usuario => {
      this.usuario = usuario;
      if (usuario) {
        this.cargarServicios();
        this.cargarOfertas();
      }
    });
  }

  cargarServicios() {
    this.dataService.getServicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
        // Cargar solicitudes una vez que los servicios estén listos
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error cargando servicios', err)
    });
  }

  cargarSolicitudes() {
    // Cargar TODAS las solicitudes abiertas (para que cualquier técnico vea oportunidades)
    // NOTA: Esto se guardará en localStorage. Cuando volvamos a la BD, 
    // el servidor sincronizará los datos entre clientes y técnicos automáticamente.
    this.dataService.getSolicitudesAbiertas().subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes.map(s => ({
          ...s,
          servicio_nombre: this.servicios.find(serv => serv.id === s.servicio_id)?.nombre || 'Servicio desconocido'
        }));
      },
      error: (err) => console.error('Error cargando solicitudes', err)
    });
  }

  cargarOfertas() {
    if (!this.usuario) return;
    this.dataService.getOfertasTecnico(this.usuario.id!).subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
      },
      error: (err) => console.error('Error cargando ofertas', err)
    });
  }

  seleccionarSolicitud(solicitud: Solicitud) {
    this.solicitudSeleccionada = solicitud;
    this.mostrarFormularioOferta = true;
    this.precio = 0;
    this.descripcion = '';
    this.error = '';
  }

  crearOferta() {
    if (!this.usuario || !this.solicitudSeleccionada || !this.precio) {
      this.error = 'Todos los campos son requeridos';
      return;
    }

    this.cargando = true;
    this.error = '';

    const nuevaOferta = {
      solicitud_id: this.solicitudSeleccionada.id!,
      tecnico_id: this.usuario.id!,
      precio: this.precio,
      descripcion: this.descripcion
    };

    this.dataService.crearOferta(nuevaOferta).subscribe({
      next: () => {
        this.cargando = false;
        this.mostrarFormularioOferta = false;
        this.solicitudSeleccionada = null;
        this.precio = 0;
        this.descripcion = '';
        alert('Oferta enviada correctamente');
        this.cargarSolicitudes();
        this.cargarOfertas();
      },
      error: (err) => {
        this.error = err.error?.error || 'Error creando oferta';
        this.cargando = false;
      }
    });
  }

  cambiarTab(tab: 'solicitudes' | 'ofertas' | 'perfil') {
    this.tabActiva = tab;
    if (tab === 'solicitudes') {
      this.cargarSolicitudes();
    }
    if (tab === 'ofertas') {
      this.cargarOfertas();
    }
  }

  cancelarOferta() {
    this.mostrarFormularioOferta = false;
    this.solicitudSeleccionada = null;
    this.precio = 0;
    this.descripcion = '';
    this.error = '';
  }

  logout() {
    this.dataService.logout();
    this.router.navigate(['/login']);
  }

  obtenerNombreServicio(servicioId: number): string {
    return this.servicios.find(s => s.id === servicioId)?.nombre || 'Desconocido';
  }
}
