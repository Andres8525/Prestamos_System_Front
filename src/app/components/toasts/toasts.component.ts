import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toasts" aria-live="polite">
      @for (n of notificaciones.notificaciones$ | async; track n.id) {
        <div class="toast" [ngClass]="'toast-' + n.tipo" role="status">
          <span class="toast-icono">{{ n.tipo === 'exito' ? '✓' : n.tipo === 'error' ? '!' : 'i' }}</span>
          <span class="toast-texto">{{ n.mensaje }}</span>
          <button type="button" class="toast-cerrar" (click)="notificaciones.cerrar(n.id)" aria-label="Cerrar aviso">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; max-width: min(380px, calc(100vw - 40px)); }
    .toast { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background: var(--superficie); color: var(--texto);
      box-shadow: var(--sombra-lg); border-left: 4px solid var(--primario); font-size: 13px; animation: toast-entra .35s cubic-bezier(.21,1.02,.73,1) both; }
    .toast-exito { border-left-color: var(--exito); }
    .toast-error { border-left-color: var(--peligro); }
    .toast-icono { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 12px; color: #fff; background: var(--primario); }
    .toast-exito .toast-icono { background: var(--exito); }
    .toast-error .toast-icono { background: var(--peligro); }
    .toast-texto { flex: 1; line-height: 1.4; }
    .toast-cerrar { border: none; background: none; cursor: pointer; font-size: 18px; line-height: 1; color: var(--texto-suave); }
    @keyframes toast-entra { from { opacity: 0; transform: translateX(40px) scale(.96); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  `]
})
export class ToastsComponent {
  constructor(public notificaciones: NotificacionService) {}
}
