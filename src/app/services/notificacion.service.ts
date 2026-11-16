import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Máximo de avisos visibles a la vez: con eventos en tiempo real se descartan los más antiguos. */
export const MAXIMO_VISIBLES = 4;

/** Avisos emergentes (toasts) que desaparecen solos. Un mismo mensaje repetido no se apila. */
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
    if (this.lista.value.some((n) => n.mensaje === mensaje && n.tipo === tipo)) return;
    const id = ++this.secuencia;
    this.lista.next([...this.lista.value, { id, tipo, mensaje }].slice(-MAXIMO_VISIBLES));
    setTimeout(() => this.cerrar(id), duracionMs);
  }
}
