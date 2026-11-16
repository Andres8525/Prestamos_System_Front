import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, debounceTime, timer } from 'rxjs';
import { TiempoRealService } from '../services/tiempo-real.service';
import { WorkersService } from '../services/workers.service';
import { PrestamoService } from '../services/prestamo.service';
import { NotificacionService } from '../services/notificacion.service';
import { WebWorkerService, descargarArchivo } from '../services/web-worker.service';
import { mensajeError } from '../services/cobranza.service';
import { ESTADOS_ACTIVOS, EstadoPool, Tarea, TipoTareaInfo } from '../models/workers.model';
import { PrestamoProyeccion, ResultadoProyeccion } from '../workers/proyeccion';
import { EstadoPago } from '../models/prestamo.model';

/** Respaldo por si el WebSocket no está conectado: consulta periódica más lenta. */
const REFRESCO_ACTIVO_MS = 3000;
const REFRESCO_REPOSO_MS = 20000;

/**
 * Procesos en segundo plano:
 * - workers del backend (cola con prioridad, reintentos y resultados descargables);
 * - Web Worker del navegador para la proyección Monte Carlo del recaudo.
 */
@Component({
  selector: 'app-procesos',
  standalone: false,
  templateUrl: './procesos.component.html'
})
export class ProcesosComponent implements OnInit, OnDestroy {
  pool: EstadoPool | null = null;
  tareas: Tarea[] = [];
  error = '';
  encolando: string | null = null;
  prioridad = 5;

  // Proyección Monte Carlo (Web Worker)
  escenarios = 50000;
  recuperacion = 0.35;
  proyectando = false;
  avance = 0;
  proyeccion: ResultadoProyeccion | null = null;
  errorProyeccion = '';
  private prestamos: PrestamoProyeccion[] | null = null;
  private calculo?: Subscription;

  private refresco?: Subscription;
  private enVivo = false;
  private subs = new Subscription();

  constructor(
    private workers: WorkersService,
    private prestamoService: PrestamoService,
    private webWorkers: WebWorkerService,
    private notificaciones: NotificacionService,
    private tiempoReal: TiempoRealService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.tiempoReal.estado$.subscribe((e) => (this.enVivo = e === 'conectado')));
    this.subs.add(this.tiempoReal.de('TAREA_ACTUALIZADA').pipe(debounceTime(150)).subscribe(() => this.cargar()));
    this.cargar();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.refresco?.unsubscribe();
    this.calculo?.unsubscribe();
  }

  get actualizacionEnVivo(): boolean {
    return this.enVivo;
  }

  get hayActivas(): boolean {
    return this.tareas.some((t) => ESTADOS_ACTIVOS.includes(t.estado));
  }

  get webWorkersDisponibles(): boolean {
    return this.webWorkers.disponible;
  }

  /** Carga estado y tareas; se reprograma más seguido mientras haya tareas activas. */
  cargar(): void {
    this.refresco?.unsubscribe();
    this.workers.estado().subscribe({
      next: (p) => (this.pool = p),
      error: (err) => (this.error = mensajeError(err, 'No se pudo consultar el estado de los workers'))
    });
    this.workers.tareas().subscribe({
      next: (t) => {
        this.tareas = t;
        this.error = '';
        if (!this.enVivo) {
          this.refresco = timer(this.hayActivas ? REFRESCO_ACTIVO_MS : REFRESCO_REPOSO_MS).subscribe(() => this.cargar());
        }
      },
      error: (err) => {
        this.error = mensajeError(err, 'No se pudieron cargar las tareas');
        this.refresco = timer(REFRESCO_REPOSO_MS).subscribe(() => this.cargar());
      }
    });
  }

  encolar(tipo: TipoTareaInfo): void {
    this.encolando = tipo.tipo;
    this.workers.encolar(tipo.tipo, this.prioridad).subscribe({
      next: (t) => {
        this.encolando = null;
        this.notificaciones.info(`"${t.nombre}" quedó en la cola (#${t.id})`);
        if (!this.enVivo) this.cargar();
      },
      error: (err) => {
        this.encolando = null;
        this.notificaciones.error(mensajeError(err, 'No se pudo encolar la tarea'));
      }
    });
  }

  cancelar(t: Tarea): void {
    this.workers.cancelar(t.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.notificaciones.error(mensajeError(err, 'No se pudo cancelar'))
    });
  }

  reintentar(t: Tarea): void {
    this.workers.reintentar(t.id).subscribe({
      next: () => this.cargar(),
      error: (err) => this.notificaciones.error(mensajeError(err, 'No se pudo reintentar'))
    });
  }

  descargar(t: Tarea): void {
    this.workers.resultado(t.id).subscribe({
      next: (contenido) => {
        const csv = t.tipo === 'REPORTE_CARTERA';
        descargarArchivo(csv ? `reporte-cartera-${t.id}.csv` : `informe-ia-${t.id}.md`,
          csv ? '﻿' + contenido : contenido, csv ? 'text/csv;charset=utf-8' : 'text/markdown;charset=utf-8');
      },
      error: (err) => this.notificaciones.error(mensajeError(err, 'No se pudo descargar el resultado'))
    });
  }

  claseEstado(t: Tarea): string {
    return 'tarea-' + t.estado.toLowerCase().replace('_', '-');
  }

  // ---------------------------------------------------------------- proyección (Web Worker)

  proyectar(): void {
    this.errorProyeccion = '';
    if (this.prestamos) {
      this.ejecutarProyeccion(this.prestamos);
      return;
    }
    this.proyectando = true;
    this.prestamoService.obtenerPrestamos().subscribe({
      next: (lista) => {
        this.prestamos = lista
          .filter((p) => p.estado !== EstadoPago.PAGADO && (p.saldoPendiente ?? 0) > 0)
          .map((p) => ({ saldo: p.saldoPendiente ?? 0, probabilidad: p.probabilidadDefault ?? NaN }));
        this.ejecutarProyeccion(this.prestamos);
      },
      error: (err) => {
        this.proyectando = false;
        this.errorProyeccion = mensajeError(err, 'No se pudieron cargar los préstamos');
      }
    });
  }

  cancelarProyeccion(): void {
    this.calculo?.unsubscribe();
    this.proyectando = false;
  }

  private ejecutarProyeccion(prestamos: PrestamoProyeccion[]): void {
    if (!prestamos.length) {
      this.proyectando = false;
      this.errorProyeccion = 'No hay préstamos activos con saldo para proyectar.';
      return;
    }
    this.proyectando = true;
    this.avance = 0;
    this.calculo?.unsubscribe();
    this.calculo = this.webWorkers
      .proyeccion({ prestamos, escenarios: this.escenarios, recuperacionEnMora: this.recuperacion,
                    probabilidadPorDefecto: 0.15 }, (f) => (this.avance = f))
      .subscribe({
        next: (r) => {
          this.proyeccion = r;
          this.proyectando = false;
          this.avance = 1;
        },
        error: (e: Error) => {
          this.proyectando = false;
          this.errorProyeccion = e.message;
        }
      });
  }

  get maxHistograma(): number {
    return Math.max(1, ...(this.proyeccion?.histograma.map((b) => b.frecuencia) ?? [1]));
  }
}
