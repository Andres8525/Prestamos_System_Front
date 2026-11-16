const EMOJIS: Record<string, string> = {
  electrodomesticos: '🔌',
  tecnologia: '📱',
  hogar: '🏠',
  negocio: '🏪',
  abarrotes: '🛒'
};

/** Normaliza una categoría: sin tildes, en minúsculas y sin espacios ("Electrodomésticos" → "electrodomesticos"). */
function clave(categoria: string | undefined | null): string {
  return (categoria ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

export function emojiCategoria(categoria: string | undefined | null): string {
  return EMOJIS[clave(categoria)] ?? '📦';
}

export function claseCategoria(categoria: string | undefined | null): string {
  return `cat-${clave(categoria)}`;
}
