import { Component, HostListener } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Marco de la zona privada: menú lateral, barra superior con el usuario y contenido. */
@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  colapsado = false;
  menuMovil = false;
  menuUsuario = false;
  fecha = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  constructor(public auth: AuthService) {}

  get saludo(): string {
    const hora = new Date().getHours();
    return hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  get primerNombre(): string {
    return this.auth.usuario?.nombre.split(' ')[0] ?? '';
  }

  get iniciales(): string {
    return (this.auth.usuario?.nombre ?? '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  cerrarSesion(): void {
    this.menuUsuario = false;
    this.auth.cerrarSesion();
  }

  @HostListener('document:keydown.escape')
  cerrarMenus(): void {
    this.menuUsuario = false;
    this.menuMovil = false;
  }
}
