import { ModeloScoring } from './cobranza.model';

export interface MatrizConfusion {
  verdaderosPositivos: number;
  falsosPositivos: number;
  verdaderosNegativos: number;
  falsosNegativos: number;
}

export interface PuntoRoc {
  umbral: number;
  fpr: number;
  tpr: number;
}

/** Métricas del modelo sobre el conjunto de prueba (datos que no vio al entrenar). */
export interface EvaluacionModelo {
  muestras: number;
  matriz: MatrizConfusion;
  exactitud: number;
  precision: number;
  sensibilidad: number;
  especificidad: number;
  f1: number;
  auc: number;
  brier: number;
  curvaRoc: PuntoRoc[];
}

export interface ValidacionCruzada {
  pliegues: number;
  aucMedia: number;
  aucDesviacion: number;
  exactitudMedia: number;
  f1Media: number;
}

export interface ComparacionAlgoritmo {
  algoritmo: string;
  aucValidacion: number;
  aucDesviacion: number;
  aucPrueba: number;
  exactitudPrueba: number;
  f1Prueba: number;
  seleccionado: boolean;
}

export interface ResumenModelo {
  modelo: ModeloScoring;
  muestrasEntrenamiento: number;
  muestrasPrueba: number;
  evaluacionPrueba: EvaluacionModelo;
  validacionCruzada: ValidacionCruzada;
  comparacion: ComparacionAlgoritmo[];
}

export interface Entrenamiento {
  id: number;
  fecha: string;
  origen: 'INICIO' | 'MANUAL' | 'PROGRAMADO';
  algoritmo: string;
  muestrasReales: number;
  muestrasSinteticas: number;
  aucPrueba: number;
  exactitudPrueba: number;
  precisionPrueba: number;
  sensibilidadPrueba: number;
  f1Prueba: number;
  aucValidacion: number;
  aucDesviacion: number;
  comparacion: string;
}

export interface PrediccionHistorica {
  fecha: string;
  probabilidad: number;
  nivelRiesgo: string;
  algoritmo: string;
  origen: 'CREDITO_APROBADO' | 'CREDITO_BLOQUEADO' | 'SEGUIMIENTO';
}

/** Comportamiento de pago hipotético para el simulador. */
export interface EntradaSimulacion {
  promedioDiasAtraso: number;
  maxDiasAtraso: number;
  tasaCuotasAtrasadas: number;
  tasaAbonosIncompletos: number;
  frecuenciaPago: number;
  tasaSaldoVencido: number;
  prestamosPagados: number;
}

/** Nombres legibles de las variables del modelo. */
export const ETIQUETAS_VARIABLES: Record<string, string> = {
  promedioDiasAtraso: 'Días promedio de atraso',
  maxDiasAtraso: 'Máximo atraso (días)',
  tasaCuotasAtrasadas: 'Cuotas pagadas fuera de plazo',
  tasaAbonosIncompletos: 'Abonos incompletos',
  frecuenciaPago: 'Regularidad de abonos',
  tasaSaldoVencido: 'Saldo vencido sin pagar',
  prestamosPagados: 'Préstamos cancelados'
};
