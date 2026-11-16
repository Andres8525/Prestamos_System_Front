/** Columna de un CSV: propiedad de la fila y título de la cabecera. */
export interface ColumnaCsv {
  clave: string;
  titulo: string;
}

/** Mensaje que recibe el worker de exportación. */
export interface PeticionCsv {
  columnas: ColumnaCsv[];
  filas: Record<string, unknown>[];
}

/** Escapa un valor según RFC 4180 (comillas dobles si contiene separador, comillas o saltos de línea). */
export function celdaCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  const texto = valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Genera el CSV. Empieza con BOM UTF-8 para que Excel muestre bien las tildes y la ñ.
 * Función pura: la usa el Web Worker y también el respaldo en el hilo principal.
 */
export function generarCsv({ columnas, filas }: PeticionCsv): string {
  const lineas = [columnas.map((c) => celdaCsv(c.titulo)).join(',')];
  for (const fila of filas) {
    lineas.push(columnas.map((c) => celdaCsv(fila[c.clave])).join(','));
  }
  return '﻿' + lineas.join('\r\n') + '\r\n';
}
