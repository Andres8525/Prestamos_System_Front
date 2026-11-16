import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, debounceTime } from 'rxjs';
import { PagoService } from '../services/pago.service';
import { NotificacionService } from '../services/notificacion.service';
import { TiempoRealService } from '../services/tiempo-real.service';
import { CuotasCliente, Pago } from '../models/pago.model';
import { hoyISO, mensajeError } from '../services/cobranza.service';

/** Cuotas agrupadas por cliente: la lista muestra solo los clientes y cada uno despliega sus cuotas pendientes. */
@Component({
  selector: 'app-list-pagos',
  standalone: false,
  templateUrl: './list-pagos.component.html',
  styleUrls: ['./list-pagos.component.css']
})
export class ListPagosComponent implements OnInit, OnDestroy {
  clientes: CuotasCliente[] = [];
  busqueda = '';
  soloAtrasados = false;
  cargando = false;
  error = '';

  abierto: number | null = null;
  cuotas: Pago[] = [];
  cargandoCuotas = false;
  pagando: number | null = null;

  private subs = new Subscription();

  constructor(
    private pagoService: PagoService,
    private avisos: NotificacionService,
    private tiempoReal: TiempoRealService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.subs.add(this.tiempoReal.de('ABONO_REGISTRADO', 'PRESTAMO_CREADO').pipe(debounceTime(300))
      .subscribe(() => this.cargar(true)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get visibles(): CuotasCliente[] {
    const texto = normalizar(this.busqueda);
    return this.clientes.filter((c) =>
      (!this.soloAtrasados || c.cuotasAtrasadas > 0)
      && (!texto || normalizar(c.clienteNombre).includes(texto) || c.cedula?.includes(texto)));
  }

  get totalPendientes(): number {
    return this.clientes.reduce((t, c) => t + c.cuotasPendientes, 0);
  }

  get clientesConAtraso(): number {
    return this.clientes.filter((c) => c.cuotasAtrasadas > 0).length;
  }

  /** Recarga la lista; en silencio (sin esqueleto) cuando llega un evento en vivo. */
  cargar(silencioso = false): void {
    if (!silencioso) this.cargando = true;
    this.pagoService.obtenerResumenPorCliente().subscribe({
      next: (data) => {
        this.clientes = data;
        this.cargando = false;
        if (this.abierto !== null) {
          if (data.some((c) => c.clienteId === this.abierto)) this.cargarCuotas(this.abierto, true);
          else this.abierto = null;
        }
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar las cuotas');
        this.cargando = false;
      }
    });
  }

  alternar(cliente: CuotasCliente): void {
    if (this.abierto === cliente.clienteId) {
      this.abierto = null;
      return;
    }
    this.abierto = cliente.clienteId;
    this.cuotas = [];
    this.cargarCuotas(cliente.clienteId);
  }

  registrarPago(cuota: Pago, cliente: CuotasCliente): void {
    if (!cuota.id || this.pagando) return;
    this.pagando = cuota.id;
    this.pagoService.marcarPagoRealizado(cuota.id).subscribe({
      next: () => {
        this.pagando = null;
        this.avisos.exito(`Cuota ${cuota.numero} de ${cliente.clienteNombre} pagada`);
        this.cargar(true);
      },
      error: (err) => {
        this.pagando = null;
        this.avisos.error(mensajeError(err, 'No se pudo registrar el pago'));
      }
    });
  }

  vencida(cuota: Pago): boolean {
    return String(cuota.fechaProgramada) < hoyISO();
  }

  /** Situación de una cuota sin pagar según su fecha (el campo estado del backend mide puntualidad). */
  situacion(cuota: Pago): { texto: string; clase: string } {
    const fecha = String(cuota.fechaProgramada);
    const hoy = hoyISO();
    if (fecha < hoy) return { texto: 'Vencida', clase: 'estado-atrasado' };
    if (fecha === hoy) return { texto: 'Vence hoy', clase: 'estado-pendiente' };
    return { texto: 'Por vencer', clase: 'estado-al_dia' };
  }

  private cargarCuotas(clienteId: number, silencioso = false): void {
    if (!silencioso) this.cargandoCuotas = true;
    this.pagoService.obtenerPendientesDeCliente(clienteId).subscribe({
      next: (data) => {
        if (this.abierto !== clienteId) return;
        this.cuotas = data;
        this.cargandoCuotas = false;
      },
      error: (err) => {
        this.cargandoCuotas = false;
        this.avisos.error(mensajeError(err, 'No se pudieron cargar las cuotas del cliente'));
      }
    });
  }
}

function normalizar(texto: string): string {
  return (texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
