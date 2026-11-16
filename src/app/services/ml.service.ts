import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Scoring } from '../models/cobranza.model';
import { EntradaSimulacion, Entrenamiento, PrediccionHistorica, ResumenModelo } from '../models/ml.model';

/** Acceso al módulo de Machine Learning del backend (/api/ml). */
@Injectable({ providedIn: 'root' })
export class MlService {
  private api = `${environment.apiUrl}/ml`;

  constructor(private http: HttpClient) {}

  /** Reporte del modelo vigente: métricas, ROC, validación cruzada y comparación de algoritmos. */
  resumen(): Observable<ResumenModelo> {
    return this.http.get<ResumenModelo>(`${this.api}/modelo`);
  }

  reentrenar(): Observable<ResumenModelo> {
    return this.http.post<ResumenModelo>(`${this.api}/entrenar`, {});
  }

  entrenamientos(): Observable<Entrenamiento[]> {
    return this.http.get<Entrenamiento[]>(`${this.api}/entrenamientos`);
  }

  prediccionesCliente(clienteId: number): Observable<PrediccionHistorica[]> {
    return this.http.get<PrediccionHistorica[]>(`${this.api}/predicciones/cliente/${clienteId}`);
  }

  simular(entrada: EntradaSimulacion): Observable<Scoring> {
    return this.http.post<Scoring>(`${this.api}/simular`, entrada);
  }
}
