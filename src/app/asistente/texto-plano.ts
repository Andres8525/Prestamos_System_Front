/** El chat muestra texto plano: quita negritas, encabezados y separadores de tabla que a veces envía el modelo. */
export function sinMarcasMarkdown(texto: string): string {
  return (texto ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
