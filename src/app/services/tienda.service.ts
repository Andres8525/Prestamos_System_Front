import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Pedido, Producto, SolicitudPedido } from '../models/tienda.model';

/** API de la tienda: catálogo de productos y pedidos. */
@Injectable({ providedIn: 'root' })
export class TiendaService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerProductos(soloActivos = false): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.api}/productos`, { params: { soloActivos } });
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.api}/productos`, producto);
  }

  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.api}/productos/${id}`, producto);
  }

  desactivarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/productos/${id}`);
  }

  crearPedido(solicitud: SolicitudPedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.api}/pedidos`, solicitud);
  }

  obtenerPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.api}/pedidos`);
  }
}
