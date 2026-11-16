import { NgModule } from '@angular/core';
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
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { ShellComponent } from './layout/shell.component';
import { authInterceptor } from './auth/auth.interceptor';

// Standalone components
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';
import { ToastsComponent } from './components/toasts/toasts.component';
import { AuthMarcaComponent } from './auth/auth-marca.component';

@NgModule({
  declarations: [
    AppComponent,
    ShellComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ListClientesComponent,
    ListPrestamosComponent,
    ListPagosComponent,
    ListCobradoresComponent,
    RutaCobroComponent,
    CuadreCajaComponent,
    ScoringRiesgoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NavMenuComponent,
    ToastsComponent,
    AuthMarcaComponent
  ],
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
  bootstrap: [AppComponent]
})
export class AppModule {}
