import { EstadoPago } from './prestamo.model';

export interface Pago {
  id?: number;
  prestamoId: number;
  monto: number;
  montoPagado?: number;
  saldo?: number;
  fechaProgramada: Date;
  fechaPago?: Date;
  estado: EstadoPago;
  numero: number;
}

/** Resumen de las cuotas pendientes de un cliente (GET /api/pagos/clientes). */
export interface CuotasCliente {
  clienteId: number;
  clienteNombre: string;
  cedula: string;
  prestamos: number;
  cuotasPendientes: number;
  cuotasAtrasadas: number;
  saldoPendiente: number;
  proximaFecha: string;
}
