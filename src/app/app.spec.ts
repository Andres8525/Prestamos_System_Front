import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CarritoService } from './services/carrito.service';

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

describe('CarritoService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('suma cantidades sin superar el stock y calcula el total', () => {
    const carrito = TestBed.inject(CarritoService);
    const producto = { id: 1, nombre: 'Licuadora', categoria: 'Hogar', precio: 40, stock: 3, activo: true };
    carrito.agregar(producto);
    carrito.agregar(producto, 5);
    expect(carrito.unidades).toBe(3);
    expect(carrito.total).toBe(120);
    carrito.quitar(1);
    expect(carrito.items.length).toBe(0);
  });
});
