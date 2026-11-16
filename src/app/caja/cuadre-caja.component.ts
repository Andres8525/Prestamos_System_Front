import { Component, OnInit } from '@angular/core';
import { CobranzaService, hoyISO, mensajeError } from '../services/cobranza.service';
import { Cobrador, CuadreCaja } from '../models/cobranza.model';

/** Balance de caja (cuadre) diario por agente cobrador. */
@Component({
  selector: 'app-cuadre-caja',
  standalone: false,
  templateUrl: './cuadre-caja.component.html'
})
export class CuadreCajaComponent implements OnInit {
  cobradores: Cobrador[] = [];
  cobradorId?: number;
  fecha = hoyISO();
  cuadre: CuadreCaja | null = null;
  historial: CuadreCaja[] = [];
  baseInicial: number | null = null;
  gastos = 0;
  efectivoEntregado: number | null = null;
  observacion = '';
  error = '';
  mensaje = '';

  constructor(private cobranzaService: CobranzaService) {}

  get diferenciaPrevista(): number | null {
    if (this.efectivoEntregado == null || !this.cuadre) return null;
    return Math.round((this.efectivoEntregado - this.cuadre.efectivoEsperado) * 100) / 100;
  }

  ngOnInit(): void {
    this.cobranzaService.obtenerCobradores(true).subscribe({
      next: (d) => {
        this.cobradores = d;
        if (d.length) {
          this.cobradorId = d[0].id;
          this.cambiarCobrador();
        }
      },
      error: (err) => (this.error = mensajeError(err, 'Error al cargar cobradores'))
    });
  }

  cambiarCobrador(): void {
    const c = this.cobradores.find((x) => x.id === this.cobradorId);
    this.baseInicial = c?.cajaBase ?? 0;
    this.consultar();
    this.cargarHistorial();
  }

  consultar(): void {
    if (!this.cobradorId) return;
    this.error = '';
    this.cobranzaService
      .consultarCaja(this.cobradorId, this.fecha, this.baseInicial ?? undefined, this.gastos ?? 0)
      .subscribe({
        next: (c) => (this.cuadre = c),
        error: (err) => (this.error = mensajeError(err, 'Error al consultar la caja'))
      });
  }

  cargarHistorial(): void {
    if (!this.cobradorId) return;
    this.cobranzaService.historialCaja(this.cobradorId).subscribe({ next: (h) => (this.historial = h) });
  }

  cerrarCaja(): void {
    if (!this.cobradorId || this.efectivoEntregado == null) {
      this.error = 'Ingrese el efectivo entregado por el cobrador';
      return;
    }
    if (!confirm('¿Cerrar la caja? Después no se podrán registrar abonos ni desembolsos en esta fecha.')) return;
    this.cobranzaService
      .cerrarCaja({
        cobradorId: this.cobradorId,
        fecha: this.fecha,
        baseInicial: this.baseInicial ?? undefined,
        gastos: this.gastos ?? 0,
        efectivoEntregado: this.efectivoEntregado,
        observacion: this.observacion || undefined
      })
      .subscribe({
        next: (c) => {
          this.cuadre = c;
          this.mensaje = `Caja cerrada: ${c.resultado} (${c.diferencia?.toFixed(2)})`;
          this.efectivoEntregado = null;
          this.observacion = '';
          this.cargarHistorial();
        },
        error: (err) => (this.error = mensajeError(err, 'Error al cerrar la caja'))
      });
  }

  claseResultado(resultado?: string): string {
    return resultado === 'FALTANTE' ? 'estado-atrasado' : resultado === 'SOBRANTE' ? 'estado-pendiente' : 'estado-al_dia';
  }
}
