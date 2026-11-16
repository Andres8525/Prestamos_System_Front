import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, catchError, finalize, interval, map, of, shareReplay, timeout, timer } from 'rxjs';
import { environment } from '../environments/environment';

/** Estado de la conexión con el backend. */
export type EstadoServidor = 'comprobando' | 'despertando' | 'en-linea' | 'sin-conexion';

/** Cada cuánto se llama al servidor mientras la app está abierta (Render lo suspende a los 15 min sin tráfico). */
export const INTERVALO_LATIDO_MS = environment.latidoServidorMs ?? 4 * 60 * 1000;
/** Si el primer ping tarda más que esto, el servidor se está despertando. */
const UMBRAL_DESPERTANDO_MS = 3000;
const ESPERA_DESPERTAR_MS = 70000;
/** Sin conexión se reintenta seguido para que el aviso se quite solo en cuanto el servidor responda. */
export const REINTENTO_SIN_CONEXION_MS = 15000;

/**
 * Mantiene despierto el backend desde el navegador:
 * - al abrir la app hace un ping inmediato (si el servidor estaba suspendido empieza a arrancar
 *   mientras el usuario escribe su email);
 * - mientras la pestaña está visible repite el ping cada pocos minutos.
 * Complementa al keep-alive del propio backend y al workflow de GitHub Actions.
 */
@Injectable({ providedIn: 'root' })
export class ServidorService implements OnDestroy {
  private estadoSubject = new BehaviorSubject<EstadoServidor>('comprobando');
  readonly estado$ = this.estadoSubject.asObservable();
  private latido?: Subscription;
  private enCurso?: Observable<boolean>;
  private ultimoPing = 0;

  constructor(private http: HttpClient, private zone: NgZone) {}

  get estado(): EstadoServidor {
    return this.estadoSubject.value;
  }

  /**
   * Hace ping al servidor. Emite true si respondió dentro de la espera indicada.
   * Las llamadas simultáneas comparten la misma petición.
   */
  despertar(esperaMs = ESPERA_DESPERTAR_MS): Observable<boolean> {
    if (this.enCurso) return this.enCurso;
    this.ultimoPing = Date.now();
    if (this.estado !== 'en-linea') this.estadoSubject.next('comprobando');
    const aviso = timer(UMBRAL_DESPERTANDO_MS).subscribe(() => {
      if (this.estado === 'comprobando') this.estadoSubject.next('despertando');
    });
    this.enCurso = this.http.get(`${environment.apiUrl}/ping`).pipe(
      timeout(esperaMs),
      map(() => true),
      catchError(() => of(false)),
      map((ok) => {
        this.estadoSubject.next(ok ? 'en-linea' : 'sin-conexion');
        return ok;
      }),
      finalize(() => {
        aviso.unsubscribe();
        this.enCurso = undefined;
      }),
      shareReplay(1)
    );
    return this.enCurso;
  }

  /**
   * Inicia el ping periódico (idempotente). En línea llama cada INTERVALO_LATIDO_MS;
   * sin conexión reintenta cada REINTENTO_SIN_CONEXION_MS. Corre fuera de Angular.
   */
  iniciarLatido(): void {
    if (this.latido) return;
    this.despertar().subscribe();
    this.zone.runOutsideAngular(() => {
      this.latido = interval(REINTENTO_SIN_CONEXION_MS).subscribe(() => {
        const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
        const vencido = Date.now() - this.ultimoPing >= INTERVALO_LATIDO_MS;
        if (visible && (this.estado === 'sin-conexion' || vencido)) {
          this.despertar().subscribe((ok) => this.zone.run(() => ok));
        }
      });
    });
  }

  detenerLatido(): void {
    this.latido?.unsubscribe();
    this.latido = undefined;
  }

  ngOnDestroy(): void {
    this.detenerLatido();
  }
}
