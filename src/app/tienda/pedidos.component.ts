import { Component, OnInit } from '@angular/core';
import { TiendaService } from '../services/tienda.service';
import { mensajeError } from '../services/cobranza.service';
import { Pedido } from '../models/tienda.model';

/** Historial de pedidos de la tienda con el detalle de cada venta. */
@Component({
  selector: 'app-pedidos',
  standalone: false,
  templateUrl: './pedidos.component.html'
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  abierto: number | null = null;
  cargando = false;
  error = '';

  constructor(private tiendaService: TiendaService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.tiendaService.obtenerPedidos().subscribe({
      next: (p) => {
        this.pedidos = p;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar los pedidos');
        this.cargando = false;
      }
    });
  }

  get totalVendido(): number {
    return Math.round(this.pedidos.reduce((t, p) => t + p.total, 0) * 100) / 100;
  }

  get ventasCredito(): number {
    return this.pedidos.filter((p) => p.tipoPago === 'CREDITO').length;
  }

  alternar(id: number): void {
    this.abierto = this.abierto === id ? null : id;
  }
}
