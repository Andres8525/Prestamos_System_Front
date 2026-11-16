import { Component, OnInit } from '@angular/core';
import { CobranzaService, mensajeError } from '../services/cobranza.service';
import { Cobrador } from '../models/cobranza.model';

@Component({
  selector: 'app-list-cobradores',
  standalone: false,
  templateUrl: './list-cobradores.component.html'
})
export class ListCobradoresComponent implements OnInit {
  cobradores: Cobrador[] = [];
  form: Cobrador = this.vacio();
  enEdicion: Cobrador | null = null;
  mostraFormulario = false;
  cargando = false;
  error = '';

  constructor(private cobranzaService: CobranzaService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.cobranzaService.obtenerCobradores().subscribe({
      next: (d) => {
        this.cobradores = d;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeError(err, 'Error al cargar cobradores');
        this.cargando = false;
      }
    });
  }

  toggleFormulario(): void {
    this.mostraFormulario = !this.mostraFormulario;
    if (!this.mostraFormulario) this.limpiar();
  }

  editar(c: Cobrador): void {
    this.enEdicion = c;
    this.form = { ...c };
    this.mostraFormulario = true;
  }

  guardar(): void {
    if (!this.form.nombre?.trim() || !this.form.documento?.trim() || !this.form.zona?.trim()) {
      this.error = 'Nombre, documento y zona son obligatorios';
      return;
    }
    const op = this.enEdicion?.id
      ? this.cobranzaService.actualizarCobrador(this.enEdicion.id, this.form)
      : this.cobranzaService.crearCobrador(this.form);
    op.subscribe({
      next: () => {
        this.cargar();
        this.limpiar();
        this.mostraFormulario = false;
      },
      error: (err) => (this.error = mensajeError(err, 'Error al guardar el cobrador'))
    });
  }

  desactivar(c: Cobrador): void {
    if (!c.id || !confirm(`¿Desactivar a ${c.nombre}? Conservará su historial.`)) return;
    this.cobranzaService.desactivarCobrador(c.id).subscribe({
      next: () => this.cargar(),
      error: (err) => (this.error = mensajeError(err, 'Error al desactivar'))
    });
  }

  limpiar(): void {
    this.form = this.vacio();
    this.enEdicion = null;
    this.error = '';
  }

  private vacio(): Cobrador {
    return { nombre: '', documento: '', zona: '', telefono: '', email: '', cajaBase: 0, activo: true };
  }
}
