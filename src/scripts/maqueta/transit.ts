import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const encuadres = [
  { posicion: [8.7, 5.2, -10.8], foco: [1.25, 1.4, 0], alto: 6.7 },
  { posicion: [4.9, 3.0, -7.2], foco: [2.9, 1.64, -1.32], alto: 3.65 },
  { posicion: [3.1, 2.85, -5.0], foco: [2.72, 2.30, -1.25], alto: 1.75 },
  { posicion: [4.8, 3.2, -7.6], foco: [3.04, 1.70, -1.54], alto: 3.5 },
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

export function prepararTransit(tractor: T.Group, integrado = false) {
  // El camión se ha detenido antes de la garita, con la ventanilla del conductor hacia el control.
  if (!integrado) tractor.position.set(-15, 0.057, 15.46);

  const caja = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  const esfera = new T.SphereGeometry(0.5, 16, 12);
  const cilindro = new T.CylinderGeometry(0.5, 0.5, 1, 12);
  const piel = material(0xd8a478);
  const pelo = material(0x4a3529);
  const camiseta = material(0xf4efdf);
  const gorra = material(0x37664c);
  const uniforme = material(0x354d57);
  const chaleco = material(0xcbd86e);
  const reflectante = material(0xedeee0);
  const botas = material(0x242e2d);

  function pieza(parent: T.Group, acabado: T.Material, tamaño: Posicion, posicion: Posicion, geometria = caja) {
    const objeto = new T.Mesh(geometria, acabado);
    objeto.position.set(...posicion);
    objeto.scale.set(...tamaño);
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    parent.add(objeto);
    return objeto;
  }

  const conductor = new T.Group();
  conductor.position.set(2.89, 1.69, -0.60);
  tractor.add(conductor);
  const volante = pieza(tractor, botas, [1, 1, 1], [3.49, 2.03, -0.60], new T.TorusGeometry(0.18, 0.025, 8, 20));
  volante.rotation.y = Math.PI / 2;
  pieza(conductor, botas, [0.19, 0.75, 0.53], [-0.31, 0.36, 0.06]);
  pieza(conductor, camiseta, [0.49, 0.50, 0.35], [0, 0.30, 0]);
  pieza(conductor, botas, [0.038, 0.51, 0.03], [0.03, 0.30, -0.18]).rotation.z = -0.56;

  const control = new T.Group();
  tractor.add(control);
  const piernas = [-1, 1].map((lado) => ({
    lado,
    pie: pieza(control, botas, [0.23, 0.12, 0.31], [lado * 0.14, 0.065, 0.055]),
    pierna: pieza(control, uniforme, [0.22, 0.77, 0.21], [lado * 0.14, 0.46, 0]),
  }));
  pieza(control, uniforme, [0.49, 0.58, 0.32], [0, 1.08, 0]);
  for (const lado of [-1, 1]) {
    pieza(control, chaleco, [0.12, 0.51, 0.34], [lado * 0.15, 1.10, 0]);
  }
  pieza(control, reflectante, [0.48, 0.055, 0.35], [0, 0.91, 0]);

  function cabeza(parent: T.Group, y: number, visera: T.Material, giro: number) {
    const grupo = new T.Group();
    grupo.position.set(0, y, 0);
    grupo.rotation.y = giro;
    // Cabeza a escala adulta: más pequeña y algo más baja sobre los hombros.
    grupo.scale.setScalar(0.8);
    grupo.position.y -= 0.04;
    parent.add(grupo);
    pieza(grupo, piel, [0.35, 0.42, 0.35], [0, 0, 0], esfera);
    pieza(grupo, pelo, [0.35, 0.23, 0.35], [0, 0.095, 0.025], esfera);
    pieza(grupo, visera, [0.38, 0.17, 0.38], [0, 0.16, 0], esfera);
    pieza(grupo, visera, [0.30, 0.035, 0.18], [0, 0.12, -0.17]);
    pieza(grupo, piel, [0.07, 0.09, 0.075], [0, -0.015, -0.17], esfera);
    for (const lado of [-1, 1]) pieza(grupo, botas, [0.025, 0.024, 0.024], [lado * 0.068, 0.025, -0.16], esfera);
    return grupo;
  }

  const caraConductor = cabeza(conductor, 0.72, gorra, 0);
  const caraControl = cabeza(control, 1.57, uniforme, Math.PI);
  const telefono = new T.Group();
  tractor.add(telefono);
  pieza(telefono, botas, [0.285, 0.49, 0.05], [0, 0, 0]);
  const pantalla = new T.Mesh(new T.PlaneGeometry(0.252, 0.448), new T.MeshBasicMaterial({
    map: pantallaDocumento(), toneMapped: false,
  }));
  pantalla.position.z = 0.026;
  telefono.add(pantalla);

  const diferencia = new T.Vector3();
  const ejeVertical = new T.Vector3(0, 1, 0);

  function brazo(parent: T.Group, ropa: T.Material) {
    const superior = pieza(parent, ropa, [1, 1, 1], [0, 0, 0], cilindro);
    const antebrazo = pieza(parent, ropa, [1, 1, 1], [0, 0, 0], cilindro);
    const mano = pieza(parent, piel, [0.12, 0.15, 0.11], [0, 0, 0], esfera);
    function orientar(objeto: T.Mesh, inicio: T.Vector3, final: T.Vector3, grosor: number) {
      diferencia.subVectors(final, inicio);
      objeto.position.copy(inicio).lerp(final, 0.5);
      objeto.scale.set(grosor, diferencia.length(), grosor);
      objeto.quaternion.setFromUnitVectors(ejeVertical, diferencia.normalize());
    }

    return (hombro: T.Vector3, codo: T.Vector3, palma: T.Vector3) => {
      orientar(superior, hombro, codo, 0.17);
      orientar(antebrazo, codo, palma, 0.135);
      mano.position.copy(palma);
    };
  }

  const mostrar = brazo(tractor, camiseta);
  const pedir = brazo(control, uniforme);
  const brazoApoyado = brazo(conductor, camiseta);
  brazoApoyado(new T.Vector3(0.22, 0.46, 0), new T.Vector3(0.34, 0.23, -0.03), new T.Vector3(0.55, 0.27, -0.09));
  const brazoQuieto = brazo(control, uniforme);
  brazoQuieto(new T.Vector3(0.24, 1.28, 0), new T.Vector3(0.33, 1.05, 0.01), new T.Vector3(0.31, 0.85, 0.065));
  const hombroConductor = new T.Vector3(2.68, 2.16, -0.65);
  const hombroControl = new T.Vector3(-0.23, 1.28, 0);
  const codo = new T.Vector3();
  const palma = new T.Vector3();

  const camara = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 175);
  const origen = new T.Vector3();
  const destino = new T.Vector3();
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
      for (const { lado, pie, pierna } of piernas) {
        const zancada = lado * pasoControl;
        pierna.rotation.x = -zancada * 0.24;
        pie.position.z = 0.055 + zancada * 0.14;
        pie.position.y = 0.065 + Math.max(0, zancada) * 0.08;
      }
      caraControl.rotation.x = -0.14 - 0.24 * revisar;
      caraControl.rotation.y = Math.PI + 0.3 * acercar + 0.20 * revisar;
      caraConductor.rotation.y = 0.22 * (1 - enseñar);
      pedir(hombroControl, codo.set(-0.37, 1.01 + gesto * 0.16, gesto * 0.20),
        palma.set(-0.30 - gesto * 0.08, 0.83 + gesto * 0.62, 0.06 + gesto * 0.36));

      telefono.position.set(2.95 - 0.31 * enseñar, 1.52 + 0.82 * enseñar, -0.68 - 0.64 * enseñar);
      telefono.rotation.set(-0.53 * (1 - enseñar) + 0.08 * enseñar, 0.65 + 2.21 * enseñar - 0.25 * revisar, -0.11);
      mostrar(hombroConductor, codo.set(2.67, 1.90 + 0.16 * enseñar, -0.67 - 0.27 * enseñar),
        palma.copy(telefono.position).add(destino.set(-0.09, -0.18, 0.035)));
    },
  };
}
