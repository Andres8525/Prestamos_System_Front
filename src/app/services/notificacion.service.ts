import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Avisos emergentes (toasts) que desaparecen solos. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private secuencia = 0;
  private lista = new BehaviorSubject<Notificacion[]>([]);
  readonly notificaciones$ = this.lista.asObservable();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje, 6000);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number): void {
    this.lista.next(this.lista.value.filter((n) => n.id !== id));
  }

  private mostrar(tipo: TipoNotificacion, mensaje: string, duracionMs = 4000): void {
    const id = ++this.secuencia;
    this.lista.next([...this.lista.value, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }
}
