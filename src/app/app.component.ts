import { Component } from '@angular/core';
import { ServidorService } from './services/servidor.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(servidor: ServidorService) {
    // Apenas carga la app se despierta el backend y se mantiene activo mientras la pestaña esté abierta,
    // así el login no tiene que esperar a que Render arranque el servicio.
    servidor.iniciarLatido();
  }
}
