/** Patrón de comunicación de un método gRPC. */
export type PatronGrpc = 'UNARY' | 'SERVER_STREAMING' | 'CLIENT_STREAMING' | 'BIDI_STREAMING' | 'UNKNOWN';

export interface MetodoGrpc {
  nombre: string;
  patron: PatronGrpc;
  descripcionPatron: string;
  llamadas: number;
  errores: number;
  promedioMs: number;
  ultimoEstado: string;
}

export interface ServicioGrpc {
  nombre: string;
  metodos: MetodoGrpc[];
}

export interface InfoGrpc {
  habilitado: boolean;
  activo: boolean;
  puerto: number;
  servicios: ServicioGrpc[];
}

/** Etiqueta corta y flechas para cada patrón (petición → respuesta). */
export const PATRONES_GRPC: Record<PatronGrpc, { etiqueta: string; flujo: string }> = {
  UNARY: { etiqueta: 'Unario', flujo: '1 → 1' },
  SERVER_STREAMING: { etiqueta: 'Stream servidor', flujo: '1 → N' },
  CLIENT_STREAMING: { etiqueta: 'Stream cliente', flujo: 'N → 1' },
  BIDI_STREAMING: { etiqueta: 'Bidireccional', flujo: 'N ⇄ N' },
  UNKNOWN: { etiqueta: 'Desconocido', flujo: '?' }
};
