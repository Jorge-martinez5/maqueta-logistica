import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Personas } from './personas';

const encuadres = [
  { posicion: [8.7, 5.2, -10.8], foco: [1.25, 1.4, 0], alto: 6.7 },
  { posicion: [4.9, 3.0, -7.2], foco: [2.95, 1.85, -1.45], alto: 3.15 },
  { posicion: [3.1, 2.85, -5.0], foco: [2.72, 2.30, -1.25], alto: 1.75 },
  { posicion: [4.8, 3.2, -7.6], foco: [3.04, 1.90, -1.54], alto: 3.05 },
] as const;

type Posicion = [number, number, number];

function material(color: number) {
  return new T.MeshStandardMaterial({ color, roughness: 0.82 });
}

function pantallaDocumento() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 384;
  lienzo.height = 672;
  const ctx = lienzo.getContext('2d')!;
  ctx.fillStyle = '#f5faf5';
  ctx.fillRect(0, 0, 384, 672);
  ctx.fillStyle = '#235943';
  ctx.fillRect(0, 0, 384, 125);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 46px Arial';
  ctx.fillText('TisTransit', 32, 80);
  ctx.fillStyle = '#193c2d';
  ctx.font = 'bold 104px Arial';
  ctx.fillText('DeCA', 30, 253);
  ctx.font = 'bold 34px Arial';
  ctx.fillText('Documento de', 32, 326);
  ctx.fillText('transporte', 32, 370);
  ctx.fillStyle = '#c5d6c7';
  for (const [y, ancho] of [[446, 318], [481, 238], [546, 318], [581, 273]]) {
    ctx.fillRect(32, y, ancho, 12);
  }
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  return textura;
}

export function prepararTransit(tractor: T.Group, personas: Personas, integrado = false) {
  // El camión se ha detenido antes de la garita, con la ventanilla del conductor hacia el control.
  if (!integrado) tractor.position.set(-15, 0.057, 15.46);

  const caja = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  const botas = material(0x242e2d);

  function pieza(parent: T.Group, acabado: T.Material, tamaño: Posicion, posicion: Posicion, geometria: T.BufferGeometry = caja) {
    const objeto = new T.Mesh(geometria, acabado);
    objeto.position.set(...posicion);
    objeto.scale.set(...tamaño);
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    parent.add(objeto);
    return objeto;
  }

  const vestuarioConductor = { Ropa: 0xf4efdf, Pantalón: 0x3a4a44, Gorra: 0x37664c, Pelo: 0x4a3529 };
  const vestuarioControl = { Ropa: 0x354d57, Pantalón: 0x354d57, Gorra: 0x354d57, Pelo: 0x2f2620, Piel: 0xc9936a };

  // Conductor sentado mirando al frente (+X); la ventanilla abierta queda a su izquierda (-Z).
  const conductor = new T.Group();
  conductor.position.set(2.89, 1.69, -0.6);
  conductor.rotation.y = -Math.PI / 2;
  tractor.add(conductor);
  conductor.add(personas.pieza('Sentado', vestuarioConductor));
  const caraConductor = new T.Group();
  // La cabeza estilizada debe caber bajo el techo de la cabina (y=2,72).
  caraConductor.scale.setScalar(0.74);
  caraConductor.position.set(2.89, 1.69 + 0.71, -0.6);
  caraConductor.add(personas.pieza('Cabeza', vestuarioConductor), personas.pieza('Gorra', vestuarioConductor));
  tractor.add(caraConductor);
  const volante = pieza(tractor, botas, [1, 1, 1], [3.49, 2.03, -0.60], new T.TorusGeometry(0.18, 0.025, 8, 20));
  volante.rotation.y = Math.PI / 2;
  // La mano derecha descansa en el volante.
  personas.brazo(tractor, vestuarioConductor)(
    new T.Vector3(2.89, 2.26, -0.42), new T.Vector3(3.08, 1.98, -0.4), new T.Vector3(3.42, 2.06, -0.5),
  );

  // Agente de control de pie, mirando al camión (+Z). Las piernas giran desde la cadera al andar.
  const control = new T.Group();
  tractor.add(control);
  const cuerpoControl = personas.pieza('TorsoDePie', vestuarioControl);
  cuerpoControl.rotation.y = Math.PI;
  control.add(cuerpoControl);
  const piernas = [-1, 1].map((lado) => {
    const pierna = personas.pieza('Pierna', vestuarioControl);
    pierna.position.set(lado * 0.1, 0.9, 0);
    pierna.rotation.y = Math.PI;
    control.add(pierna);
    return { lado, pierna };
  });
  const caraControl = new T.Group();
  caraControl.position.set(0, 1.52, 0);
  caraControl.add(personas.pieza('Cabeza', vestuarioControl), personas.pieza('Gorra', vestuarioControl));
  control.add(caraControl);

  const telefono = new T.Group();
  tractor.add(telefono);
  pieza(telefono, botas, [0.285, 0.49, 0.05], [0, 0, 0]);
  const pantalla = new T.Mesh(new T.PlaneGeometry(0.252, 0.448), new T.MeshBasicMaterial({
    map: pantallaDocumento(), toneMapped: false,
  }));
  pantalla.position.z = 0.026;
  telefono.add(pantalla);

  const mostrar = personas.brazo(tractor, vestuarioConductor);
  const pedir = personas.brazo(control, vestuarioControl);
  personas.brazo(control, vestuarioControl)(new T.Vector3(0.2, 1.38, 0), new T.Vector3(0.27, 1.1, 0.02), new T.Vector3(0.28, 0.86, 0.06));
  const hombroConductor = new T.Vector3(2.89, 2.26, -0.78);
  const hombroControl = new T.Vector3(-0.2, 1.38, 0);
  const codo = new T.Vector3();
  const palma = new T.Vector3();
  const destino = new T.Vector3();

  const camara = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 175);
  const origen = new T.Vector3();
  const foco = new T.Vector3();

  return {
    camara,
    foco,
    control,
    actualizar(avance: number, ancho: number, alto: number) {
      const paso = Math.min(Math.floor(avance), encuadres.length - 2);
      const a = encuadres[paso];
      const b = encuadres[paso + 1];
      const t = T.MathUtils.smoothstep(avance - paso, 0, 1);
      tractor.localToWorld(camara.position.lerpVectors(origen.set(...a.posicion), destino.set(...b.posicion), t));
      tractor.localToWorld(foco.lerpVectors(origen.set(...a.foco), destino.set(...b.foco), t));
      camara.lookAt(foco);

      const movil = ancho <= 720;
      const aspecto = ancho / alto;
      const vertical = T.MathUtils.lerp(a.alto, b.alto, t) * (movil ? 0.72 + 0.57 / Math.max(0.4, aspecto) : 1);
      camara.top = vertical / 2;
      camara.bottom = -camara.top;
      camara.right = vertical * aspecto / 2;
      camara.left = -camara.right;
      camara.setViewOffset(ancho, alto, movil ? 0 : -Math.round(ancho * 0.165), movil ? Math.round(alto * 0.19) : 0, ancho, alto);

      const acercar = T.MathUtils.smoothstep(avance, 0.08, 0.9);
      const gesto = T.MathUtils.smoothstep(avance, 0.5, 1) * (1 - T.MathUtils.smoothstep(avance, 1.12, 1.75));
      const enseñar = T.MathUtils.smoothstep(avance, 1.06, 1.95);
      const revisar = T.MathUtils.smoothstep(avance, 2.15, 3);

      control.position.set(T.MathUtils.lerp(4.45, 3.44, acercar), 0, T.MathUtils.lerp(-3.28, -2.02, acercar));
      const pasoControl = Math.sin(acercar * 4 * Math.PI);
      for (const { lado, pierna } of piernas) pierna.rotation.x = -lado * pasoControl * 0.32;
      caraControl.rotation.x = -0.14 - 0.24 * revisar;
      caraControl.rotation.y = Math.PI + 0.3 * acercar + 0.20 * revisar;
      // Mira al frente y gira la cabeza hacia la ventanilla al enseñar el documento.
      caraConductor.rotation.y = -Math.PI / 2 + 0.35 + 0.9 * enseñar;
      pedir(hombroControl, codo.set(-0.37, 1.01 + gesto * 0.16, gesto * 0.20),
        palma.set(-0.30 - gesto * 0.08, 0.83 + gesto * 0.62, 0.06 + gesto * 0.36));

      telefono.position.set(2.95 - 0.31 * enseñar, 1.52 + 0.82 * enseñar, -0.68 - 0.64 * enseñar);
      telefono.rotation.set(-0.53 * (1 - enseñar) + 0.08 * enseñar, 0.65 + 2.21 * enseñar - 0.25 * revisar, -0.11);
      mostrar(hombroConductor, codo.set(2.95, 1.94 + 0.18 * enseñar, -0.82 - 0.24 * enseñar),
        palma.copy(telefono.position).add(destino.set(-0.09, -0.18, 0.035)));
    },
  };
}
