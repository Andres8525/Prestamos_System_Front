export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  permisos: string[];
}

export interface RespuestaAuth {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: UsuarioSesion;
}

/** Respuesta del primer paso del acceso: si el email ya tiene cuenta. */
export interface EstadoEmail {
  email: string;
  existe: boolean;
}

/** Sesión guardada en el navegador. */
export interface SesionGuardada {
  token: string;
  /** Momento de expiración en milisegundos (epoch). */
  expira: number;
  usuario: UsuarioSesion;
}
