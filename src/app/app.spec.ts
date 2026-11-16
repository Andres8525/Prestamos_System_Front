import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './services/auth.service';

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
});
