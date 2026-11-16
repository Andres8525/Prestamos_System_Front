/** Tipos de evento que envía el backend por /ws/eventos. */
export type TipoEvento =
  | 'BIENVENIDA'
  | 'LATIDO'
  | 'CONEXIONES'
  | 'ABONO_REGISTRADO'
  | 'PRESTAMO_CREADO'
  | 'CAJA_CERRADA'
  | 'TAREA_ACTUALIZADA'
  | 'MODELO_ENTRENADO';

export interface EventoTiempoReal {
  id: number;
  tipo: TipoEvento;
  mensaje: string;
  datos: Record<string, unknown>;
  fecha: string;
}

export type EstadoConexion = 'desconectado' | 'conectando' | 'conectado' | 'reconectando';

export const EVENTOS_SISTEMA: TipoEvento[] = ['BIENVENIDA', 'LATIDO', 'CONEXIONES'];

/** Texto e ícono de cada evento de negocio para el feed de actividad. */
export const PRESENTACION_EVENTOS: Partial<Record<TipoEvento, { icono: string; etiqueta: string }>> = {
  ABONO_REGISTRADO: { icono: '💵', etiqueta: 'Abono' },
  PRESTAMO_CREADO: { icono: '📄', etiqueta: 'Préstamo' },
  CAJA_CERRADA: { icono: '🧾', etiqueta: 'Caja' },
  TAREA_ACTUALIZADA: { icono: '⚙️', etiqueta: 'Proceso' },
  MODELO_ENTRENADO: { icono: '🧠', etiqueta: 'Modelo ML' }
};
