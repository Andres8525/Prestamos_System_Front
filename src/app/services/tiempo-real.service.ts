import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, filter } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { EVENTOS_SISTEMA, EstadoConexion, EventoTiempoReal, TipoEvento } from '../models/tiempo-real.model';

const ESPERA_MAXIMA_MS = 30000;
const PING_MS = 20000;
const MAXIMO_ACTIVIDAD = 30;

/**
 * Conexión WebSocket con el backend (/ws/eventos).
 * - Reconecta sola con espera exponencial (1 s, 2 s, 4 s… hasta 30 s).
 * - Al reconectar pide los eventos perdidos con el id del último recibido.
 * - Envía un ping periódico para detectar conexiones caídas.
 * - Guarda los últimos eventos de negocio para el feed de actividad.
 */
@Injectable({ providedIn: 'root' })
export class TiempoRealService implements OnDestroy {
  private socket?: WebSocket;
  private intentos = 0;
  private ultimoId = 0;
  private reconexion?: ReturnType<typeof setTimeout>;
  private ping?: ReturnType<typeof setInterval>;
  private activo = false;

  private estadoSubject = new BehaviorSubject<EstadoConexion>('desconectado');
  private eventosSubject = new Subject<EventoTiempoReal>();
  private actividadSubject = new BehaviorSubject<EventoTiempoReal[]>([]);
  private conexionesSubject = new BehaviorSubject<number>(0);

  readonly estado$ = this.estadoSubject.asObservable();
  readonly eventos$ = this.eventosSubject.asObservable();
  readonly actividad$ = this.actividadSubject.asObservable();
  readonly conexiones$ = this.conexionesSubject.asObservable();

  constructor(private auth: AuthService, private zone: NgZone) {}

  get disponible(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  /** Eventos de los tipos indicados. */
  de(...tipos: TipoEvento[]): Observable<EventoTiempoReal> {
    return this.eventos$.pipe(filter((e) => tipos.includes(e.tipo)));
  }

  conectar(): void {
    if (!this.disponible || this.activo) return;
    this.activo = true;
    this.abrir();
  }

  desconectar(): void {
    this.activo = false;
    clearTimeout(this.reconexion);
    clearInterval(this.ping);
    this.socket?.close(1000, 'cierre de sesión');
    this.socket = undefined;
    this.ultimoId = 0;
    this.actividadSubject.next([]);
    this.estadoSubject.next('desconectado');
  }

  ngOnDestroy(): void {
    this.desconectar();
  }

  private abrir(): void {
    const token = this.auth.token;
    if (!token) {
      this.desconectar();
      return;
    }
    this.estadoSubject.next(this.intentos ? 'reconectando' : 'conectando');
    const url = `${environment.wsUrl}?token=${encodeURIComponent(token)}${this.ultimoId ? `&desde=${this.ultimoId}` : ''}`;
    this.zone.runOutsideAngular(() => {
      const ws = new WebSocket(url);
      this.socket = ws;
      ws.onopen = () => this.zone.run(() => {
        this.intentos = 0;
        this.estadoSubject.next('conectado');
        clearInterval(this.ping);
        this.ping = setInterval(() => this.enviar({ accion: 'ping' }), PING_MS);
      });
      ws.onmessage = (m) => this.recibir(m.data);
      ws.onclose = () => this.zone.run(() => this.alCerrar(ws));
    });
  }

  private recibir(texto: string): void {
    let evento: EventoTiempoReal;
    try {
      evento = JSON.parse(texto) as EventoTiempoReal;
    } catch {
      return;
    }
    if (evento.tipo === 'LATIDO' && !Object.keys(evento.datos ?? {}).length) return;
    this.zone.run(() => {
      if (evento.tipo === 'CONEXIONES' || evento.tipo === 'LATIDO') {
        const n = Number(evento.datos?.['conexiones']);
        if (Number.isFinite(n)) this.conexionesSubject.next(n);
      }
      if (!EVENTOS_SISTEMA.includes(evento.tipo)) {
        if (evento.id <= this.ultimoId) return;
        this.ultimoId = evento.id;
        this.actividadSubject.next([evento, ...this.actividadSubject.value].slice(0, MAXIMO_ACTIVIDAD));
      }
      this.eventosSubject.next(evento);
    });
  }

  private alCerrar(ws: WebSocket): void {
    if (ws !== this.socket) return;
    clearInterval(this.ping);
    if (!this.activo) return;
    if (!this.auth.estaAutenticado()) {
      this.desconectar();
      return;
    }
    this.estadoSubject.next('reconectando');
    const espera = Math.min(ESPERA_MAXIMA_MS, 1000 * 2 ** this.intentos++);
    this.reconexion = setTimeout(() => this.abrir(), espera);
  }

  private enviar(mensaje: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(mensaje));
  }
}
