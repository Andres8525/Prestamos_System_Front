import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EstadoServidor, ServidorService } from '../services/servidor.service';
import { NotificacionService } from '../services/notificacion.service';
import { mensajeError } from '../services/cobranza.service';
import { environment } from '../environments/environment';

/** Paso actual del acceso. */
export type PasoAcceso = 'email' | 'clave' | 'registro';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Acceso unificado en dos pasos:
 * 1) se ingresa el email; 2) si tiene cuenta se pide la contraseña, si no se ofrece crear la cuenta.
 */
@Component({
  selector: 'app-acceso',
  standalone: false,
  templateUrl: './acceso.component.html'
})
export class AccesoComponent implements OnInit, OnDestroy {
  paso: PasoAcceso = 'email';
  /** true si se entró por /registro (cambia los textos del primer paso). */
  modoRegistro = false;

  email = '';
  password = '';
  nombre = '';
  confirmar = '';
  verClave = false;

  enviando = false;
  intentado = false;
  error = '';
  aviso = '';
  /** Estado de la conexión con el servidor: null = comprobando. */
  servidorDisponible: boolean | null = null;
  /** Estado detallado para el indicador del login. */
  estadoServidor: EstadoServidor = 'comprobando';
  mostrarDemo = !environment.production;

  private volver = '/dashboard';
  private subs = new Subscription();
  private readonly etiquetas = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

  constructor(
    private auth: AuthService,
    private servidor: ServidorService,
    private router: Router,
    private route: ActivatedRoute,
    private notificaciones: NotificacionService
  ) {}

  ngOnInit(): void {
    this.modoRegistro = this.route.snapshot.data['modo'] === 'registro';
    const params = this.route.snapshot.queryParamMap;
    if (params.get('sesion') === 'expirada') {
      this.aviso = 'Tu sesión terminó. Ingresa de nuevo para continuar.';
    }
    // Solo rutas internas, para no redirigir a otros sitios.
    const destino = params.get('volver');
    if (destino && destino.startsWith('/') && !destino.startsWith('//')) this.volver = destino;

    // Se "despierta" el servidor mientras el usuario escribe su email (normalmente ya está en línea
    // porque la app lo mantiene activo) y se muestra su estado en el indicador.
    this.subs.add(this.servidor.estado$.subscribe((e) => (this.estadoServidor = e)));
    this.subs.add(this.servidor.despertar().subscribe((ok) => (this.servidorDisponible = ok)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get emailValido(): boolean {
    return PATRON_EMAIL.test(this.email.trim());
  }

  // ---------------------------------------------------------------- paso 1: email

  continuar(): void {
    this.intentado = true;
    this.error = '';
    if (!this.emailValido) {
      this.error = 'Ingresa un email válido.';
      return;
    }
    this.enviando = true;
    this.auth.verificarEmail(this.email.trim()).subscribe({
      next: (r) => {
        this.enviando = false;
        this.intentado = false;
        this.servidorDisponible = true;
        this.email = r.email;
        this.irA(r.existe ? 'clave' : 'registro');
        if (r.existe && this.modoRegistro) {
          this.aviso = 'Ese email ya tiene una cuenta: ingresa tu contraseña.';
        }
      },
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No se pudo verificar el email.');
      }
    });
  }

  cambiarEmail(): void {
    this.password = '';
    this.confirmar = '';
    this.aviso = '';
    this.irA('email');
  }

  // ---------------------------------------------------------------- paso 2: contraseña

  ingresar(): void {
    this.error = '';
    if (!this.password) {
      this.error = 'Ingresa tu contraseña.';
      return;
    }
    this.enviando = true;
    this.auth.iniciarSesion(this.email, this.password).subscribe({
      next: (r) => {
        this.notificaciones.exito(`Hola de nuevo, ${r.usuario.nombre.split(' ')[0]}.`);
        this.router.navigateByUrl(this.volver);
      },
      error: (err) => {
        this.enviando = false;
        this.password = '';
        this.error = mensajeError(err, 'No se pudo iniciar sesión.');
      }
    });
  }

  // ---------------------------------------------------------------- paso 2: crear cuenta

  /** Fortaleza de 1 a 4 según longitud y variedad de caracteres. */
  get fortaleza(): number {
    const p = this.password;
    if (!p) return 0;
    let puntos = 0;
    if (p.length >= 8) puntos++;
    if (p.length >= 12) puntos++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) puntos++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) puntos++;
    return Math.max(1, puntos);
  }

  get etiquetaFortaleza(): string {
    return this.etiquetas[this.fortaleza];
  }

  /** Mismas reglas que valida el servidor: 8+ caracteres con letras y números. */
  get claveValida(): boolean {
    return this.password.length >= 8 && /[A-Za-z]/.test(this.password) && /\d/.test(this.password);
  }

  get clavesCoinciden(): boolean {
    return this.password === this.confirmar;
  }

  registrar(): void {
    this.intentado = true;
    this.error = '';
    if (!this.nombre.trim() || !this.claveValida || !this.clavesCoinciden) {
      this.error = 'Revisa los campos marcados.';
      return;
    }
    this.enviando = true;
    this.auth.registrar(this.nombre.trim(), this.email, this.password).subscribe({
      next: (r) => {
        this.notificaciones.exito(`¡Cuenta creada! Bienvenido, ${r.usuario.nombre.split(' ')[0]}.`);
        this.router.navigateByUrl(this.volver);
      },
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No se pudo crear la cuenta.');
      }
    });
  }

  // ---------------------------------------------------------------- utilidades

  get textoServidor(): string {
    switch (this.estadoServidor) {
      case 'en-linea': return 'Servidor en línea';
      case 'despertando': return 'Despertando el servidor…';
      case 'sin-conexion': return 'Sin conexión con el servidor';
      default: return 'Conectando…';
    }
  }

  reintentarConexion(): void {
    this.servidor.despertar().subscribe((ok) => (this.servidorDisponible = ok));
  }

  private irA(paso: PasoAcceso): void {
    this.paso = paso;
    this.error = '';
    this.verClave = false;
    const foco = paso === 'email' ? 'acceso-email' : paso === 'clave' ? 'acceso-clave' : 'acceso-nombre';
    setTimeout(() => document.getElementById(foco)?.focus(), 60);
  }
}
