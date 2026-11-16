import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { authGuard, invitadoGuard } from './auth/auth.guard';

const routes: Routes = [
  // Zona pública
  { path: 'login', component: LoginComponent, canActivate: [invitadoGuard], title: 'Iniciar sesión · CrediRuta' },
  { path: 'registro', component: RegisterComponent, canActivate: [invitadoGuard], title: 'Crear cuenta · CrediRuta' },

  // Zona privada: requiere sesión
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, title: 'Panel · CrediRuta' },
      { path: 'clientes', component: ListClientesComponent, title: 'Clientes · CrediRuta' },
      { path: 'prestamos', component: ListPrestamosComponent, title: 'Préstamos · CrediRuta' },
      { path: 'pagos', component: ListPagosComponent, title: 'Cuotas · CrediRuta' },
      { path: 'cobradores', component: ListCobradoresComponent, title: 'Cobradores · CrediRuta' },
      { path: 'ruta', component: RutaCobroComponent, title: 'Ruta de cobro · CrediRuta' },
      { path: 'caja', component: CuadreCajaComponent, title: 'Cuadre de caja · CrediRuta' },
      { path: 'scoring', component: ScoringRiesgoComponent, title: 'Scoring IA · CrediRuta' }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
