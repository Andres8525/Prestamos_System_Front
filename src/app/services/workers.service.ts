import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { EstadoPool, Tarea, TipoTarea } from '../models/workers.model';

/** Cola de tareas en segundo plano del backend (/api/workers). */
@Injectable({ providedIn: 'root' })
export class WorkersService {
  private api = `${environment.apiUrl}/workers`;

  constructor(private http: HttpClient) {}

  estado(): Observable<EstadoPool> {
    return this.http.get<EstadoPool>(`${this.api}/estado`);
  }

  tareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.api}/tareas`);
  }

  encolar(tipo: TipoTarea, prioridad = 5): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.api}/tareas`, { tipo, prioridad });
  }

  cancelar(id: number): Observable<Tarea> {
    return this.http.delete<Tarea>(`${this.api}/tareas/${id}`);
  }

  reintentar(id: number): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.api}/tareas/${id}/reintentar`, {});
  }

  /** Contenido generado por la tarea (CSV del reporte o Markdown del informe). */
  resultado(id: number): Observable<string> {
    return this.http.get(`${this.api}/tareas/${id}/resultado`, { responseType: 'text' });
  }
}
