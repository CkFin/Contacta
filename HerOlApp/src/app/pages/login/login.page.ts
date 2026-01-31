import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { DataService, Usuario } from '../../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardContent
  ]
})
export class LoginPage implements OnInit {
  modo: 'login' | 'registro' = 'login';
  tipoUsuario: 'cliente' | 'tecnico' = 'cliente';
  
  // Login
  email: string = '';
  contrasena: string = '';
  
  // Registro
  nombre: string = '';
  telefonoReg: string = '';
  emailReg: string = '';
  contrasenaReg: string = '';
  contrasenaReg2: string = '';

  cargando: boolean = false;
  error: string = '';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {}

  login() {
    if (!this.email || !this.contrasena) {
      this.error = 'Email y contraseña requeridos';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.dataService.login(this.email, this.contrasena).subscribe({
      next: (usuario) => {
        // Forzar el tipo de usuario seleccionado
        usuario.tipo_usuario = this.tipoUsuario;
        this.dataService.guardarUsuario(usuario);
        this.cargando = false;
        
        // Redirigir según tipo de usuario
        if (this.tipoUsuario === 'cliente') {
          this.router.navigate(['/cliente']);
        } else {
          this.router.navigate(['/tecnico']);
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Error en el login';
        this.cargando = false;
      }
    });
  }

  registro() {
    if (!this.nombre || !this.emailReg || !this.contrasenaReg || !this.telefonoReg) {
      this.error = 'Todos los campos son requeridos';
      return;
    }

    if (this.contrasenaReg !== this.contrasenaReg2) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.contrasenaReg.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.cargando = true;
    this.error = '';

    const nuevoUsuario: Usuario = {
      nombre: this.nombre,
      email: this.emailReg,
      contraseña: this.contrasenaReg,
      tipo_usuario: this.tipoUsuario,
      telefono: this.telefonoReg
    };

    this.dataService.registrar(nuevoUsuario).subscribe({
      next: (usuario) => {
        this.error = '';
        this.modo = 'login';
        this.email = this.emailReg;
        this.contrasena = this.contrasenaReg;
        this.cargando = false;
        // Limpiar campos
        this.nombre = '';
        this.telefonoReg = '';
        this.emailReg = '';
        this.contrasenaReg = '';
        this.contrasenaReg2 = '';
        alert('Registro exitoso, ahora inicia sesión');
      },
      error: (err) => {
        this.error = err.error?.error || 'Error en el registro';
        this.cargando = false;
      }
    });
  }

  cambiarModo(modo: 'login' | 'registro') {
    this.modo = modo;
    this.error = '';
    this.email = '';
    this.contrasena = '';
    this.nombre = '';
    this.telefonoReg = '';
    this.emailReg = '';
    this.contrasenaReg = '';
    this.contrasenaReg2 = '';
  }
}
