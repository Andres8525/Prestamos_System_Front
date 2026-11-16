/// <reference lib="webworker" />
import { PeticionCsv, generarCsv } from './csv';

/** Web Worker: arma el CSV fuera del hilo principal para no congelar la tabla con carteras grandes. */
addEventListener('message', ({ data }: MessageEvent<PeticionCsv>) => {
  postMessage(generarCsv(data));
});
