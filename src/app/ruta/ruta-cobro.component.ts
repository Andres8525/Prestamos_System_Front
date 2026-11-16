import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, debounceTime, filter } from 'rxjs';
import { TiempoRealService } from '../services/tiempo-real.service';
import { CobranzaService, hoyISO, mensajeError } from '../services/cobranza.service';
import { Cobrador, ParadaRuta, RutaCobro } from '../models/cobranza.model';

/** Hoja de ruta diaria del cobrador: registra los abonos de cada cliente visitado. */
@Component({
  selector: 'app-ruta-cobro',
  standalone: false,
  templateUrl: './ruta-cobro.component.html'
})
export class RutaCobroComponent implements OnInit, OnDestroy {
  cobradores: Cobrador[] = [];
  cobradorId?: number;
  fecha = hoyISO();
  ruta: RutaCobro | null = null;
  montos: Record<number, number | null> = {};
  soloConCobro = false;
  /** Orden por urgencia (cobro exigible, días de atraso y monto) calculado con una cola de prioridad en el servidor. */
  priorizar = false;
  cargando = false;
  error = '';
  mensaje = '';

  private subs = new Subscription();

  constructor(private cobranzaService: CobranzaService, private tiempoReal: TiempoRealService) {}

  get esHoy(): boolean {
    return this.fecha === hoyISO();
  }

  get paradas(): ParadaRuta[] {
    const lista = this.ruta?.paradas ?? [];
    return this.soloConCobro ? lista.filter((p) => p.cobraHoy) : lista;
  }

  ngOnInit(): void {
    // Abonos que otro usuario registra para este cobrador actualizan la ruta sin recargar la página.
    this.subs.add(this.tiempoReal.de('ABONO_REGISTRADO', 'PRESTAMO_CREADO')
      .pipe(filter((e) => this.esHoy && Number(e.datos['cobradorId']) === this.cobradorId), debounceTime(400))
      .subscribe(() => this.cargarRuta()));
    this.cobranzaService.obtenerCobradores(true).subscribe({
      next: (d) => {
        this.cobradores = d;
        if (d.length && !this.cobradorId) {
          this.cobradorId = d[0].id;
          this.cargarRuta();
        }
      },
      error: (err) => (this.error = mensajeError(err, 'Error al cargar cobradores'))
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargarRuta(): void {
    if (!this.cobradorId) return;
    this.cargando = true;
    const consulta = this.priorizar
      ? this.cobranzaService.obtenerRutaPriorizada(this.cobradorId, this.fecha)
      : this.cobranzaService.obtenerRuta(this.cobradorId, this.fecha);
    consulta.subscribe({
      next: (r) => {
        this.ruta = r;
        this.montos = {};
        r.paradas.forEach((p) => (this.montos[p.prestamoId] = p.montoExigible > 0 ? Math.min(p.valorCuota, p.montoExigible) : null));
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar la ruta');
        this.cargando = false;
      }
    });
  }

  registrarAbono(p: ParadaRuta): void {
    const monto = Number(this.montos[p.prestamoId]);
    if (!monto || monto <= 0) {
      this.error = 'Ingrese un monto válido';
      return;
    }
    this.error = '';
    this.cobranzaService.registrarAbono(p.prestamoId, monto, this.cobradorId).subscribe({
      next: (a) => {
        this.mensaje = `Abono de ${a.monto.toFixed(2)} registrado a ${a.clienteNombre}. `
          + `Cuotas cubiertas: ${a.cuotasCubiertas}. Saldo: ${a.saldoPrestamo?.toFixed(2)}`
          + (a.incompleto ? ' (abono incompleto)' : '');
        this.cargarRuta();
      },
      error: (err) => (this.error = mensajeError(err, 'Error al registrar el abono'))
    });
  }

  getEstadoClass(estado: string): string {
    return `estado-${estado.toLowerCase()}`;
  }
}
