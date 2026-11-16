import { Component, OnInit } from '@angular/core';
import { PrestamoService } from '../services/prestamo.service';
import { ClienteService } from '../services/cliente.service';
import { CobranzaService, mensajeError } from '../services/cobranza.service';
import { Prestamo, SimulacionPrestamo, SolicitudPrestamo, TipoLiquidacion } from '../models/prestamo.model';
import { Cliente } from '../models/cliente.model';
import { WebWorkerService, descargarArchivo } from '../services/web-worker.service';
import { Cobrador, Scoring } from '../models/cobranza.model';

@Component({
  selector: 'app-list-prestamos',
  standalone: false,
  templateUrl: './list-prestamos.component.html',
  styleUrls: ['./list-prestamos.component.css']
})
export class ListPrestamosComponent implements OnInit {
  prestamos: Prestamo[] = [];
  clientes: Cliente[] = [];
  cobradores: Cobrador[] = [];
  solicitud: SolicitudPrestamo = this.solicitudVacia();
  simulacion: SimulacionPrestamo | null = null;
  scoring: Scoring | null = null;
  cargandoScoring = false;
  /** Alerta de la IA devuelta por el backend (HTTP 409) al intentar renovar con riesgo alto. */
  alertaRiesgo: string | null = null;
  mostraFormulario = false;
  cargando = false;
  guardando = false;
  error = '';
  filtroEstado = '';
  exportando = false;
  tiposLiquidacion = Object.values(TipoLiquidacion) as TipoLiquidacion[];

  constructor(
    private prestamoService: PrestamoService,
    private clienteService: ClienteService,
    private cobranzaService: CobranzaService,
    private workers: WebWorkerService
  ) {}

  /** Exporta los préstamos filtrados a CSV (generado en un Web Worker). */
  exportarCsv(): void {
    this.exportando = true;
    this.workers.csv({
      columnas: [
        { clave: 'id', titulo: 'ID' }, { clave: 'clienteNombre', titulo: 'Cliente' },
        { clave: 'cobradorNombre', titulo: 'Cobrador' }, { clave: 'tipoLiquidacion', titulo: 'Liquidación' },
        { clave: 'monto', titulo: 'Monto' }, { clave: 'montoTotal', titulo: 'Total a pagar' },
        { clave: 'saldoPendiente', titulo: 'Saldo' }, { clave: 'cuotasPagadas', titulo: 'Cuotas pagadas' },
        { clave: 'cuotasPendientes', titulo: 'Cuotas pendientes' }, { clave: 'estado', titulo: 'Estado' },
        { clave: 'nivelRiesgo', titulo: 'Riesgo' }, { clave: 'probabilidadDefault', titulo: 'Prob. incumplimiento' },
        { clave: 'fechaInicio', titulo: 'Inicio' }, { clave: 'fechaVencimiento', titulo: 'Vencimiento' }
      ],
      filas: this.prestamosFiltrados as unknown as Record<string, unknown>[]
    }).subscribe({
      next: (csv) => descargarArchivo(`prestamos-${new Date().toISOString().slice(0, 10)}.csv`, csv),
      error: () => (this.error = 'No se pudo generar el CSV'),
      complete: () => (this.exportando = false)
    });
  }

  ngOnInit(): void {
    this.cargarPrestamos();
    this.clienteService.obtenerClientes().subscribe({ next: (d) => (this.clientes = d) });
    this.cobranzaService.obtenerCobradores(true).subscribe({ next: (d) => (this.cobradores = d) });
  }

  get prestamosFiltrados(): Prestamo[] {
    return this.filtroEstado ? this.prestamos.filter((p) => p.estado === this.filtroEstado) : this.prestamos;
  }

  get esRenovacion(): boolean {
    return !!this.solicitud.clienteId && this.prestamos.some((p) => p.clienteId === this.solicitud.clienteId);
  }

  cargarPrestamos(): void {
    this.cargando = true;
    this.prestamoService.obtenerPrestamos().subscribe({
      next: (data) => {
        this.prestamos = data.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar los préstamos');
        this.cargando = false;
      }
    });
  }

  toggleFormulario(): void {
    this.mostraFormulario = !this.mostraFormulario;
    if (!this.mostraFormulario) this.limpiarFormulario();
  }

  onClienteChange(): void {
    this.scoring = null;
    this.alertaRiesgo = null;
    const cliente = this.clientes.find((c) => c.id === this.solicitud.clienteId);
    this.solicitud.cobradorId = cliente?.cobradorId ?? undefined;
    if (!this.solicitud.clienteId) return;
    this.cargandoScoring = true;
    this.cobranzaService.evaluarCliente(this.solicitud.clienteId).subscribe({
      next: (s) => {
        this.scoring = s;
        this.cargandoScoring = false;
      },
      error: () => (this.cargandoScoring = false)
    });
    this.simular();
  }

  onTipoChange(): void {
    this.solicitud.numeroCuotas = this.solicitud.tipoLiquidacion === TipoLiquidacion.DIARIO ? 40 : 4;
    this.simular();
  }

  /** Cálculo automático de intereses y cuota en el backend. */
  simular(): void {
    if (!this.solicitud.monto || this.solicitud.monto <= 0 || !this.solicitud.clienteId) {
      this.simulacion = null;
      return;
    }
    this.prestamoService.simularPrestamo(this.solicitud).subscribe({
      next: (s) => (this.simulacion = s),
      error: () => (this.simulacion = null)
    });
  }

  guardarPrestamo(forzar = false): void {
    if (!this.solicitud.clienteId || !this.solicitud.monto || !this.solicitud.tipoLiquidacion) {
      this.error = 'Seleccione cliente, monto y tipo de liquidación';
      return;
    }
    this.error = '';
    this.guardando = true;
    this.prestamoService.crearPrestamo({ ...this.solicitud, forzarAprobacion: forzar }).subscribe({
      next: () => {
        this.guardando = false;
        this.cargarPrestamos();
        this.limpiarFormulario();
        this.mostraFormulario = false;
      },
      error: (err) => {
        this.guardando = false;
        if (err.status === 409 && err.error?.requiereConfirmacion) {
          this.alertaRiesgo = err.error.error;
          this.scoring = err.error.scoring;
        } else {
          this.error = mensajeError(err, 'Error al crear el préstamo');
        }
      }
    });
  }

  eliminarPrestamo(id: number | undefined): void {
    if (!id || !confirm('¿Está seguro de que desea eliminar este préstamo y sus abonos?')) return;
    this.prestamoService.eliminarPrestamo(id).subscribe({
      next: () => this.cargarPrestamos(),
      error: (err) => (this.error = mensajeError(err, 'Error al eliminar el préstamo'))
    });
  }

  actualizarEstados(): void {
    this.prestamoService.actualizarEstados().subscribe({
      next: () => this.cargarPrestamos(),
      error: (err) => (this.error = mensajeError(err, 'Error al actualizar estados'))
    });
  }

  limpiarFormulario(): void {
    this.solicitud = this.solicitudVacia();
    this.simulacion = null;
    this.scoring = null;
    this.alertaRiesgo = null;
    this.error = '';
  }

  progreso(p: Prestamo): number {
    const total = p.numeroCuotas || (p.cuotasPagadas ?? 0) + (p.cuotasPendientes ?? 0);
    return total ? Math.round(((p.cuotasPagadas ?? 0) / total) * 100) : 0;
  }

  getEstadoClass(estado: string): string {
    return `estado-${estado.toLowerCase()}`;
  }

  private solicitudVacia(): SolicitudPrestamo {
    return { tipoLiquidacion: TipoLiquidacion.DIARIO, tasaInteres: 20, numeroCuotas: 40 };
  }
}
