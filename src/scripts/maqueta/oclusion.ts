import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { N8AOPass } from 'n8ao';

// Sombra de contacto (oclusión ambiental) a media resolución: asienta las piezas en el suelo
// y marca los encuentros entre volúmenes sin coste de geometría.
export function crearOclusion(renderer: T.WebGLRenderer, escena: T.Scene, camara: T.Camera) {
  const composer = new EffectComposer(renderer);
  const ao = new N8AOPass(escena, camara, 1, 1);
  ao.configuration.aoRadius = 2.4;
  ao.configuration.distanceFalloff = 0.9;
  ao.configuration.intensity = 3.6;
  ao.configuration.color = new T.Color(0x1d3324);
  ao.configuration.aoSamples = 12;
  ao.configuration.denoiseSamples = 6;
  ao.configuration.halfRes = true;
  ao.configuration.gammaCorrection = false;
  // El render propio del pase no hereda el antialias del lienzo: se pide multimuestreo.
  ao.beautyRenderTarget.samples = 4;
  const salida = new OutputPass();
  composer.addPass(ao);
  composer.addPass(salida);

  return {
    dibujar(cam: T.Camera) {
      ao.camera = cam;
      composer.render();
    },
    ajustar(ancho: number, alto: number) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(ancho, alto);
    },
    liberar() {
      // N8AOPass no libera sus objetivos ni materiales en dispose(): se recorren a mano.
      for (const recurso of Object.values(ao)) {
        if (recurso instanceof T.WebGLRenderer || recurso instanceof T.Object3D) continue;
        if (recurso && typeof (recurso as { dispose?: unknown }).dispose === 'function') (recurso as { dispose: () => void }).dispose();
      }
      salida.dispose();
      composer.dispose();
    },
  };
}

export type Oclusion = ReturnType<typeof crearOclusion>;
