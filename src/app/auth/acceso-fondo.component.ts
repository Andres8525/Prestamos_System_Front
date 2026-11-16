import { Component } from '@angular/core';

/** Fondo decorativo de la pantalla de acceso: cielo estrellado, aurora animada y montañas nevadas. */
@Component({
  selector: 'app-acceso-fondo',
  standalone: true,
  template: `
    <div class="acceso-estrellas" aria-hidden="true"></div>
    <div class="acceso-aurora" aria-hidden="true">
      <span class="banda-1"></span>
      <span class="banda-2"></span>
      <span class="banda-3"></span>
    </div>
    <svg class="acceso-montanas" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="nieve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e2e8f0" stop-opacity="0.95" />
          <stop offset="0.35" stop-color="#94a3b8" stop-opacity="0.55" />
          <stop offset="1" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="roca" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1e293b" />
          <stop offset="1" stop-color="#020617" />
        </linearGradient>
      </defs>
      <path fill="url(#roca)" opacity="0.9"
            d="M0 210 L120 150 L210 190 L330 110 L430 170 L560 90 L680 165 L790 120 L900 180 L1030 100 L1150 160 L1270 120 L1440 190 L1440 320 L0 320 Z" />
      <path fill="url(#nieve)"
            d="M0 250 L90 205 L170 235 L290 165 L380 220 L470 185 L600 250 L720 175 L840 240 L960 195 L1090 245 L1200 185 L1320 230 L1440 205 L1440 320 L0 320 Z" />
      <path fill="#020617" d="M0 290 L180 270 L380 292 L620 268 L860 290 L1100 270 L1300 288 L1440 276 L1440 320 L0 320 Z" />
    </svg>
  `,
  styles: [':host { position: absolute; inset: 0; pointer-events: none; }']
})
export class AccesoFondoComponent {}
