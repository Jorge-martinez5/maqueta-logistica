import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import decoderJS from 'three/addons/libs/draco/gltf/draco_wasm_wrapper.js?url';
import decoderWasm from 'three/addons/libs/draco/gltf/draco_decoder.wasm?url';

// Un decodificador compartido; sus archivos se sirven desde la propia web.
function crearCargador() {
  const draco = new DRACOLoader()
    .setDecoderPath({ js: decoderJS, wasm: decoderWasm })
    .setWorkerLimit(2);
  return { draco, modelos: new GLTFLoader().setDRACOLoader(draco), activos: 0, fallido: false };
}
let actual: ReturnType<typeof crearCargador> | undefined;

export async function cargarModelo(url: string) {
  const carga = actual ??= crearCargador();
  carga.activos++;
  try {
    return await carga.modelos.loadAsync(url);
  } catch (error) {
    carga.fallido = true;
    if (actual === carga) actual = undefined;
    throw error;
  } finally {
    carga.activos--;
    // No interrumpir otros modelos que todavía estén usando los mismos trabajadores.
    if (carga.fallido && carga.activos === 0) carga.draco.dispose();
  }
}
