import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TemaService } from './tema.service';
import { MAXIMO_VISIBLES, Notificacion, NotificacionService } from './notificacion.service';

describe('TemaService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
  });

  it('recorre automático, claro y oscuro y lo recuerda', () => {
    const tema = TestBed.inject(TemaService);
    expect(tema.tema).toBe('auto');
    expect(document.documentElement.hasAttribute('data-tema')).toBe(false);
    tema.siguiente();
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
    tema.siguiente();
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');
    expect(localStorage.getItem('crediruta.tema')).toBe('oscuro');
    tema.siguiente();
    expect(tema.tema).toBe('auto');
  });
});

describe('NotificacionService', () => {
  it('muestra como máximo 4 avisos, sin duplicados, y los cierra solos', () => {
    vi.useFakeTimers();
    const avisos = TestBed.inject(NotificacionService);
    let lista: Notificacion[] = [];
    avisos.notificaciones$.subscribe((l) => (lista = l));
    for (let i = 1; i <= 6; i++) avisos.info(`evento ${i}`);
    avisos.info('evento 6');
    expect(lista.length).toBe(MAXIMO_VISIBLES);
    expect(lista.map((n) => n.mensaje)).toEqual(['evento 3', 'evento 4', 'evento 5', 'evento 6']);
    vi.advanceTimersByTime(4000);
    expect(lista.length).toBe(0);
    vi.useRealTimers();
  });
});
