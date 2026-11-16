import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { MlService } from '../services/ml.service';
import { TiempoRealService } from '../services/tiempo-real.service';
import { NotificacionService } from '../services/notificacion.service';
import { mensajeError } from '../services/cobranza.service';
import { Scoring } from '../models/cobranza.model';
import { EntradaSimulacion, Entrenamiento, ETIQUETAS_VARIABLES, PuntoRoc, ResumenModelo } from '../models/ml.model';

/** Perfiles de pago de ejemplo para el simulador. */
const PERFILES: Record<string, EntradaSimulacion> = {
  bueno: { promedioDiasAtraso: 0.5, maxDiasAtraso: 2, tasaCuotasAtrasadas: 0.05, tasaAbonosIncompletos: 0.05,
           frecuenciaPago: 1.0, tasaSaldoVencido: 0.02, prestamosPagados: 3 },
  irregular: { promedioDiasAtraso: 5, maxDiasAtraso: 14, tasaCuotasAtrasadas: 0.4, tasaAbonosIncompletos: 0.45,
               frecuenciaPago: 0.7, tasaSaldoVencido: 0.25, prestamosPagados: 1 },
  moroso: { promedioDiasAtraso: 18, maxDiasAtraso: 45, tasaCuotasAtrasadas: 0.85, tasaAbonosIncompletos: 0.75,
            frecuenciaPago: 0.3, tasaSaldoVencido: 0.65, prestamosPagados: 0 }
};

/** Panel del modelo de Machine Learning: evaluación, comparación de algoritmos, ROC, importancia y simulador. */
@Component({
  selector: 'app-machine-learning',
  standalone: false,
  templateUrl: './machine-learning.component.html'
})
export class MachineLearningComponent implements OnInit, OnDestroy {
  resumen: ResumenModelo | null = null;
  entrenamientos: Entrenamiento[] = [];
  cargando = false;
  entrenando = false;
  error = '';

  entrada: EntradaSimulacion = { ...PERFILES['bueno'] };
  simulacion: Scoring | null = null;
  private cambios = new Subject<EntradaSimulacion>();
  private subs = new Subscription();

  constructor(private ml: MlService, private notificaciones: NotificacionService,
              private tiempoReal: TiempoRealService) {}

  ngOnInit(): void {
    this.cargar();
    // El simulador recalcula en el servidor 250 ms después del último cambio de un deslizador.
    this.subs.add(
      this.cambios
        .pipe(debounceTime(250), switchMap((e) => this.ml.simular(e)))
        .subscribe({ next: (s) => (this.simulacion = s), error: () => (this.simulacion = null) })
    );
    this.simular();
    this.subs.add(this.tiempoReal.de('MODELO_ENTRENADO').subscribe(() => {
      if (!this.entrenando) {
        this.cargar();
        this.simular();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.ml.resumen().subscribe({
      next: (r) => {
        this.resumen = r;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'No se pudo cargar el modelo');
        this.cargando = false;
      }
    });
    this.ml.entrenamientos().subscribe({ next: (e) => (this.entrenamientos = e) });
  }

  reentrenar(): void {
    this.entrenando = true;
    this.ml.reentrenar().subscribe({
      next: (r) => {
        this.resumen = r;
        this.entrenando = false;
        this.notificaciones.exito(`Modelo reentrenado: ${r.modelo.algoritmo} (AUC ${r.evaluacionPrueba.auc.toFixed(3)})`);
        this.ml.entrenamientos().subscribe({ next: (e) => (this.entrenamientos = e) });
        this.simular();
      },
      error: (err) => {
        this.entrenando = false;
        this.error = mensajeError(err, 'No se pudo reentrenar el modelo');
      }
    });
  }

  // ---------------------------------------------------------------- simulador

  simular(): void {
    this.cambios.next({ ...this.entrada, maxDiasAtraso: Math.max(this.entrada.maxDiasAtraso, this.entrada.promedioDiasAtraso) });
  }

  aplicarPerfil(nombre: string): void {
    this.entrada = { ...PERFILES[nombre] };
    this.simular();
  }

  get claseMedidor(): string {
    return this.simulacion ? this.simulacion.nivelRiesgo.toLowerCase() : 'bajo';
  }

  // ---------------------------------------------------------------- gráficos

  /** Variables ordenadas por importancia. */
  get importancia(): [string, number][] {
    return Object.entries(this.resumen?.modelo.importancia ?? {}).sort((a, b) => b[1] - a[1]);
  }

  /** Puntos de la curva ROC ordenados por tasa de falsos positivos (coordenadas 0–100 del SVG). */
  get puntosRoc(): PuntoRoc[] {
    const puntos = [...(this.resumen?.evaluacionPrueba.curvaRoc ?? [])];
    return puntos.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  }

  get rutaRoc(): string {
    return this.puntosRoc.map((p, i) => `${i ? 'L' : 'M'}${(p.fpr * 100).toFixed(2)} ${(100 - p.tpr * 100).toFixed(2)}`).join(' ');
  }

  get areaRoc(): string {
    return this.rutaRoc ? `${this.rutaRoc} L100 100 L0 100 Z` : '';
  }

  etiqueta(variable: string): string {
    return ETIQUETAS_VARIABLES[variable] ?? variable;
  }
}
