/// <reference lib="webworker" />
import { PeticionProyeccion, proyectarRecaudo } from './proyeccion';

/**
 * Web Worker: simulación Monte Carlo del recaudo (cientos de miles de escenarios).
 * Corre en otro hilo, así la interfaz sigue respondiendo; informa el avance cada 5 %.
 */
addEventListener('message', ({ data }: MessageEvent<PeticionProyeccion>) => {
  const resultado = proyectarRecaudo(data, (fraccion) => postMessage({ __progreso: fraccion }));
  postMessage(resultado);
});
