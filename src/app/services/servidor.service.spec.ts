import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { INTERVALO_LATIDO_MS, REINTENTO_SIN_CONEXION_MS, ServidorService } from './servidor.service';
import { environment } from '../environments/environment';

describe('ServidorService (mantener el backend activo)', () => {
  let servidor: ServidorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servidor = TestBed.inject(ServidorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => servidor.detenerLatido());

  it('marca el servidor en línea cuando /ping responde', () => {
    let resultado: boolean | undefined;
    servidor.despertar().subscribe((ok) => (resultado = ok));
    http.expectOne(`${environment.apiUrl}/ping`).flush({ pong: 'x' });
    expect(resultado).toBe(true);
    expect(servidor.estado).toBe('en-linea');
  });

  it('marca sin conexión cuando el ping falla', () => {
    servidor.despertar().subscribe();
    http.expectOne(`${environment.apiUrl}/ping`).error(new ProgressEvent('error'));
    expect(servidor.estado).toBe('sin-conexion');
  });

  it('las llamadas simultáneas comparten un solo ping', () => {
    servidor.despertar().subscribe();
    servidor.despertar().subscribe();
    const peticiones = http.match(`${environment.apiUrl}/ping`);
    expect(peticiones.length).toBe(1);
    peticiones[0].flush({});
  });

  it('sin conexión reintenta pronto y en línea espera el intervalo normal', () => {
    vi.useFakeTimers();
    try {
      servidor.iniciarLatido();
      http.expectOne(`${environment.apiUrl}/ping`).error(new ProgressEvent('error'));
      expect(servidor.estado).toBe('sin-conexion');

      vi.advanceTimersByTime(REINTENTO_SIN_CONEXION_MS);
      http.expectOne(`${environment.apiUrl}/ping`).flush({});
      expect(servidor.estado).toBe('en-linea');

      vi.advanceTimersByTime(REINTENTO_SIN_CONEXION_MS * 2);
      http.expectNone(`${environment.apiUrl}/ping`);
      vi.advanceTimersByTime(INTERVALO_LATIDO_MS);
      http.expectOne(`${environment.apiUrl}/ping`).flush({});
    } finally {
      vi.useRealTimers();
    }
  });
});
