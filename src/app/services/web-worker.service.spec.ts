import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { WebWorkerService } from './web-worker.service';

describe('WebWorkerService', () => {
  it('sin soporte de Web Workers usa el respaldo en el hilo principal', async () => {
    const original = (globalThis as { Worker?: unknown }).Worker;
    // En el entorno de pruebas se fuerza la ausencia de Worker para verificar el respaldo.
    delete (globalThis as { Worker?: unknown }).Worker;
    try {
      const servicio = TestBed.inject(WebWorkerService);
      expect(servicio.disponible).toBe(false);
      const csv = await firstValueFrom(servicio.csv({ columnas: [{ clave: 'a', titulo: 'A' }], filas: [{ a: 1 }] }));
      expect(csv).toContain('A\r\n1');
      const r = await firstValueFrom(servicio.proyeccion({
        prestamos: [{ saldo: 10, probabilidad: 0 }], escenarios: 10, recuperacionEnMora: 0.3, probabilidadPorDefecto: 0.1
      }));
      expect(r.esperado).toBe(10);
    } finally {
      if (original) (globalThis as { Worker?: unknown }).Worker = original;
    }
  });
});
