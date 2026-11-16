export enum EstadoPago {
  AL_DIA = 'AL_DIA',
  PENDIENTE = 'PENDIENTE',
  ATRASADO = 'ATRASADO',
  PAGADO = 'PAGADO'
}

export enum TipoLiquidacion {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL'
}

export interface Prestamo {
  id?: number;
  clienteId?: number;
  clienteNombre?: string;
  cobradorId?: number;
  cobradorNombre?: string;
  monto: number;
  tasaInteres?: number;
  interes?: number;
  montoTotal?: number;
  tipoLiquidacion: TipoLiquidacion;
  numeroCuotas?: number;
  valorCuota?: number;
  fechaInicio?: string;
  fechaVencimiento?: string;
  estado: EstadoPago;
  probabilidadDefault?: number;
  nivelRiesgo?: string;
  aprobadoConAlerta?: boolean;
  totalPagado?: number;
  saldoPendiente?: number;
  cuotasPagadas?: number;
  cuotasPendientes?: number;
}

export interface SolicitudPrestamo {
  clienteId?: number;
  monto?: number;
  tipoLiquidacion: TipoLiquidacion;
  tasaInteres?: number;
  numeroCuotas?: number;
  cobradorId?: number;
  forzarAprobacion?: boolean;
}

export interface SimulacionPrestamo {
  monto: number;
  tasaInteres: number;
  interes: number;
  montoTotal: number;
  tipoLiquidacion: TipoLiquidacion;
  numeroCuotas: number;
  valorCuota: number;
  fechaInicio: string;
  fechaVencimiento: string;
}
