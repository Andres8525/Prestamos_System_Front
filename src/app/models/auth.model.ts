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

/** Sesión guardada en el navegador. */
export interface SesionGuardada {
  token: string;
  /** Momento de expiración en milisegundos (epoch). */
  expira: number;
  usuario: UsuarioSesion;
}
