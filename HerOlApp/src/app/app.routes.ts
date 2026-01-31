import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cliente',
    loadComponent: () => import('./pages/cliente/cliente.page').then((m) => m.ClientePage),
  },
  {
    path: 'tecnico',
    loadComponent: () => import('./pages/tecnico/tecnico.page').then((m) => m.TecnicoPage),
  },
  {
    path: 'solicitud/:id',
    loadComponent: () => import('./pages/solicitud-detalle/solicitud-detalle.page').then((m) => m.SolicitudDetallePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  },
];

