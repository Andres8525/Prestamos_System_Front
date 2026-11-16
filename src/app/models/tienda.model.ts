import { TipoLiquidacion } from './prestamo.model';

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  categoria: string;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
  activo?: boolean;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export type TipoPago = 'CONTADO' | 'CREDITO';

/** Compra que se envía al backend. Los campos de crédito solo aplican si tipoPago es CREDITO. */
export interface SolicitudPedido {
  clienteId: number;
  tipoPago: TipoPago;
  items: { productoId: number; cantidad: number }[];
  tipoLiquidacion?: TipoLiquidacion;
  numeroCuotas?: number;
  tasaInteres?: number;
  cobradorId?: number;
  forzarAprobacion?: boolean;
}

export interface LineaPedido {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  clienteNombre: string;
  fecha: string;
  tipoPago: TipoPago;
  total: number;
  unidades: number;
  prestamoId?: number | null;
  totalFinanciado?: number | null;
  valorCuota?: number | null;
  numeroCuotas?: number | null;
  nivelRiesgo?: string | null;
  detalles: LineaPedido[];
}
