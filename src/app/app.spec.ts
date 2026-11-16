import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './services/auth.service';
import { mensajeError } from './services/cobranza.service';
import { sinMarcasMarkdown } from './asistente/texto-plano';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('no tiene sesión al iniciar', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.token).toBeNull();
  });

  it('descarta una sesión guardada que ya expiró', () => {
    localStorage.setItem('crediruta.sesion', JSON.stringify({
      token: 'x', expira: Date.now() - 1000, usuario: { id: 1, nombre: 'A', email: 'a@a.com', permisos: [] }
    }));
    expect(TestBed.inject(AuthService).estaAutenticado()).toBe(false);
  });

  it('recupera una sesión vigente guardada', () => {
    localStorage.setItem('crediruta.sesion', JSON.stringify({
      token: 'abc', expira: Date.now() + 60000, usuario: { id: 1, nombre: 'Ana', email: 'a@a.com', permisos: [] }
    }));
    const auth = TestBed.inject(AuthService);
    expect(auth.token).toBe('abc');
    expect(auth.usuario?.nombre).toBe('Ana');
  });
});

describe('mensajeError', () => {
  it('explica cuando el servidor no responde', () => {
    expect(mensajeError({ status: 0 }, 'x')).toContain('No se pudo conectar con el servidor');
  });

  it('usa el mensaje del backend o el primer error de validación', () => {
    expect(mensajeError({ status: 401, error: { error: 'Email o contraseña incorrectos' } }, 'x'))
      .toBe('Email o contraseña incorrectos');
    expect(mensajeError({ status: 400, error: { password: 'muy corta' } }, 'x')).toBe('password: muy corta');
  });

  it('en errores 5xx muestra el motivo del servidor, salvo el error interno genérico', () => {
    expect(mensajeError({ status: 503, error: { error: 'Groq no está disponible en este momento' } }, 'x'))
      .toBe('Groq no está disponible en este momento');
    expect(mensajeError({ status: 500, error: { error: 'Error interno del servidor' } }, 'x'))
      .toContain('El servidor tuvo un problema');
    expect(mensajeError({ status: 502, error: '<html>Bad Gateway</html>' }, 'x')).toContain('El servidor tuvo un problema');
  });
});

describe('sinMarcasMarkdown', () => {
  it('quita negritas, encabezados y separadores de tabla sin tocar las listas', () => {
    const texto = '## Resumen\n**Saldo vencido**: 24 %\n|---|---|\n- Visitar a los atrasados';
    expect(sinMarcasMarkdown(texto)).toBe('Resumen\nSaldo vencido: 24 %\n\n- Visitar a los atrasados');
  });
});
