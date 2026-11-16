import { aleatorio, proyectarRecaudo } from './proyeccion';

describe('proyectarRecaudo (Monte Carlo en Web Worker)', () => {
  const base = { escenarios: 4000, recuperacionEnMora: 0.4, probabilidadPorDefecto: 0.15, semilla: 7 };

  it('es reproducible con la misma semilla', () => {
    const a = aleatorio(42), b = aleatorio(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('sin riesgo se recauda todo el saldo', () => {
    const r = proyectarRecaudo({ ...base, prestamos: [{ saldo: 100, probabilidad: 0 }, { saldo: 50, probabilidad: 0 }] });
    expect(r.saldoTotal).toBe(150);
    expect(r.esperado).toBe(150);
    expect(r.perdidaEsperada).toBe(0);
  });

  it('el recaudo esperado se acerca al valor teórico y los percentiles están ordenados', () => {
    const prestamos = Array.from({ length: 50 }, () => ({ saldo: 100, probabilidad: 0.3 }));
    const r = proyectarRecaudo({ ...base, prestamos });
    // Teórico: 5000 * (0.7 + 0.3 * 0.4) = 4100
    expect(Math.abs(r.esperado - 4100)).toBeLessThan(60);
    expect(r.p5).toBeLessThanOrEqual(r.p50);
    expect(r.p50).toBeLessThanOrEqual(r.p95);
    expect(r.histograma.reduce((t, b) => t + b.frecuencia, 0)).toBe(base.escenarios);
  });

  it('usa la probabilidad por defecto en préstamos sin scoring e informa el avance', () => {
    const avances: number[] = [];
    const r = proyectarRecaudo({ ...base, prestamos: [{ saldo: 100, probabilidad: NaN }] }, (f) => avances.push(f));
    expect(r.prestamos).toBe(1);
    expect(r.esperado).toBeLessThan(100);
    expect(avances.length).toBeGreaterThan(5);
  });
});
