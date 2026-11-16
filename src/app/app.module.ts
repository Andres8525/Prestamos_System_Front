import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListClientesComponent } from './clientes/list-clientes.component';
import { ListPrestamosComponent } from './prestamos/list-prestamos.component';
import { ListPagosComponent } from './pagos/list-pagos.component';
import { ListCobradoresComponent } from './cobradores/list-cobradores.component';
import { RutaCobroComponent } from './ruta/ruta-cobro.component';
import { CuadreCajaComponent } from './caja/cuadre-caja.component';
import { ScoringRiesgoComponent } from './scoring/scoring-riesgo.component';
import { AccesoComponent } from './auth/acceso.component';
import { MachineLearningComponent } from './ml/machine-learning.component';
import { ShellComponent } from './layout/shell.component';
import { authInterceptor } from './auth/auth.interceptor';

// Standalone components
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';
import { ToastsComponent } from './components/toasts/toasts.component';
import { AccesoFondoComponent } from './auth/acceso-fondo.component';

@NgModule({
  declarations: [
    AppComponent,
    ShellComponent,
    AccesoComponent,
    DashboardComponent,
    ListClientesComponent,
    ListPrestamosComponent,
    ListPagosComponent,
    ListCobradoresComponent,
    RutaCobroComponent,
    CuadreCajaComponent,
    ScoringRiesgoComponent,
    MachineLearningComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NavMenuComponent,
    ToastsComponent,
    AccesoFondoComponent
  ],
  providers: [
    // Angular 21 trabaja sin zone.js por defecto: sin esto la vista no se actualiza
    // cuando llega una respuesta HTTP (botones colgados en "Ingresando…", listas sin cargar).
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
