import { Component, OnInit } from '@angular/core';
import { GrpcService } from '../services/grpc.service';
import { mensajeError } from '../services/cobranza.service';
import { InfoGrpc, MetodoGrpc, PATRONES_GRPC, PatronGrpc } from '../models/grpc.model';

/** Panel del servidor gRPC: servicios, patrón de cada método, métricas de uso y contratos .proto. */
@Component({
  selector: 'app-grpc',
  standalone: false,
  templateUrl: './grpc.component.html'
})
export class GrpcComponent implements OnInit {
  info: InfoGrpc | null = null;
  contratos: Record<string, string> = {};
  archivo = '';
  cargando = false;
  error = '';
  copiado = false;
  readonly patrones = PATRONES_GRPC;
  readonly leyenda: PatronGrpc[] = ['UNARY', 'SERVER_STREAMING', 'CLIENT_STREAMING', 'BIDI_STREAMING'];

  constructor(private grpc: GrpcService) {}

  ngOnInit(): void {
    this.cargar();
    this.grpc.contratos().subscribe({
      next: (c) => {
        this.contratos = c;
        this.archivo = Object.keys(c)[1] ?? Object.keys(c)[0] ?? '';
      }
    });
  }

  cargar(): void {
    this.cargando = true;
    this.grpc.info().subscribe({
      next: (i) => {
        this.info = i;
        this.cargando = false;
        this.error = '';
      },
      error: (err) => {
        this.cargando = false;
        this.error = mensajeError(err, 'No se pudo consultar el servidor gRPC');
      }
    });
  }

  get archivos(): string[] {
    return Object.keys(this.contratos);
  }

  get totalLlamadas(): number {
    return this.info?.servicios.reduce((t, s) => t + s.metodos.reduce((a, m) => a + m.llamadas, 0), 0) ?? 0;
  }

  get totalMetodos(): number {
    return this.info?.servicios.reduce((t, s) => t + s.metodos.length, 0) ?? 0;
  }

  /** Servicios de negocio primero; health y reflection al final. */
  esInfraestructura(nombre: string): boolean {
    return nombre.startsWith('grpc.');
  }

  tasaError(m: MetodoGrpc): number {
    return m.llamadas ? m.errores / m.llamadas : 0;
  }

  /** Ejemplo de llamada con grpcurl para el método indicado. */
  ejemplo(servicio: string, metodo: string): string {
    return `grpcurl -plaintext -H "authorization: Bearer $TOKEN" localhost:${this.info?.puerto ?? 9090} ${servicio}/${metodo}`;
  }

  copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).then(() => {
      this.copiado = true;
      setTimeout(() => (this.copiado = false), 1500);
    });
  }
}
