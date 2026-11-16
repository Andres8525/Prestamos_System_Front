import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { PrestamoService } from '../services/prestamo.service';
import { CobranzaService, mensajeError } from '../services/cobranza.service';
import { Prestamo } from '../models/prestamo.model';
import { Abono } from '../models/cobranza.model';
import { EstadoServidor, ServidorService } from '../services/servidor.service';
import { WorkersService } from '../services/workers.service';
import { GrpcService } from '../services/grpc.service';
import { AsistenteService } from '../services/asistente.service';

/** Estado de los componentes de la plataforma para la tarjeta del panel. */
interface EstadoPlataforma {
  servidor: EstadoServidor;
  workers: string | null;
  grpc: string | null;
  asistente: string | null;
}

interface Segmento {
  clave: string;
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  prestamos: Prestamo[] = [];
  abonosHoy: Abono[] = [];
  segmentos: Segmento[] = [];
  enMora: Prestamo[] = [];
  cargando = false;
  error = '';

  carteraActiva = 0;
  capitalPrestado = 0;
  recaudadoHoy = 0;
  saldoEnMora = 0;
  prestamosActivos = 0;
  clientesActivos = 0;

  plataforma: EstadoPlataforma = { servidor: 'comprobando', workers: null, grpc: null, asistente: null };
  private subs = new Subscription();

  constructor(
    private prestamoService: PrestamoService,
    private cobranzaService: CobranzaService,
    private servidor: ServidorService,
    private workers: WorkersService,
    private grpc: GrpcService,
    private asistente: AsistenteService
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
    this.cargarPlataforma();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Servidor, workers, gRPC y asistente: cada consulta es independiente y un fallo no afecta a las demás. */
  cargarPlataforma(): void {
    this.subs.add(this.servidor.estado$.subscribe((e) => (this.plataforma.servidor = e)));
    this.workers.estado().subscribe({
      next: (p) => (this.plataforma.workers = `${p.ocupados}/${p.hilos} hilos ocupados · ${p.enCola} en cola`),
      error: () => (this.plataforma.workers = 'no disponible')
    });
    this.grpc.info().subscribe({
      next: (i) => (this.plataforma.grpc = i.activo ? `activo en el puerto ${i.puerto}` : 'detenido'),
      error: () => (this.plataforma.grpc = 'no disponible')
    });
    this.asistente.estado().subscribe({
      next: (a) => (this.plataforma.asistente = a.configurado ? `Groq · ${a.modelo}` : 'modo local (sin GROQ_API_KEY)'),
      error: () => (this.plataforma.asistente = 'no disponible')
    });
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({
      prestamos: this.prestamoService.obtenerPrestamos(),
      abonos: this.cobranzaService.abonosDelDia()
    }).subscribe({
      next: ({ prestamos, abonos }) => {
        this.prestamos = prestamos;
        this.abonosHoy = abonos;
        this.calcular();
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'No se pudieron cargar los datos del panel');
        this.cargando = false;
      }
    });
  }

  get indiceMora(): number {
    return this.carteraActiva ? this.saldoEnMora / this.carteraActiva : 0;
  }

  private calcular(): void {
    const activos = this.prestamos.filter((p) => p.estado !== 'PAGADO');
    const suma = (lista: Prestamo[], campo: (p: Prestamo) => number | undefined) =>
      Math.round(lista.reduce((t, p) => t + (campo(p) ?? 0), 0) * 100) / 100;

    this.prestamosActivos = activos.length;
    this.clientesActivos = new Set(activos.map((p) => p.clienteId)).size;
    this.carteraActiva = suma(activos, (p) => p.saldoPendiente);
    this.capitalPrestado = suma(activos, (p) => p.monto);
    this.recaudadoHoy = Math.round(this.abonosHoy.reduce((t, a) => t + a.monto, 0) * 100) / 100;

    this.enMora = activos
      .filter((p) => p.estado === 'ATRASADO')
      .sort((a, b) => (b.saldoPendiente ?? 0) - (a.saldoPendiente ?? 0));
    this.saldoEnMora = suma(this.enMora, (p) => p.saldoPendiente);

    const total = this.prestamos.length || 1;
    const definir = (clave: string, etiqueta: string): Segmento => {
      const cantidad = this.prestamos.filter((p) => p.estado === clave).length;
      return { clave, etiqueta, cantidad, porcentaje: Math.round((cantidad / total) * 1000) / 10 };
    };
    this.segmentos = [
      definir('AL_DIA', 'Al día'),
      definir('PENDIENTE', 'Pendientes'),
      definir('ATRASADO', 'Atrasados'),
      definir('PAGADO', 'Pagados')
    ];
  }
}
