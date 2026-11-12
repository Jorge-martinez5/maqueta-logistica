import * as T from 'three';
import type { construirMundo } from './mundo';

const encuadres = [
  { posicion: [32, 6.8, 8.8], foco: [22.9, 1.65, -5.0], fov: 53 },
  { posicion: [29.8, 5.1, 6.45], foco: [23, 1.05, -0.45], fov: 56 },
  { posicion: [25.4, 4.7, -4.9], foco: [17.8, 2.12, -9.88], fov: 56 },
  { posicion: [29.9, 5.4, -2.65], foco: [23, 1.2, 3.1], fov: 56 },
] as const;

// [avance, x, z, giro, altura de horquillas]
const maniobras = [
  [0, 23, 3.55, 0, -0.22],
  [0.35, 23, 3.55, 0, -0.22],
  [0.74, 23, 1.25, 0, -0.22],
  [1, 23, 1.25, 0, -0.02],
  [1.44, 23, -10.08, 0, -0.02],
  [1.72, 23, -10.08, Math.PI / 2, 1.49],
  [1.92, 19, -10.08, Math.PI / 2, 1.49],
  [2.04, 19.62, -10.08, Math.PI / 2, 1.45],
  [2.18, 23, -10.08, 0, -0.22],
  [2.39, 23, -11.97, 0, -0.22],
  [2.47, 23, -11.97, 0, -0.02],
  [2.65, 23, -11.97, Math.PI, -0.02],
  [3, 23, 2.83, Math.PI, -0.02],
] as const;

function curva(t: number) {
  return t * t * (3 - 2 * t);
}

export function prepararInterior(mundo: ReturnType<typeof construirMundo>) {
  const { techo, frente, tractor, carretilla, horquillas, entrada, salida, ruta, trazar } = mundo;
  techo.visible = false;
  frente.visible = false;
  ruta.getPointAt(0.99, tractor.position);
  const tangente = ruta.getTangentAt(0.99);
  tractor.rotation.y = Math.atan2(-tangente.z, tangente.x) + Math.PI;
  trazar(0.99);

  const camara = new T.PerspectiveCamera(54, 1, 0.22, 130);
  const foco = new T.Vector3();
  const local = new T.Vector3();
  const inicio = new T.Vector3();
  const final = new T.Vector3();

  function moverPalet(palet: T.Group, z: number, avance: number, recogida: number, deposito = Infinity) {
    if (avance < recogida) {
      palet.position.set(23, 0.24, z);
      palet.rotation.y = 0;
    } else if (avance >= deposito) {
      palet.position.set(17.47, 1.95, -10.08);
      palet.rotation.y = Math.PI / 2;
    } else {
      palet.position.copy(horquillas.localToWorld(local.set(0, 0.22, -1.53)));
      palet.rotation.y = carretilla.rotation.y;
    }
  }

  return {
    camara,
    actualizar(avance: number, ancho: number, alto: number) {
      const paso = Math.min(Math.floor(avance), encuadres.length - 2);
      const a = encuadres[paso];
      const b = encuadres[paso + 1];
      const t = curva(avance - paso);
      camara.position.lerpVectors(inicio.set(...a.posicion), final.set(...b.posicion), t);
      foco.lerpVectors(inicio.set(...a.foco), final.set(...b.foco), t);
      camara.lookAt(foco);
      const movil = ancho < 760;
      const fov = T.MathUtils.lerp(a.fov, b.fov, t);
      camara.fov = movil ? Math.min(95, Math.max(fov + 18, 54 / (ancho / alto))) : fov;
      camara.setViewOffset(ancho, alto, movil ? 0 : -Math.round(ancho * 0.16), movil ? Math.round(alto * 0.17) : 0, ancho, alto);

      const indice = Math.min(maniobras.findLastIndex(([momento]) => momento <= avance), maniobras.length - 2);
      const [desde, ...origen] = maniobras[indice];
      const [hasta, ...destino] = maniobras[indice + 1];
      const progreso = curva((avance - desde) / (hasta - desde));
      const [x, z, giro, elevacion] = origen.map((valor, i) => T.MathUtils.lerp(valor, destino[i], progreso));
      carretilla.position.set(x, 0.24, z);
      carretilla.rotation.y = giro;
      horquillas.position.y = elevacion;
      moverPalet(entrada, -0.28, avance, 0.74, 1.92);
      moverPalet(salida, -13.5, avance, 2.39);
    },
  };
}
