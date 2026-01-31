import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput,
  IonLabel, IonCard, IonCardContent, IonIcon, IonFab, IonFabButton,
  IonList, IonItem, IonText, IonTabs, IonTabBar, IonTabButton, IonRouterOutlet
} from '@ionic/angular/standalone';
import { DataService, Usuario, Solicitud, Servicio, Oferta } from '../../services/data.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, home, personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput,
    IonLabel, IonCard, IonCardContent, IonIcon, IonFab, IonFabButton,
    IonList, IonItem, IonText, IonTabs, IonTabBar, IonTabButton, IonRouterOutlet
  ]
})
export class ClientePage implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  solicitudes: Solicitud[] = [];
  servicios: Servicio[] = [];
  ofertasPorSolicitud: { [solicitudId: number]: Oferta[] } = {};
  totalOfertas: number = 0;
  
  tabActiva: 'inicio' | 'solicitudes' | 'perfil' = 'inicio';
  
  // Crear solicitud
  mostrarFormulario: boolean = false;
  servicioSeleccionado: number = 0;
  descripcion: string = '';
  ubicacion: string = '';
  
  cargando: boolean = false;
  error: string = '';
  private ofertasInterval: any;

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    addIcons({ add, home, personCircle });
  }

  ngOnInit() {
    this.dataService.usuarioActual$.subscribe(usuario => {
      this.usuario = usuario;
      if (usuario) {
        this.cargarServicios();
        this.cargarSolicitudes();
        this.iniciarActualizacionOfertas();
      }
    });
  }

  ngOnDestroy() {
    if (this.ofertasInterval) {
      clearInterval(this.ofertasInterval);
    }
  }

  cargarServicios() {
    this.dataService.getServicios().subscribe({
      next: (servicios) => {
        this.servicios = servicios;
      },
      error: (err) => console.error('Error cargando servicios', err)
    });
  }

  cargarSolicitudes() {
    if (!this.usuario) return;
    
    this.dataService.getSolicitudesCliente(this.usuario.id!).subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes;
        this.cargarOfertasSolicitudes();
      },
      error: (err) => console.error('Error cargando solicitudes', err)
    });
  }

  iniciarActualizacionOfertas() {
    if (this.ofertasInterval) {
      clearInterval(this.ofertasInterval);
    }

    this.ofertasInterval = setInterval(() => {
      if (this.tabActiva === 'solicitudes') {
        this.cargarSolicitudes();
      }
    }, 8000);
  }

  cambiarTab(tab: 'inicio' | 'solicitudes' | 'perfil') {
    this.tabActiva = tab;
    if (tab === 'solicitudes') {
      this.cargarSolicitudes();
    }
  }

  cargarOfertasSolicitudes() {
    this.totalOfertas = 0;
    this.ofertasPorSolicitud = {};

    this.solicitudes.forEach((solicitud) => {
      if (!solicitud.id) return;
      this.dataService.getOfertasSolicitud(solicitud.id).subscribe({
        next: (ofertas) => {
          this.ofertasPorSolicitud[solicitud.id!] = ofertas;
          this.totalOfertas = Object.values(this.ofertasPorSolicitud)
            .reduce((acc, list) => acc + list.length, 0);
        },
        error: (err) => console.error('Error cargando ofertas', err)
      });
    });
  }

  crearSolicitud() {
    if (!this.usuario || !this.servicioSeleccionado || !this.descripcion || !this.ubicacion) {
      this.error = 'Todos los campos son requeridos';
      return;
    }

    this.cargando = true;
    this.error = '';

    const nuevaSolicitud: Solicitud = {
      cliente_id: this.usuario.id!,
      servicio_id: this.servicioSeleccionado,
      descripcion: this.descripcion,
      ubicacion: this.ubicacion
    };

    this.dataService.crearSolicitud(nuevaSolicitud).subscribe({
      next: () => {
        this.cargando = false;
        this.mostrarFormulario = false;
        this.servicioSeleccionado = 0;
        this.descripcion = '';
        this.ubicacion = '';
        this.cargarSolicitudes();
        alert('Solicitud creada exitosamente');
      },
      error: (err) => {
        this.error = err.error?.error || 'Error creando solicitud';
        this.cargando = false;
      }
    });
  }

  verSolicitud(solicitudId: number) {
    this.router.navigate(['/solicitud', solicitudId]);
  }

  aceptarOfertaCliente(ofertaId: number) {
    this.dataService.aceptarOferta(ofertaId).subscribe({
      next: () => {
        this.cargarSolicitudes();
        alert('Oferta aceptada');
      },
      error: (err) => {
        this.error = err.error?.error || 'Error aceptando oferta';
      }
    });
  }

  logout() {
    this.dataService.logout();
    this.router.navigate(['/login']);
  }

  obtenerNombreServicio(servicioId: number): string {
    return this.servicios.find(s => s.id === servicioId)?.nombre || 'Desconocido';
  }
}
