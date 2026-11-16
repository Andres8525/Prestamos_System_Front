import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { EstadoAsistente, RespuestaAsistente } from '../models/asistente.model';

/**
 * Asistente de IA (Groq) a través del backend (/api/asistente).
 * El frontend NUNCA llama a Groq directamente: la API key quedaría expuesta en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private api = `${environment.apiUrl}/asistente`;

  constructor(private http: HttpClient) {}

  estado(): Observable<EstadoAsistente> {
    return this.http.get<EstadoAsistente>(`${this.api}/estado`);
  }

  preguntar(pregunta: string): Observable<RespuestaAsistente> {
    return this.http.post<RespuestaAsistente>(`${this.api}/preguntar`, { pregunta });
  }

  /** Explicación en lenguaje natural del scoring de un cliente (al modelo solo llegan datos anónimos). */
  explicarCliente(clienteId: number): Observable<RespuestaAsistente> {
    return this.http.post<RespuestaAsistente>(`${this.api}/explicar/cliente/${clienteId}`, {});
  }
}
