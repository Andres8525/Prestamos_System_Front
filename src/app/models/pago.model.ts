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
