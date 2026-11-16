import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ItemCarrito, Producto } from '../models/tienda.model';

const CLAVE_CARRITO = 'crediruta.carrito';

/** Carrito de compras de la tienda. Se conserva en el navegador entre recargas. */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private itemsSubject = new BehaviorSubject<ItemCarrito[]>(this.leer());
  readonly items$ = this.itemsSubject.asObservable();

  get items(): ItemCarrito[] {
    return this.itemsSubject.value;
  }

  get unidades(): number {
    return this.items.reduce((t, i) => t + i.cantidad, 0);
  }

  get total(): number {
    return Math.round(this.items.reduce((t, i) => t + i.producto.precio * i.cantidad, 0) * 100) / 100;
  }

  cantidadDe(productoId: number | undefined): number {
    return this.items.find((i) => i.producto.id === productoId)?.cantidad ?? 0;
  }

  /** Agrega unidades sin superar el stock. Devuelve false si ya no hay más disponibles. */
  agregar(producto: Producto, cantidad = 1): boolean {
    const actual = this.cantidadDe(producto.id);
    const nueva = Math.min(producto.stock, actual + cantidad);
    if (nueva === actual) return false;
    this.fijarCantidad(producto, nueva);
    return true;
  }

  fijarCantidad(producto: Producto, cantidad: number): void {
    const limite = Math.max(0, Math.min(producto.stock, Math.floor(cantidad) || 0));
    const resto = this.items.filter((i) => i.producto.id !== producto.id);
    const existia = this.items.some((i) => i.producto.id === producto.id);
    if (limite === 0) {
      this.guardar(resto);
    } else if (existia) {
      this.guardar(this.items.map((i) => (i.producto.id === producto.id ? { producto, cantidad: limite } : i)));
    } else {
      this.guardar([...resto, { producto, cantidad: limite }]);
    }
  }

  quitar(productoId: number | undefined): void {
    this.guardar(this.items.filter((i) => i.producto.id !== productoId));
  }

  vaciar(): void {
    this.guardar([]);
  }

  private guardar(items: ItemCarrito[]): void {
    this.itemsSubject.next(items);
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    } catch {
      /* sin almacenamiento: el carrito vive solo en memoria */
    }
  }

  private leer(): ItemCarrito[] {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? '[]');
      return Array.isArray(datos)
        ? datos.filter((i) => i?.producto?.id && typeof i.producto.precio === 'number' && i.cantidad > 0)
        : [];
    } catch {
      return [];
    }
  }
}
