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

## Estructura

```
src/app/auth        acceso en dos pasos, fondo animado, guards e interceptor
src/app/layout      marco privado (menú lateral y barra superior)
src/app/ml          panel de Machine Learning
src/app/services    acceso a la API, sesión, Machine Learning y notificaciones
src/styles          tokens de diseño, componentes, animaciones y layouts
```
