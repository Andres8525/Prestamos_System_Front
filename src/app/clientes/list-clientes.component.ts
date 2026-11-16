import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../models/cliente.model';
import { Cobrador } from '../models/cobranza.model';
import { CobranzaService } from '../services/cobranza.service';
import { WebWorkerService, descargarArchivo } from '../services/web-worker.service';

@Component({
  selector: 'app-list-clientes',
  standalone: false,
  templateUrl: './list-clientes.component.html',
  styleUrls: ['./list-clientes.component.css']
})
export class ListClientesComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  exportando = false;
  busqueda = '';
  /** Resultado del buscador; null = sin búsqueda activa (se muestran todos). */
  encontrados: Cliente[] | null = null;
  private textoBusqueda = new Subject<string>();
  private subBusqueda?: Subscription;
  cobradores: Cobrador[] = [];
  nuevoCliente: Cliente = { cedula: '', nombre: '', direccion: '', telefono: '' };
  mostraFormulario = false;
  clienteEnEdicion: Cliente | null = null;
  cargando = false;
  error = '';

  constructor(private clienteService: ClienteService, private cobranzaService: CobranzaService,
              private workers: WebWorkerService) {}

  /** Exporta la lista a CSV; el archivo se arma en un Web Worker. */
  exportarCsv(): void {
    this.exportando = true;
    this.workers.csv({
      columnas: [
        { clave: 'id', titulo: 'ID' }, { clave: 'cedula', titulo: 'Cédula' }, { clave: 'nombre', titulo: 'Nombre' },
        { clave: 'direccion', titulo: 'Dirección' }, { clave: 'telefono', titulo: 'Teléfono' },
        { clave: 'cobradorNombre', titulo: 'Cobrador' }, { clave: 'zona', titulo: 'Zona' }, { clave: 'ordenRuta', titulo: 'Orden en ruta' }
      ],
      filas: this.clientes as unknown as Record<string, unknown>[]
    }).subscribe({
      next: (csv) => descargarArchivo(`clientes-${new Date().toISOString().slice(0, 10)}.csv`, csv),
      error: () => (this.error = 'No se pudo generar el CSV'),
      complete: () => (this.exportando = false)
    });
  }

  get clientesVisibles(): Cliente[] {
    return this.encontrados ?? this.clientes;
  }

  buscar(texto: string): void {
    this.textoBusqueda.next(texto.trim());
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.buscar('');
  }

  ngOnDestroy(): void {
    this.subBusqueda?.unsubscribe();
  }

  ngOnInit(): void {
    this.subBusqueda = this.textoBusqueda
      .pipe(debounceTime(250), distinctUntilChanged(),
            switchMap((t) => (t ? this.clienteService.buscar(t) : of(null))))
      .subscribe({ next: (r) => (this.encontrados = r), error: () => (this.encontrados = null) });
    this.cargarClientes();
    this.cobranzaService.obtenerCobradores(true).subscribe({ next: (d) => (this.cobradores = d) });
  }

  cargarClientes(): void {
    this.cargando = true;
    this.clienteService.obtenerClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'No se pudo conectar con el servidor. Verifique que el backend esté activo.';
        this.cargando = false;
        console.error(err);
      }
    });
  }

  toggleFormulario(): void {
    this.mostraFormulario = !this.mostraFormulario;
    if (!this.mostraFormulario) {
      this.limpiarFormulario();
    }
  }

  guardarCliente(): void {
    if (!this.validarFormulario()) return;
    this.clienteEnEdicion ? this.actualizarCliente() : this.crearCliente();
  }

  crearCliente(): void {
    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: () => {
        this.cargarClientes();
        this.limpiarFormulario();
        this.mostraFormulario = false;
      },
      error: (err) => {
        this.error = this.extraerMensajeError(err, 'Error al crear el cliente');
        console.error(err);
      }
    });
  }

  editarCliente(cliente: Cliente): void {
    this.clienteEnEdicion = cliente;
    this.nuevoCliente = { ...cliente };
    this.mostraFormulario = true;
  }

  actualizarCliente(): void {
    if (!this.clienteEnEdicion?.id) return;
    this.clienteService.actualizarCliente(this.clienteEnEdicion.id, this.nuevoCliente).subscribe({
      next: () => {
        this.cargarClientes();
        this.limpiarFormulario();
        this.mostraFormulario = false;
      },
      error: (err) => {
        this.error = this.extraerMensajeError(err, 'Error al actualizar el cliente');
        console.error(err);
      }
    });
  }

  eliminarCliente(id: number | undefined): void {
    if (!id || !confirm('¿Está seguro de que desea eliminar este cliente?')) return;
    this.clienteService.eliminarCliente(id).subscribe({
      next: () => this.cargarClientes(),
      error: (err) => {
        this.error = this.extraerMensajeError(err, 'Error al eliminar el cliente');
        console.error(err);
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.nuevoCliente.cedula.trim()) { this.error = 'La cédula es obligatoria'; return false; }
    if (!this.nuevoCliente.nombre.trim()) { this.error = 'El nombre es obligatorio'; return false; }
    if (!this.nuevoCliente.direccion.trim()) { this.error = 'La dirección es obligatoria'; return false; }
    if (!this.nuevoCliente.telefono.trim()) { this.error = 'El teléfono es obligatorio'; return false; }
    this.error = '';
    return true;
  }

  limpiarFormulario(): void {
    this.nuevoCliente = { cedula: '', nombre: '', direccion: '', telefono: '' };
    this.clienteEnEdicion = null;
    this.error = '';
  }

  private extraerMensajeError(err: any, fallback: string): string {
    if (err?.error) {
      // { "error": "mensaje" }  →  mensaje directo
      if (typeof err.error === 'string') return err.error;
      if (err.error.error) return err.error.error;
      // { "campo": "mensaje", ... }  →  primer campo con error
      const campos = Object.entries(err.error as Record<string, string>);
      if (campos.length > 0) return campos.map(([c, m]) => `${c}: ${m}`).join(' | ');
    }
    return fallback;
  }
}
