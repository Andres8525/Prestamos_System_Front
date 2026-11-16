export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api',
  /** Cada cuánto el navegador llama al backend para mantenerlo activo (Render lo suspende a los 15 min). */
  latidoServidorMs: 4 * 60 * 1000,
  /** Canal de eventos en tiempo real (WebSocket) del backend. */
  wsUrl: 'ws://localhost:8081/ws/eventos'
  // La clave de Groq (GROQ_API_KEY) NO va aquí: todo lo que está en el frontend es público.
  // Se configura solo en el backend y el asistente se consume por /api/asistente.
};
