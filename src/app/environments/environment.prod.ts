export const environment = {
  production: true,
  apiUrl: 'https://cobro-backend.onrender.com/api',
  /** Cada cuánto el navegador llama al backend para mantenerlo activo (Render lo suspende a los 15 min). */
  latidoServidorMs: 4 * 60 * 1000,
  /** Canal de eventos en tiempo real (WebSocket) del backend. */
  wsUrl: 'wss://cobro-backend.onrender.com/ws/eventos'
  // La clave de Groq (GROQ_API_KEY) NO va aquí: todo lo que está en el frontend es público.
  // Se configura solo en el backend (Render → Environment) y el asistente se consume por /api/asistente.
};
