import { Component, OnInit } from '@angular/core';
import { TiendaService } from '../services/tienda.service';
import { NotificacionService } from '../services/notificacion.service';
import { mensajeError } from '../services/cobranza.service';
import { Producto } from '../models/tienda.model';
import { emojiCategoria } from './tienda.util';

/** Administración del catálogo: alta, edición, inventario y baja de productos. */
@Component({
  selector: 'app-productos-admin',
  standalone: false,
  templateUrl: './productos-admin.component.html'
})
export class ProductosAdminComponent implements OnInit {
  productos: Producto[] = [];
  form: Producto = this.vacio();
  enEdicion: Producto | null = null;
  mostraFormulario = false;
  cargando = false;
  error = '';
  emoji = emojiCategoria;

  constructor(private tiendaService: TiendaService, private notificaciones: NotificacionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  get categorias(): string[] {
    return [...new Set(this.productos.map((p) => p.categoria))].sort();
  }

  cargar(): void {
    this.cargando = true;
    this.tiendaService.obtenerProductos().subscribe({
      next: (p) => {
        this.productos = p;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar los productos');
        this.cargando = false;
      }
    });
  }

  toggleFormulario(): void {
    this.mostraFormulario = !this.mostraFormulario;
    if (!this.mostraFormulario) this.limpiar();
  }

  editar(p: Producto): void {
    this.enEdicion = p;
    this.form = { ...p };
    this.mostraFormulario = true;
  }

  guardar(): void {
    if (!this.form.nombre?.trim() || !this.form.categoria?.trim() || !(this.form.precio > 0) || this.form.stock < 0) {
      this.error = 'Nombre, categoría, precio mayor a cero y stock son obligatorios';
      return;
    }
    const datos: Producto = { ...this.form, imagenUrl: this.form.imagenUrl?.trim() || null };
    const op = this.enEdicion?.id
      ? this.tiendaService.actualizarProducto(this.enEdicion.id, datos)
      : this.tiendaService.crearProducto(datos);
    op.subscribe({
      next: (p) => {
        this.notificaciones.exito(`Producto "${p.nombre}" guardado`);
        this.cargar();
        this.limpiar();
        this.mostraFormulario = false;
      },
      error: (err) => (this.error = mensajeError(err, 'Error al guardar el producto'))
    });
  }

  desactivar(p: Producto): void {
    if (!p.id || !confirm(`¿Retirar "${p.nombre}" del catálogo?`)) return;
    this.tiendaService.desactivarProducto(p.id).subscribe({
      next: () => this.cargar(),
      error: (err) => (this.error = mensajeError(err, 'Error al retirar el producto'))
    });
  }

  reactivar(p: Producto): void {
    if (!p.id) return;
    this.tiendaService.actualizarProducto(p.id, { ...p, activo: true }).subscribe({
      next: () => this.cargar(),
      error: (err) => (this.error = mensajeError(err, 'Error al reactivar el producto'))
    });
  }

  limpiar(): void {
    this.form = this.vacio();
    this.enEdicion = null;
    this.error = '';
  }

  private vacio(): Producto {
    return { nombre: '', descripcion: '', categoria: '', precio: 0, stock: 0, imagenUrl: '', activo: true };
  }
}
