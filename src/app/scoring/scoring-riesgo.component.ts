import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ClienteService } from '../services/cliente.service';
import { CobranzaService, mensajeError } from '../services/cobranza.service';
import { ModeloScoring, Scoring } from '../models/cobranza.model';
import { ETIQUETAS_VARIABLES, PrediccionHistorica } from '../models/ml.model';
import { MlService } from '../services/ml.service';

/** Panel de IA: riesgo de incumplimiento de toda la cartera y métricas del modelo. */
@Component({
  selector: 'app-scoring-riesgo',
  standalone: false,
  templateUrl: './scoring-riesgo.component.html'
})
export class ScoringRiesgoComponent implements OnInit {
  resultados: Scoring[] = [];
  modelo: ModeloScoring | null = null;
  seleccionado: Scoring | null = null;
  cargando = false;
  entrenando = false;
  error = '';

  /** Predicciones guardadas del cliente seleccionado (de la más antigua a la más reciente). */
  historial: PrediccionHistorica[] = [];
  readonly Math = Math;

  constructor(
    private clienteService: ClienteService,
    private cobranzaService: CobranzaService,
    private ml: MlService
  ) {}

  verDetalle(r: Scoring): void {
    this.seleccionado = r;
    this.historial = [];
    this.ml.prediccionesCliente(r.clienteId).subscribe({ next: (h) => (this.historial = [...h].reverse()) });
  }

  ngOnInit(): void {
    this.cargar();
  }

  /** Variables ordenadas por importancia en el modelo vigente. */
  get importancia(): [string, number][] {
    return this.modelo ? Object.entries(this.modelo.importancia ?? {}).sort((a, b) => b[1] - a[1]) : [];
  }

  etiqueta(variable: string): string {
    return ETIQUETAS_VARIABLES[variable] ?? variable;
  }

  contar(nivel: string): number {
    return this.resultados.filter((r) => r.nivelRiesgo === nivel).length;
  }

  cargar(): void {
    this.cargando = true;
    this.cobranzaService.modeloScoring().subscribe({ next: (m) => (this.modelo = m) });
    this.clienteService.obtenerClientes().subscribe({
      next: (clientes) => {
        if (!clientes.length) {
          this.cargando = false;
          return;
        }
        forkJoin(clientes.map((c) => this.cobranzaService.evaluarCliente(c.id!))).subscribe({
          next: (r) => {
            this.resultados = r.sort((a, b) => b.probabilidadDefault - a.probabilidadDefault);
            this.cargando = false;
          },
          error: (err) => {
            this.error = mensajeError(err, 'Error al calcular el scoring');
            this.cargando = false;
          }
        });
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar clientes');
        this.cargando = false;
      }
    });
  }

  reentrenar(): void {
    this.entrenando = true;
    this.cobranzaService.reentrenarModelo().subscribe({
      next: () => {
        this.entrenando = false;
        this.cargar();
      },
      error: (err) => {
        this.entrenando = false;
        this.error = mensajeError(err, 'Error al reentrenar el modelo');
      }
    });
  }
}
