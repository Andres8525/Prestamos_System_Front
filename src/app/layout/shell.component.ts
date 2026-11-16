import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TiempoRealService } from '../services/tiempo-real.service';
import { EstadoConexion } from '../models/tiempo-real.model';

/** Marco de la zona privada: menú lateral, barra superior con el usuario y contenido. */
@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html'
})
export class ShellComponent implements OnInit, OnDestroy {
  colapsado = false;
  menuMovil = false;
  menuUsuario = false;
  fecha = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  estadoTiempoReal: EstadoConexion = 'desconectado';
  conectados = 0;
  private subs = new Subscription();

  constructor(public auth: AuthService, private tiempoReal: TiempoRealService) {}

  ngOnInit(): void {
    this.subs.add(this.tiempoReal.estado$.subscribe((e) => (this.estadoTiempoReal = e)));
    this.subs.add(this.tiempoReal.conexiones$.subscribe((n) => (this.conectados = n)));
    this.tiempoReal.conectar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.tiempoReal.desconectar();
  }

  get textoTiempoReal(): string {
    switch (this.estadoTiempoReal) {
      case 'conectado': return this.conectados > 1 ? `En vivo · ${this.conectados} conectados` : 'En vivo';
      case 'reconectando': return 'Reconectando…';
      case 'conectando': return 'Conectando…';
      default: return 'Sin tiempo real';
    }
  }

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
