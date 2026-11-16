import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { ServidorService } from './servidor.service';
import { EstadoEmail, RespuestaAuth, SesionGuardada, UsuarioSesion } from '../models/auth.model';

const CLAVE_SESION = 'crediruta.sesion';

/** Inicio de sesión, registro y cierre de sesión. La sesión se conserva hasta que el token expira. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = `${environment.apiUrl}/auth`;
  private sesion: SesionGuardada | null = this.leerSesion();
  private usuarioSubject = new BehaviorSubject<UsuarioSesion | null>(this.sesion?.usuario ?? null);

  /** Usuario de la sesión actual (null si no hay sesión). */
  readonly usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private servidor: ServidorService) {}

  get usuario(): UsuarioSesion | null {
    return this.usuarioSubject.value;
  }

  /** Token vigente o null si no hay sesión o ya expiró. */
  get token(): string | null {
    if (!this.sesion) return null;
    if (Date.now() >= this.sesion.expira) {
      this.limpiarSesion();
      return null;
    }
    return this.sesion.token;
  }

  estaAutenticado(): boolean {
    return this.token !== null;
  }

  /** Paso 1 del acceso: indica si el email ya tiene cuenta (pedir contraseña) o no (crear cuenta). */
  verificarEmail(email: string): Observable<EstadoEmail> {
    return this.http.post<EstadoEmail>(`${this.api}/verificar-email`, { email });
  }

  /**
   * "Despierta" el servidor (en Render Free se suspende tras 15 minutos sin uso).
   * Emite true si respondió y false si no lo hizo en el tiempo indicado.
   * @deprecated use {@link ServidorService.despertar}, que además informa el estado de la conexión.
   */
  despertarServidor(esperaMs = 70000): Observable<boolean> {
    return this.servidor.despertar(esperaMs);
  }

  iniciarSesion(email: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.api}/login`, { email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  registrar(nombre: string, email: string, password: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.api}/register`, { nombre, email, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  /** Cierra la sesión: avisa al servidor (sin esperar respuesta), borra el token y vuelve al login. */
  cerrarSesion(motivo?: 'expirada'): void {
    if (this.token) {
      this.http.post(`${this.api}/logout`, {}).subscribe({ error: () => undefined });
    }
    this.limpiarSesion();
    this.router.navigate(['/login'], { queryParams: motivo ? { sesion: motivo } : {} });
  }

  private guardarSesion(r: RespuestaAuth): void {
    this.sesion = { token: r.token, expira: Date.now() + r.expiraEnSegundos * 1000, usuario: r.usuario };
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(this.sesion));
    } catch {
      // Sin almacenamiento disponible la sesión dura lo que dure la pestaña.
    }
    this.usuarioSubject.next(r.usuario);
  }

  private limpiarSesion(): void {
    this.sesion = null;
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* sin almacenamiento */
    }
    this.usuarioSubject.next(null);
  }

  private leerSesion(): SesionGuardada | null {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null') as SesionGuardada | null;
      return s && typeof s.token === 'string' && s.expira > Date.now() && s.usuario ? s : null;
    } catch {
      return null;
    }
  }
}
