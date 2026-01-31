import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonCard, IonCardContent, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { DataService, Solicitud, Oferta } from '../../services/data.service';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-solicitud-detalle',
  templateUrl: './solicitud-detalle.page.html',
  styleUrls: ['./solicitud-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonCard, IonCardContent, IonBackButton, IonButtons
  ]
})
export class SolicitudDetallePage implements OnInit {
  solicitud: Solicitud | null = null;
  ofertas: Oferta[] = [];
  cargando: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private router: Router
  ) {
    addIcons({ arrowBack });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarSolicitud(parseInt(id));
    }
  }

  cargarSolicitud(id: number) {
    this.dataService.getSolicitud(id).subscribe({
      next: (solicitud) => {
        this.solicitud = solicitud;
        this.cargarOfertas(id);
      },
      error: (err) => {
        this.error = 'Error cargando solicitud';
        this.cargando = false;
      }
    });
  }

  cargarOfertas(solicitudId: number) {
    this.dataService.getOfertasSolicitud(solicitudId).subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error cargando ofertas';
        this.cargando = false;
      }
    });
  }

  aceptarOferta(ofertaId: number) {
    this.dataService.aceptarOferta(ofertaId).subscribe({
      next: () => {
        alert('¡Oferta aceptada!');
        this.router.navigate(['/cliente']);
      },
      error: (err) => {
        alert('Error aceptando la oferta');
      }
    });
  }

  volver() {
    this.router.navigate(['/cliente']);
  }
}
