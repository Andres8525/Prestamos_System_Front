import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { mensajeError } from '../services/cobranza.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  verClave = false;
  enviando = false;
  error = '';
  aviso = '';
  mostrarDemo = !environment.production;
  private volver = '/dashboard';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('sesion') === 'expirada') {
      this.aviso = 'Tu sesión terminó. Inicia sesión de nuevo para continuar.';
    }
    // Solo se aceptan rutas internas para evitar redirecciones a otros sitios.
    const destino = params.get('volver');
    if (destino && destino.startsWith('/') && !destino.startsWith('//')) {
      this.volver = destino;
    }
  }

  ingresar(): void {
    this.error = '';
    if (!this.email.trim() || !this.password) {
      this.error = 'Ingresa tu email y tu contraseña';
      return;
    }
    this.enviando = true;
    this.auth.iniciarSesion(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigateByUrl(this.volver),
      error: (err) => {
        this.enviando = false;
        this.error = mensajeError(err, 'No se pudo iniciar sesión');
      }
    });
  }
}
