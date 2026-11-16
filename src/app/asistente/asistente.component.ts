import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AsistenteService } from '../services/asistente.service';
import { mensajeError } from '../services/cobranza.service';
import { EstadoAsistente, LARGO_MAXIMO_PREGUNTA, MensajeChat, SUGERENCIAS_ASISTENTE } from '../models/asistente.model';

/** Chat con el asistente de IA (Groq) sobre la cartera. */
@Component({
  selector: 'app-asistente',
  standalone: false,
  templateUrl: './asistente.component.html'
})
export class AsistenteComponent implements OnInit {
  @ViewChild('conversacion') conversacion?: ElementRef<HTMLElement>;

  estado: EstadoAsistente | null = null;
  mensajes: MensajeChat[] = [];
  pregunta = '';
  enviando = false;
  readonly sugerencias = SUGERENCIAS_ASISTENTE;
  readonly largoMaximo = LARGO_MAXIMO_PREGUNTA;

  constructor(private asistente: AsistenteService) {}

  ngOnInit(): void {
    this.asistente.estado().subscribe({
      next: (e) => (this.estado = e),
      error: () => (this.estado = null)
    });
  }

  get puedeEnviar(): boolean {
    const p = this.pregunta.trim();
    return !this.enviando && p.length > 0 && p.length <= this.largoMaximo;
  }

  enviar(texto?: string): void {
    const pregunta = (texto ?? this.pregunta).trim();
    if (!pregunta || this.enviando || pregunta.length > this.largoMaximo) return;
    this.mensajes.push({ rol: 'usuario', texto: pregunta, hora: new Date() });
    this.pregunta = '';
    this.enviando = true;
    this.desplazar();
    this.asistente.preguntar(pregunta).subscribe({
      next: (r) => {
        this.mensajes.push({ rol: 'asistente', texto: r.texto, origen: r.origen, modelo: r.modelo, tokens: r.tokens, hora: new Date() });
        this.enviando = false;
        this.desplazar();
      },
      error: (err) => {
        this.mensajes.push({ rol: 'error', texto: mensajeError(err, 'El asistente no pudo responder'), hora: new Date() });
        this.enviando = false;
        this.desplazar();
      }
    });
  }

  /** Enter envía; Shift+Enter agrega una línea. */
  alPresionar(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      this.enviar();
    }
  }

  limpiar(): void {
    this.mensajes = [];
  }

  private desplazar(): void {
    setTimeout(() => {
      const el = this.conversacion?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
