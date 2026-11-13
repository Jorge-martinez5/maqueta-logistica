// n8ao no publica tipos: solo se declara lo que usa la maqueta.
declare module 'n8ao' {
  import type { Camera, Color, Scene, WebGLRenderTarget } from 'three';
  import { Pass } from 'three/addons/postprocessing/Pass.js';

  export class N8AOPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    camera: Camera;
    beautyRenderTarget: WebGLRenderTarget;
    configuration: {
      aoRadius: number;
      distanceFalloff: number;
      intensity: number;
      color: Color;
      aoSamples: number;
      denoiseSamples: number;
      halfRes: boolean;
      gammaCorrection: boolean;
    };
  }
}
