import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Agrega el token a las peticiones dirigidas a la API (nunca a otros dominios),
 * corta las que tardan demasiado y cierra la sesión cuando el servidor responde 401.
 */

/** Tiempo máximo de espera de la API (el servidor de Render Free tarda hasta ~1 minuto en despertar). */
export const ESPERA_MAXIMA_MS = 75000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const esApi = req.url.startsWith(environment.apiUrl);
  const esPublica = /\/auth\/(login|register)$/.test(req.url);
  const token = auth.token;

  const peticion = esApi && token && !esPublica
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    esApi ? timeout(ESPERA_MAXIMA_MS) : (o) => o,
    catchError((err: HttpErrorResponse | TimeoutError) => {
      if (err instanceof TimeoutError) {
        // Se convierte en un error HTTP sin respuesta (status 0) para que las pantallas lo traten igual.
        return throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Timeout', url: req.url }));
      }
      if (err.status === 401 && esApi && !esPublica) {
        auth.cerrarSesion('expirada');
      }
      return throwError(() => err);
    })
  );
};
