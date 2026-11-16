import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Agrega el token a las peticiones dirigidas a la API (nunca a otros dominios)
 * y cierra la sesión cuando el servidor responde 401.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const esApi = req.url.startsWith(environment.apiUrl);
  const esPublica = /\/auth\/(login|register)$/.test(req.url);
  const token = auth.token;

  const peticion = esApi && token && !esPublica
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && esApi && !esPublica) {
        auth.cerrarSesion('expirada');
      }
      return throwError(() => err);
    })
  );
};
