import { Component } from '@angular/core';

/** Panel de marca animado que comparten las pantallas de login y registro. */
@Component({
  selector: 'app-auth-marca',
  standalone: true,
  template: `
    <aside class="auth-marca">
      <span class="auth-burbuja b1"></span>
      <span class="auth-burbuja b2"></span>
      <span class="auth-burbuja b3"></span>

      <div class="auth-logo">
        <img src="favicon.svg" alt="" />
        <span>CrediRuta</span>
      </div>

      <div class="auth-lema">
        <h2>Tu cartera de microcréditos, <span>bajo control cada día</span></h2>
        <p>Préstamos, rutas de cobro, cuadre de caja y riesgo crediticio en una sola plataforma.</p>
        <ul class="auth-puntos">
          <li><span class="icono">📍</span> Rutas de cobro diario por agente</li>
          <li><span class="icono">💵</span> Abonos y cuadre de caja en tiempo real</li>
          <li><span class="icono">🤖</span> Scoring de riesgo con inteligencia artificial</li>
          <li><span class="icono">🛒</span> Tienda con ventas financiadas a crédito</li>
        </ul>
      </div>

      <p class="auth-pie">© {{ anio }} CrediRuta · Gestión de microfinanzas</p>
    </aside>
  `,
  styles: [':host { display: contents; }']
})
export class AuthMarcaComponent {
  anio = new Date().getFullYear();
}
