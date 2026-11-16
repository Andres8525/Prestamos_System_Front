import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { InfoGrpc } from '../models/grpc.model';

/**
 * Información del servidor gRPC del backend. El navegador no habla gRPC nativo (HTTP/2 con tramas binarias),
 * así que el panel consulta su estado, métricas y contratos por la API REST.
 */
@Injectable({ providedIn: 'root' })
export class GrpcService {
  private api = `${environment.apiUrl}/grpc`;

  constructor(private http: HttpClient) {}

  info(): Observable<InfoGrpc> {
    return this.http.get<InfoGrpc>(`${this.api}/info`);
  }

  /** Archivos .proto: nombre → contenido. */
  contratos(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.api}/contratos`);
  }
}
