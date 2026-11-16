# CrediRuta — Frontend

Aplicación web (Angular 21) de la plataforma de **microcréditos y rutas de cobro diario**.
Consume la API del repositorio `Prestamos_System_Back`.

## Funcionalidades

- **Acceso:** registro, inicio y cierre de sesión. Las rutas privadas están protegidas y el token se envía solo a la API.
- **Cartera:** clientes, préstamos con simulador de intereses y cuotas con saldo.
- **Cobranza:** cobradores, ruta de cobro diaria con registro de abonos y cuadre de caja.
- **Scoring IA:** probabilidad de incumplimiento por cliente y alerta antes de renovar un crédito.
- **Tienda:** catálogo, carrito, venta al contado o a crédito (genera el préstamo) e historial de pedidos.

## Desarrollo

Requiere Node 22.

```bash
npm ci
npm start        # http://localhost:4200  (API en http://localhost:8081/api)
npm test         # pruebas unitarias (Vitest)
npm run build    # compilación de producción en dist/sistema_cobro/browser
```

Con el backend en modo desarrollo se puede entrar con `admin@cobro.com` / `Admin123*` o crear una cuenta en **/registro**.

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
src/app/auth        login, registro, guards e interceptor
src/app/layout      marco privado (menú lateral y barra superior)
src/app/tienda      catálogo, carrito, productos y pedidos
src/app/services    acceso a la API, sesión, carrito y notificaciones
src/styles          tokens de diseño, componentes, animaciones y layouts
```
