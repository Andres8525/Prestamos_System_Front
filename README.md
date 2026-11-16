# CrediRuta — Frontend

Aplicación web (Angular 21) de la plataforma de **microcréditos y rutas de cobro diario**.
Consume la API del repositorio `Prestamos_System_Back`.

## Funcionalidades

- **Acceso en dos pasos:** primero el email; si tiene cuenta se pide la contraseña y si no, se crea la cuenta
  en el mismo flujo. Cierre de sesión, rutas privadas protegidas y aviso cuando el servidor tarda en despertar.
- **Cartera:** clientes, préstamos con simulador de intereses y cuotas con saldo.
- **Cobranza:** cobradores, ruta de cobro diaria con registro de abonos y cuadre de caja.
- **Scoring IA:** probabilidad de incumplimiento por cliente, alerta antes de renovar un crédito y evolución
  del riesgo de cada cliente.
- **Machine Learning:** comparación de algoritmos (regresión logística vs. árbol de decisión), matriz de
  confusión, curva ROC, importancia de variables, simulador de riesgo e historial de entrenamientos.
- **Asistente IA (Groq):** chat sobre la cartera y botón «Explicar con IA» en el scoring. Pasa siempre por el
  backend (`/api/asistente`): la clave de Groq **no** se configura en el frontend.
- **Procesos:** cola de tareas del backend (workers con prioridad, reintentos y resultados descargables) y
  proyección Monte Carlo del recaudo en un **Web Worker** del navegador.
- **Servicios gRPC:** servicios, patrón de cada método (unario, streaming de servidor/cliente, bidireccional),
  métricas de uso y visor de los contratos `.proto`.
- **Servidor siempre activo:** al abrir la app se despierta el backend y, con la pestaña visible, se le hace ping
  cada 4 minutos (`latidoServidorMs`); el login muestra el estado (en línea / despertando / sin conexión).

## Web Workers

Los cálculos pesados corren en otro hilo para no congelar la interfaz (`src/app/workers`):

| Worker | Uso |
|---|---|
| `csv.worker.ts` | Exportar clientes y préstamos a CSV (RFC 4180, con BOM para Excel) |
| `proyeccion.worker.ts` | Simulación Monte Carlo del recaudo con las probabilidades del modelo de ML |

`WebWorkerService` crea el worker, reenvía el avance y lo termina al acabar; si el navegador no soporta workers
usa la misma función pura en el hilo principal. La configuración está en `tsconfig.worker.json`.

## Desarrollo

Requiere Node 22.

```bash
npm ci
npm start        # http://localhost:4200  (API en http://localhost:8081/api)
npm test         # pruebas unitarias (Vitest)
npm run build    # compilación de producción en dist/sistema_cobro/browser
```

Con el backend en modo desarrollo se puede entrar con `admin@cobro.com` / `Admin123*` o escribir cualquier
email nuevo para crear una cuenta.

> La app usa **zone.js** (`polyfills` en `angular.json` y `provideZoneChangeDetection` en `AppModule`).
> Sin él, Angular 21 no redibuja la vista al llegar las respuestas HTTP y los formularios quedan colgados.

## Configuración de la API

| Entorno | Archivo | Valor |
|---|---|---|
| Desarrollo | `src/app/environments/environment.ts` | `http://localhost:8081/api` |
| Producción | `src/app/environments/environment.prod.ts` | URL del backend en Render + `/api` |

## Despliegue en Vercel

1. En Vercel: **Add New → Project** e importar este repositorio.
2. No hay que cambiar nada: `vercel.json` ya define la instalación (`npm ci`), el build (`npm run build`),
   la carpeta de salida (`dist/sistema_cobro/browser`) y la reescritura de rutas para la SPA.
3. Verificar que `apiUrl` en `environment.prod.ts` apunte al backend desplegado.
4. En el backend (Render), `ALLOWED_ORIGINS` debe incluir el dominio de Vercel (por defecto `https://*.vercel.app`).
5. Para el asistente de IA, defina `GROQ_API_KEY` **en Render** (backend). No agregue claves en Vercel ni en
   `environment*.ts`: todo lo que se compila en el frontend es público.

## Estructura

```
src/app/auth        acceso en dos pasos, fondo animado, guards e interceptor
src/app/layout      marco privado (menú lateral y barra superior)
src/app/ml          panel de Machine Learning
src/app/asistente   chat con el asistente de IA (Groq, vía backend)
src/app/procesos    workers del servidor y proyección en Web Worker
src/app/grpc        panel de servicios gRPC
src/app/workers     Web Workers y sus funciones puras (probadas con Vitest)
src/app/services    acceso a la API, sesión, Machine Learning y notificaciones
src/styles          tokens de diseño, componentes, animaciones y layouts
```
