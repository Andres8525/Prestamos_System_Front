/** Estado del asistente de IA generativa (la clave de Groq vive solo en el backend). */
export interface EstadoAsistente {
  configurado: boolean;
  modelo: string;
  proveedor: string;
}

/** GROQ = respuesta del modelo de lenguaje; LOCAL = texto armado por el backend sin IA generativa. */
export type OrigenRespuesta = 'GROQ' | 'LOCAL';

export interface RespuestaAsistente {
  texto: string;
  origen: OrigenRespuesta;
  modelo: string | null;
  tokens: number | null;
}

export interface MensajeChat {
  rol: 'usuario' | 'asistente' | 'error';
  texto: string;
  origen?: OrigenRespuesta;
  modelo?: string | null;
  tokens?: number | null;
  hora: Date;
}

/** Preguntas sugeridas para empezar la conversación. */
export const SUGERENCIAS_ASISTENTE = [
  '¿Cómo está la salud de la cartera hoy?',
  '¿Qué porcentaje del saldo está vencido y qué recomiendas?',
  '¿Qué acciones priorizo con los clientes de riesgo alto?',
  '¿Qué tan confiable es el modelo de scoring actual?'
];

export const LARGO_MAXIMO_PREGUNTA = 600;
