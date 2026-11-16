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

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'clientes', component: ListClientesComponent },
  { path: 'prestamos', component: ListPrestamosComponent },
  { path: 'pagos', component: ListPagosComponent },
  { path: 'cobradores', component: ListCobradoresComponent },
  { path: 'ruta', component: RutaCobroComponent },
  { path: 'caja', component: CuadreCajaComponent },
  { path: 'scoring', component: ScoringRiesgoComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
