import { EstadoPago, TipoLiquidacion } from './prestamo.model';

export interface Cobrador {
  id?: number;
  nombre: string;
  documento: string;
  email?: string;
  telefono?: string;
  zona: string;
  cajaBase: number;
  activo?: boolean;
  clientesAsignados?: number;
}

export interface Abono {
  id: number;
  prestamoId: number;
  clienteId: number;
  clienteNombre: string;
  cobradorId?: number;
  cobradorNombre?: string;
  monto: number;
  cuotaEsperada?: number;
  incompleto: boolean;
  fecha: string;
  fechaRegistro: string;
  observacion?: string;
  cuotasCubiertas?: number;
  saldoPrestamo?: number;
}

export interface ParadaRuta {
  orden: number;
  clienteId: number;
  clienteNombre: string;
  direccion: string;
  telefono: string;
  prestamoId: number;
  tipoLiquidacion: TipoLiquidacion;
  estado: EstadoPago;
  valorCuota: number;
  montoExigible: number;
  cuotasVencidas: number;
  diasAtraso: number;
  saldoPendiente: number;
  abonadoHoy: number;
  cobraHoy: boolean;
}

export interface RutaCobro {
  cobradorId: number;
  cobradorNombre: string;
  zona: string;
  fecha: string;
  totalVisitas: number;
  visitasConAbono: number;
  totalExigible: number;
  totalRecaudado: number;
  paradas: ParadaRuta[];
}

export interface CuadreCaja {
  id?: number;
  cobradorId: number;
  cobradorNombre: string;
  zona: string;
  fecha: string;
  estado: 'ABIERTA' | 'CERRADA';
  baseInicial: number;
  totalCobrado: number;
  numeroAbonos: number;
  totalPrestado: number;
  numeroPrestamos: number;
  gastos: number;
  efectivoEsperado: number;
  efectivoEntregado?: number;
  diferencia?: number;
  resultado?: 'CUADRADA' | 'SOBRANTE' | 'FALTANTE';
  observacion?: string;
  fechaCierre?: string;
  abonos: Abono[];
  desembolsos: { prestamoId: number; clienteNombre: string; monto: number }[];
}

export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';

export interface FactorRiesgo {
  variable: string;
  descripcion: string;
  valor: number;
  impacto: number;
}

export interface ModeloScoring {
  algoritmo: string;
  muestrasReales: number;
  muestrasSinteticas: number;
  exactitud: number;
  auc: number;
  entrenadoEn: string;
  /** Pesos de la regresión logística (null si el modelo elegido es el árbol de decisión). */
  pesos: Record<string, number> | null;
  /** Importancia relativa de cada variable (suma 1). */
  importancia: Record<string, number>;
}

export interface Scoring {
  clienteId: number;
  clienteNombre: string;
  probabilidadDefault: number;
  puntaje: number;
  nivelRiesgo: NivelRiesgo;
  recomendacion: 'APROBAR' | 'REVISAR' | 'RECHAZAR';
  mensaje: string;
  sinHistorial: boolean;
  prestamosAnteriores: number;
  cuotasEvaluadas: number;
  caracteristicas: Record<string, number>;
  factores: FactorRiesgo[];
  modelo: ModeloScoring;
}
