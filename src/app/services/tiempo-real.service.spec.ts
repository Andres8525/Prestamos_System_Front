import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { TiempoRealService } from './tiempo-real.service';
import { AuthService } from './auth.service';
import { EstadoConexion, EventoTiempoReal } from '../models/tiempo-real.model';

/** WebSocket simulado: registra las instancias para poder abrirlas, enviarles mensajes y cerrarlas. */
class SocketFalso {
  static readonly OPEN = 1;
  static instancias: SocketFalso[] = [];
  readyState = 0;
  enviados: string[] = [];
  onopen?: () => void;
  onmessage?: (m: { data: string }) => void;
  onclose?: () => void;

  constructor(public url: string) {
    SocketFalso.instancias.push(this);
  }

  send(texto: string): void { this.enviados.push(texto); }
  close(): void { this.readyState = 3; this.onclose?.(); }
  abrir(): void { this.readyState = 1; this.onopen?.(); }
  recibir(evento: Partial<EventoTiempoReal>): void {
    this.onmessage?.({ data: JSON.stringify({ datos: {}, fecha: new Date().toISOString(), mensaje: '', ...evento }) });
  }
  caer(): void { this.readyState = 3; this.onclose?.(); }
}

describe('TiempoRealService (WebSocket)', () => {
  let servicio: TiempoRealService;
  let estados: EstadoConexion[];
  const original = (globalThis as { WebSocket?: unknown }).WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    SocketFalso.instancias = [];
    (globalThis as { WebSocket?: unknown }).WebSocket = SocketFalso;
    localStorage.setItem('crediruta.sesion', JSON.stringify({
      token: 'tok', expira: Date.now() + 3600000, usuario: { id: 1, nombre: 'Ana', email: 'a@a.com', permisos: [] }
    }));
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    TestBed.inject(AuthService);
    servicio = TestBed.inject(TiempoRealService);
    estados = [];
    servicio.estado$.subscribe((e) => estados.push(e));
  });

  afterEach(() => {
    servicio.desconectar();
    vi.useRealTimers();
    localStorage.clear();
    (globalThis as { WebSocket?: unknown }).WebSocket = original;
  });

  it('se conecta con el token y publica los eventos de negocio en el feed', () => {
    servicio.conectar();
    const ws = SocketFalso.instancias[0];
    expect(ws.url).toContain('/ws/eventos?token=tok');
    ws.abrir();
    expect(estados.at(-1)).toBe('conectado');

    let actividad: EventoTiempoReal[] = [];
    servicio.actividad$.subscribe((a) => (actividad = a));
    ws.recibir({ id: 1, tipo: 'BIENVENIDA' });
    ws.recibir({ id: 2, tipo: 'ABONO_REGISTRADO', mensaje: 'Abono de 10' });
    ws.recibir({ id: 2, tipo: 'ABONO_REGISTRADO', mensaje: 'duplicado' });
    expect(actividad.map((e) => e.mensaje)).toEqual(['Abono de 10']);
  });

  it('reconecta con espera exponencial pidiendo los eventos desde el último id', () => {
    servicio.conectar();
    const primero = SocketFalso.instancias[0];
    primero.abrir();
    primero.recibir({ id: 7, tipo: 'PRESTAMO_CREADO' });
    primero.caer();
    expect(estados.at(-1)).toBe('reconectando');

    vi.advanceTimersByTime(999);
    expect(SocketFalso.instancias.length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(SocketFalso.instancias[1].url).toContain('desde=7');

    SocketFalso.instancias[1].caer();
    vi.advanceTimersByTime(1999);
    expect(SocketFalso.instancias.length).toBe(2);
    vi.advanceTimersByTime(1);
    expect(SocketFalso.instancias.length).toBe(3);
  });

  it('envía ping periódico y deja de reconectar al cerrar sesión', () => {
    servicio.conectar();
    const ws = SocketFalso.instancias[0];
    ws.abrir();
    vi.advanceTimersByTime(20000);
    expect(ws.enviados).toContain('{"accion":"ping"}');

    servicio.desconectar();
    vi.advanceTimersByTime(60000);
    expect(SocketFalso.instancias.length).toBe(1);
    expect(estados.at(-1)).toBe('desconectado');
  });
});
