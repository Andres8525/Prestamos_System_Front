import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TiempoRealService } from '../services/tiempo-real.service';
import { NotificacionService } from '../services/notificacion.service';
import { TemaService } from '../services/tema.service';
import { EstadoConexion, EventoTiempoReal } from '../models/tiempo-real.model';

/** Los eventos más antiguos que esto vienen del historial al conectar: no se notifican. */
const ANTIGUEDAD_MAXIMA_AVISO_MS = 15000;

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

  constructor(public auth: AuthService, private tiempoReal: TiempoRealService,
              private notificaciones: NotificacionService, public temas: TemaService) {}

  ngOnInit(): void {
    this.subs.add(this.tiempoReal.estado$.subscribe((e) => (this.estadoTiempoReal = e)));
    this.subs.add(this.tiempoReal.conexiones$.subscribe((n) => (this.conectados = n)));
    this.subs.add(this.tiempoReal
      .de('ABONO_REGISTRADO', 'PRESTAMO_CREADO', 'CAJA_CERRADA', 'MODELO_ENTRENADO', 'TAREA_ACTUALIZADA')
      .subscribe((e) => this.avisar(e)));
    this.tiempoReal.conectar();
  }

  private avisar(e: EventoTiempoReal): void {
    if (Date.now() - new Date(e.fecha).getTime() > ANTIGUEDAD_MAXIMA_AVISO_MS) return;
    if (e.tipo === 'TAREA_ACTUALIZADA') {
      const estado = e.datos['estado'];
      if (estado === 'COMPLETADA') this.notificaciones.exito(e.mensaje);
      else if (estado === 'FALLIDA') this.notificaciones.error(e.mensaje);
      return;
    }
    this.notificaciones.info(e.mensaje);
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
