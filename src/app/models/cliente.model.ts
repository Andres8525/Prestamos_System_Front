export interface Cliente {
  id?: number;
  cedula: string;
  nombre: string;
  direccion: string;
  telefono: string;
  cobradorId?: number | null;
  cobradorNombre?: string;
  zona?: string;
  ordenRuta?: number | null;
}
