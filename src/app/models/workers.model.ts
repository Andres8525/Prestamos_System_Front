/** Tipos de tarea en segundo plano del backend (/api/workers). */
export type TipoTarea = 'RECALCULAR_MORA' | 'SCORING_CARTERA' | 'REENTRENAR_MODELO' | 'REPORTE_CARTERA' | 'INFORME_IA';

export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'FALLIDA' | 'CANCELADA';

export interface Tarea {
  id: number;
  tipo: TipoTarea;
  nombre: string;
  estado: EstadoTarea;
  prioridad: number;
  intentos: number;
  maxIntentos: number;
  worker: string | null;
  solicitadaPor: string | null;
  resumen: string | null;
  error: string | null;
  tieneResultado: boolean;
  creadaEn: string;
  iniciadaEn: string | null;
  finalizadaEn: string | null;
  duracionMs: number | null;
}

export interface TipoTareaInfo {
  tipo: TipoTarea;
  nombre: string;
  descripcion: string;
  disponible: boolean;
}

export interface EstadoPool {
  hilos: number;
  ocupados: number;
  enCola: number;
  completadas: number;
  fallidas: number;
  tareasPorEstado: Record<EstadoTarea, number>;
  tipos: TipoTareaInfo[];
}

export const ESTADOS_ACTIVOS: EstadoTarea[] = ['PENDIENTE', 'EN_PROCESO'];
