import { Injectable } from '@angular/core';

export type Tema = 'auto' | 'claro' | 'oscuro';

const CLAVE = 'crediruta.tema';
const ORDEN: Tema[] = ['auto', 'claro', 'oscuro'];

/** Tema de color: automático (según el sistema), claro u oscuro. Se recuerda en este navegador. */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private actual: Tema = this.leer();

  constructor() {
    this.aplicar();
  }

  get tema(): Tema {
    return this.actual;
  }

  get etiqueta(): string {
    return { auto: 'Tema automático', claro: 'Tema claro', oscuro: 'Tema oscuro' }[this.actual];
  }

  /** Recorre automático → claro → oscuro. */
  siguiente(): void {
    this.actual = ORDEN[(ORDEN.indexOf(this.actual) + 1) % ORDEN.length];
    try {
      localStorage.setItem(CLAVE, this.actual);
    } catch {
      // Sin almacenamiento el tema dura lo que dure la pestaña.
    }
    this.aplicar();
  }

  private aplicar(): void {
    if (typeof document === 'undefined') return;
    const raiz = document.documentElement;
    if (this.actual === 'auto') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', this.actual);
  }

  private leer(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE) as Tema | null;
      return guardado && ORDEN.includes(guardado) ? guardado : 'auto';
    } catch {
      return 'auto';
    }
  }
}
