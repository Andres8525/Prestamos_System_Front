import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { mensajeError } from '../services/cobranza.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  confirmar = '';
  verClave = false;
  enviando = false;
  intentado = false;
  error = '';

  private readonly etiquetas = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

  constructor(
    private auth: AuthService,
    private router: Router,
    private notificaciones: NotificacionService
  ) {}

  /** Fortaleza de 0 a 4 según longitud y variedad de caracteres. */
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

  get emailValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
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
    if (!this.nombre.trim() || !this.emailValido || !this.claveValida || !this.clavesCoinciden) {
      this.error = 'Revisa los campos marcados';
      return;
    }
    this.enviando = true;
    this.auth.registrar(this.nombre.trim(), this.email.trim(), this.password).subscribe({
      next: (r) => {
        this.notificaciones.exito(`¡Cuenta creada! Bienvenido, ${r.usuario.nombre}.`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No se pudo crear la cuenta');
      }
    });
  }
}
