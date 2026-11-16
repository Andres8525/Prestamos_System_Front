/** Préstamo activo para la proyección: lo que falta cobrar y su probabilidad de incumplimiento (modelo de ML). */
export interface PrestamoProyeccion {
  saldo: number;
  probabilidad: number;
}

export interface PeticionProyeccion {
  prestamos: PrestamoProyeccion[];
  escenarios: number;
  /** Fracción promedio del saldo que se logra recuperar de un préstamo que cae en incumplimiento. */
  recuperacionEnMora: number;
  /** Probabilidad usada para préstamos sin scoring. */
  probabilidadPorDefecto: number;
  semilla?: number;
}

export interface BarraHistograma {
  desde: number;
  hasta: number;
  frecuencia: number;
}

export interface ResultadoProyeccion {
  escenarios: number;
  prestamos: number;
  saldoTotal: number;
  esperado: number;
  p5: number;
  p50: number;
  p95: number;
  /** Pérdida esperada = saldo total - recaudo esperado. */
  perdidaEsperada: number;
  histograma: BarraHistograma[];
  milisegundos: number;
}

/** Mensaje de avance que envía el worker mientras simula. */
export interface AvanceProyeccion {
  __progreso: number;
}

/** Generador pseudoaleatorio reproducible (mulberry32). */
export function aleatorio(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentil(ordenados: Float64Array, p: number): number {
  if (!ordenados.length) return 0;
  const i = Math.min(ordenados.length - 1, Math.max(0, Math.round(p * (ordenados.length - 1))));
  return ordenados[i];
}

const redondear = (v: number) => Math.round(v * 100) / 100;

/**
 * Simulación Monte Carlo del recaudo de la cartera activa.
 * En cada escenario, cada préstamo cae en incumplimiento con su probabilidad del modelo de ML;
 * si cae, se recupera una fracción aleatoria (media = recuperacionEnMora) de su saldo; si no, se cobra completo.
 * El resultado es la distribución del recaudo total: valor esperado, percentiles 5/50/95 e histograma.
 */
export function proyectarRecaudo(
  peticion: PeticionProyeccion,
  alAvanzar?: (fraccion: number) => void
): ResultadoProyeccion {
  const inicio = performance.now();
  const prestamos = peticion.prestamos.filter((p) => p.saldo > 0);
  const n = Math.max(1, Math.floor(peticion.escenarios));
  const azar = aleatorio(peticion.semilla ?? 2024);
  const rec = Math.min(1, Math.max(0, peticion.recuperacionEnMora));
  const saldos = Float64Array.from(prestamos, (p) => p.saldo);
  const probs = Float64Array.from(prestamos, (p) =>
    Math.min(1, Math.max(0, Number.isFinite(p.probabilidad) ? p.probabilidad : peticion.probabilidadPorDefecto)));

  const totales = new Float64Array(n);
  const paso = Math.max(1, Math.floor(n / 20));
  for (let e = 0; e < n; e++) {
    let total = 0;
    for (let i = 0; i < saldos.length; i++) {
      total += azar() < probs[i] ? saldos[i] * Math.min(1, azar() * 2 * rec) : saldos[i];
    }
    totales[e] = total;
    if (alAvanzar && e % paso === 0) alAvanzar(e / n);
  }

  let suma = 0;
  for (const t of totales) suma += t;
  totales.sort();
  const saldoTotal = saldos.reduce((a, b) => a + b, 0);
  const minimo = totales[0] ?? 0;
  const maximo = totales[n - 1] ?? 0;
  const barras = 20;
  const ancho = (maximo - minimo) / barras || 1;
  const histograma: BarraHistograma[] = Array.from({ length: barras }, (_, i) => ({
    desde: redondear(minimo + i * ancho),
    hasta: redondear(minimo + (i + 1) * ancho),
    frecuencia: 0
  }));
  for (const t of totales) {
    histograma[Math.min(barras - 1, Math.floor((t - minimo) / ancho))].frecuencia++;
  }

  const esperado = suma / n;
  return {
    escenarios: n,
    prestamos: prestamos.length,
    saldoTotal: redondear(saldoTotal),
    esperado: redondear(esperado),
    p5: redondear(percentil(totales, 0.05)),
    p50: redondear(percentil(totales, 0.5)),
    p95: redondear(percentil(totales, 0.95)),
    perdidaEsperada: redondear(saldoTotal - esperado),
    histograma,
    milisegundos: Math.round(performance.now() - inicio)
  };
}
