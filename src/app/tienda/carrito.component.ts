import { Component, OnInit } from '@angular/core';
import { TiendaService } from '../services/tienda.service';
import { CarritoService } from '../services/carrito.service';
import { ClienteService } from '../services/cliente.service';
import { PrestamoService } from '../services/prestamo.service';
import { CobranzaService, mensajeError } from '../services/cobranza.service';
import { NotificacionService } from '../services/notificacion.service';
import { Cliente } from '../models/cliente.model';
import { Cobrador, Scoring } from '../models/cobranza.model';
import { SimulacionPrestamo, TipoLiquidacion } from '../models/prestamo.model';
import { ItemCarrito, Pedido, TipoPago } from '../models/tienda.model';
import { claseCategoria, emojiCategoria } from './tienda.util';

/** Carrito y pago: al contado o a crédito (genera un préstamo con evaluación de riesgo por IA). */
@Component({
  selector: 'app-carrito',
  standalone: false,
  templateUrl: './carrito.component.html'
})
export class CarritoComponent implements OnInit {
  clientes: Cliente[] = [];
  cobradores: Cobrador[] = [];
  clienteId?: number;
  cobradorId?: number;
  tipoPago: TipoPago = 'CONTADO';
  tipoLiquidacion: TipoLiquidacion = TipoLiquidacion.DIARIO;
  numeroCuotas = 30;
  tasaInteres = 20;

  simulacion: SimulacionPrestamo | null = null;
  scoring: Scoring | null = null;
  alertaRiesgo: string | null = null;
  pedido: Pedido | null = null;
  enviando = false;
  error = '';

  tipos = Object.values(TipoLiquidacion) as TipoLiquidacion[];
  emoji = emojiCategoria;
  clase = claseCategoria;

  constructor(
    public carrito: CarritoService,
    private tiendaService: TiendaService,
    private clienteService: ClienteService,
    private prestamoService: PrestamoService,
    private cobranzaService: CobranzaService,
    private notificaciones: NotificacionService
  ) {}

  ngOnInit(): void {
    this.clienteService.obtenerClientes().subscribe({ next: (c) => (this.clientes = c) });
    this.cobranzaService.obtenerCobradores(true).subscribe({ next: (c) => (this.cobradores = c) });
  }

  cambiarCantidad(item: ItemCarrito, delta: number): void {
    this.carrito.fijarCantidad(item.producto, item.cantidad + delta);
    this.simular();
  }

  quitar(item: ItemCarrito): void {
    this.carrito.quitar(item.producto.id);
    this.simular();
  }

  elegirPago(tipo: TipoPago): void {
    this.tipoPago = tipo;
    this.alertaRiesgo = null;
    this.simular();
  }

  onClienteChange(): void {
    this.scoring = null;
    this.alertaRiesgo = null;
    const cliente = this.clientes.find((c) => c.id === this.clienteId);
    this.cobradorId = cliente?.cobradorId ?? undefined;
    if (this.clienteId) {
      this.cobranzaService.evaluarCliente(this.clienteId).subscribe({ next: (s) => (this.scoring = s) });
    }
    this.simular();
  }

  onTipoLiquidacionChange(): void {
    this.numeroCuotas = this.tipoLiquidacion === TipoLiquidacion.DIARIO ? 30 : 4;
    this.simular();
  }

  /** Calcula en el servidor el interés y la cuota del crédito para el total del carrito. */
  simular(): void {
    if (this.tipoPago !== 'CREDITO' || !this.clienteId || this.carrito.total <= 0) {
      this.simulacion = null;
      return;
    }
    this.prestamoService
      .simularPrestamo({
        clienteId: this.clienteId,
        monto: this.carrito.total,
        tipoLiquidacion: this.tipoLiquidacion,
        numeroCuotas: this.numeroCuotas,
        tasaInteres: this.tasaInteres
      })
      .subscribe({ next: (s) => (this.simulacion = s), error: () => (this.simulacion = null) });
  }

  confirmar(forzar = false): void {
    this.error = '';
    if (!this.carrito.items.length) return;
    if (!this.clienteId) {
      this.error = 'Selecciona el cliente que realiza la compra';
      return;
    }
    const credito = this.tipoPago === 'CREDITO';
    this.enviando = true;
    this.tiendaService
      .crearPedido({
        clienteId: this.clienteId,
        tipoPago: this.tipoPago,
        items: this.carrito.items.map((i) => ({ productoId: i.producto.id!, cantidad: i.cantidad })),
        tipoLiquidacion: credito ? this.tipoLiquidacion : undefined,
        numeroCuotas: credito ? this.numeroCuotas : undefined,
        tasaInteres: credito ? this.tasaInteres : undefined,
        cobradorId: credito ? this.cobradorId : undefined,
        forzarAprobacion: forzar
      })
      .subscribe({
        next: (pedido) => {
          this.enviando = false;
          this.pedido = pedido;
          this.carrito.vaciar();
          this.notificaciones.exito(`Pedido #${pedido.id} registrado`);
        },
        error: (err) => {
          this.enviando = false;
          if (err.status === 409 && err.error?.requiereConfirmacion) {
            this.alertaRiesgo = err.error.error;
            this.scoring = err.error.scoring;
          } else {
            this.error = mensajeError(err, 'No se pudo registrar el pedido');
          }
        }
      });
  }
}
