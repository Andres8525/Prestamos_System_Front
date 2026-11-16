import { Component, OnInit } from '@angular/core';
import { TiendaService } from '../services/tienda.service';
import { CarritoService } from '../services/carrito.service';
import { NotificacionService } from '../services/notificacion.service';
import { mensajeError } from '../services/cobranza.service';
import { Producto } from '../models/tienda.model';
import { claseCategoria, emojiCategoria } from './tienda.util';

/** Catálogo de la tienda: búsqueda, filtro por categoría y agregar al carrito. */
@Component({
  selector: 'app-catalogo',
  standalone: false,
  templateUrl: './catalogo.component.html'
})
export class CatalogoComponent implements OnInit {
  productos: Producto[] = [];
  categorias: string[] = [];
  categoria = '';
  busqueda = '';
  cargando = false;
  error = '';
  /** Producto recién agregado (para animar su botón). */
  recienAgregado: number | null = null;

  emoji = emojiCategoria;
  clase = claseCategoria;

  constructor(
    private tiendaService: TiendaService,
    public carrito: CarritoService,
    private notificaciones: NotificacionService
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    this.tiendaService.obtenerProductos(true).subscribe({
      next: (productos) => {
        this.productos = productos;
        this.categorias = [...new Set(productos.map((p) => p.categoria))].sort();
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'No se pudo cargar el catálogo');
        this.cargando = false;
      }
    });
  }

  get filtrados(): Producto[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.productos.filter(
      (p) =>
        (!this.categoria || p.categoria === this.categoria) &&
        (!texto || p.nombre.toLowerCase().includes(texto) || (p.descripcion ?? '').toLowerCase().includes(texto))
    );
  }

  disponible(p: Producto): number {
    return p.stock - this.carrito.cantidadDe(p.id);
  }

  agregar(p: Producto): void {
    if (!this.carrito.agregar(p)) {
      this.notificaciones.info(`No hay más unidades de ${p.nombre}`);
      return;
    }
    this.recienAgregado = p.id ?? null;
    setTimeout(() => (this.recienAgregado = null), 450);
    this.notificaciones.exito(`${p.nombre} agregado al carrito`);
  }
}
