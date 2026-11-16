import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { PeticionCsv, generarCsv } from '../workers/csv';
import { PeticionProyeccion, ResultadoProyeccion, proyectarRecaudo } from '../workers/proyeccion';

/**
 * Ejecuta cálculos pesados en Web Workers (otro hilo del navegador) para que la interfaz no se congele.
 * Si el navegador no soporta workers (o en pruebas), usa la misma función pura en el hilo principal.
 * Cada ejecución crea un worker y lo termina al recibir el resultado o al cancelar la suscripción.
 */
@Injectable({ providedIn: 'root' })
export class WebWorkerService {
  constructor(private zone: NgZone) {}

  get disponible(): boolean {
    return typeof Worker !== 'undefined';
  }

  /** Genera un CSV en segundo plano. */
  csv(peticion: PeticionCsv): Observable<string> {
    return this.ejecutar(
      () => new Worker(new URL('../workers/csv.worker', import.meta.url), { type: 'module' }),
      peticion,
      generarCsv
    );
  }

  /** Simulación Monte Carlo del recaudo; {@code alAvanzar} recibe el avance entre 0 y 1. */
  proyeccion(peticion: PeticionProyeccion, alAvanzar?: (fraccion: number) => void): Observable<ResultadoProyeccion> {
    return this.ejecutar(
      () => new Worker(new URL('../workers/proyeccion.worker', import.meta.url), { type: 'module' }),
      peticion,
      (p) => proyectarRecaudo(p, alAvanzar),
      alAvanzar
    );
  }

  /**
   * Protocolo: el worker puede enviar mensajes {@code {__progreso: n}} y finalmente el resultado.
   */
  private ejecutar<E, S>(crear: () => Worker, entrada: E, respaldo: (e: E) => S,
                         alAvanzar?: (fraccion: number) => void): Observable<S> {
    return new Observable<S>((obs) => {
      if (!this.disponible) {
        // Respaldo asíncrono para que el llamador siempre reciba el resultado después de suscribirse.
        const id = setTimeout(() => {
          try {
            obs.next(respaldo(entrada));
            obs.complete();
          } catch (e) {
            obs.error(e);
          }
        });
        return () => clearTimeout(id);
      }
      const worker = crear();
      worker.onmessage = ({ data }: MessageEvent) => {
        this.zone.run(() => {
          if (data && typeof data === 'object' && '__progreso' in data) {
            alAvanzar?.(data.__progreso as number);
            return;
          }
          obs.next(data as S);
          obs.complete();
        });
      };
      worker.onerror = (e) => this.zone.run(() => obs.error(new Error(e.message || 'Falló el Web Worker')));
      worker.postMessage(entrada);
      return () => worker.terminate();
    });
  }
}

/** Descarga un texto como archivo desde el navegador. */
export function descargarArchivo(nombre: string, contenido: string, tipo = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
