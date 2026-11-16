import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Abono, Cobrador, CuadreCaja, ModeloScoring, RutaCobro, Scoring } from '../models/cobranza.model';

/** Servicios de la operación en terreno: cobradores, rutas, abonos, caja y scoring IA. */
@Injectable({ providedIn: 'root' })
export class CobranzaService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // --- Cobradores
  obtenerCobradores(soloActivos = false): Observable<Cobrador[]> {
    return this.http.get<Cobrador[]>(`${this.api}/cobradores`, { params: { soloActivos } });
  }

  crearCobrador(c: Cobrador): Observable<Cobrador> {
    return this.http.post<Cobrador>(`${this.api}/cobradores`, c);
  }

  actualizarCobrador(id: number, c: Cobrador): Observable<Cobrador> {
    return this.http.put<Cobrador>(`${this.api}/cobradores/${id}`, c);
  }

  desactivarCobrador(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/cobradores/${id}`);
  }

  // --- Ruta y abonos
  obtenerRuta(cobradorId: number, fecha?: string): Observable<RutaCobro> {
    return this.http.get<RutaCobro>(`${this.api}/rutas/cobrador/${cobradorId}`, { params: this.fecha(fecha) });
  }

  registrarAbono(prestamoId: number, monto: number, cobradorId?: number, observacion?: string): Observable<Abono> {
    return this.http.post<Abono>(`${this.api}/abonos`, { prestamoId, monto, cobradorId, observacion });
  }

  /** Todos los abonos registrados en una fecha (por defecto hoy). */
  abonosDelDia(fecha?: string): Observable<Abono[]> {
    return this.http.get<Abono[]>(`${this.api}/abonos`, { params: this.fecha(fecha) });
  }

  abonosPorPrestamo(prestamoId: number): Observable<Abono[]> {
    return this.http.get<Abono[]>(`${this.api}/abonos/prestamo/${prestamoId}`);
  }

  // --- Caja
  consultarCaja(cobradorId: number, fecha?: string, baseInicial?: number, gastos?: number): Observable<CuadreCaja> {
    let params = this.fecha(fecha);
    if (baseInicial != null) params = params.set('baseInicial', baseInicial);
    if (gastos != null) params = params.set('gastos', gastos);
    return this.http.get<CuadreCaja>(`${this.api}/caja/cobrador/${cobradorId}`, { params });
  }

  cerrarCaja(datos: {
    cobradorId: number; fecha?: string; baseInicial?: number; gastos?: number;
    efectivoEntregado: number; observacion?: string;
  }): Observable<CuadreCaja> {
    return this.http.post<CuadreCaja>(`${this.api}/caja/cierre`, datos);
  }

  historialCaja(cobradorId: number): Observable<CuadreCaja[]> {
    return this.http.get<CuadreCaja[]>(`${this.api}/caja/cobrador/${cobradorId}/historial`);
  }

  // --- Scoring IA
  evaluarCliente(clienteId: number): Observable<Scoring> {
    return this.http.get<Scoring>(`${this.api}/scoring/cliente/${clienteId}`);
  }

  modeloScoring(): Observable<ModeloScoring> {
    return this.http.get<ModeloScoring>(`${this.api}/scoring/modelo`);
  }

  reentrenarModelo(): Observable<ModeloScoring> {
    return this.http.post<ModeloScoring>(`${this.api}/scoring/entrenar`, {});
  }

  private fecha(fecha?: string): HttpParams {
    return fecha ? new HttpParams().set('fecha', fecha) : new HttpParams();
  }
}

/** Extrae un mensaje legible de un error HTTP del backend. */
export function mensajeError(err: any, fallback: string): string {
  if (err?.status === 0) {
    return 'No se pudo conectar con el servidor. Si acaba de desplegarse o estuvo inactivo, '
      + 'puede tardar hasta un minuto en responder: inténtalo de nuevo.';
  }
  if (err?.status >= 500) return 'El servidor tuvo un problema al procesar la solicitud. Inténtalo de nuevo.';
  const e = err?.error;
  if (!e) return fallback;
  if (typeof e === 'string') return e;
  if (e.error) return e.error;
  const campos = Object.entries(e as Record<string, unknown>).filter(([, v]) => typeof v === 'string');
  return campos.length ? campos.map(([c, m]) => `${c}: ${m}`).join(' | ') : fallback;
}

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
