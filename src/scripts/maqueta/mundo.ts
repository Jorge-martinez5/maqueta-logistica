import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { aplicacionesMapa } from '../../data/aplicaciones';

const colores = {
  cal: 0xf8f8ed, blanco: 0xfffff6, hormigon: 0xd6dbcc, junta: 0xb9c5b1,
  verde: 0x245943, salvia: 0x78a476, lima: 0xaed47d, bosque: 0x40674e,
  hoja: 0x7ca669, hierba: 0xb1c49c, tierra: 0xc1af8b, carton: 0xcfa46d,
  cartonClaro: 0xe3bd86, madera: 0x92704a, metal: 0x65756c, acero: 0xa6b4ab,
  cristal: 0x294039, neum: 0x27302a, asfalto: 0x778780, carretera: 0xecebd9,
  arena: 0xe5e7d7, negro: 0x233528, semaforo: 0xc4f398, piel: 0xd6a77d,
};

type Tono = keyof typeof colores;
type Posicion = [number, number, number];

export type TipoMaqueta = 'terminal' | 'interior' | 'transit';

export function construirMundo(escena: T.Scene, tipo: TipoMaqueta = 'terminal') {
  const interior = tipo === 'interior';
  const transit = tipo === 'transit';
  const terminal = tipo === 'terminal';
  const cubo = new T.BoxGeometry(1, 1, 1);
  const redondo = new RoundedBoxGeometry(1, 1, 1, 2, 0.075);
  const rueda = new T.CylinderGeometry(0.5, 0.5, 1, 18);
  const copa = new T.IcosahedronGeometry(0.5, 1);
  const suelo = new T.Group();
  const materiales = new Map<Tono, T.MeshStandardMaterial>();

  function material(tono: Tono) {
    if (!materiales.has(tono)) {
      materiales.set(tono, new T.MeshStandardMaterial({
        color: colores[tono],
        roughness: tono === 'cristal' ? 0.43 : 0.82,
        metalness: tono === 'metal' || tono === 'acero' ? 0.12 : 0,
        ...(tono === 'semaforo' ? { emissive: 0x90bf50, emissiveIntensity: 0.66 } : {}),
      }));
    }
    return materiales.get(tono)!;
  }

  function volumen(parent: T.Object3D, tono: Tono, tamaño: Posicion, posicion: Posicion, geometria = cubo) {
    const objeto = new T.Mesh(geometria, material(tono));
    objeto.position.set(...posicion);
    objeto.scale.set(...tamaño);
    objeto.castShadow = tamaño[1] > 0.07;
    objeto.receiveShadow = true;
    parent.add(objeto);
    return objeto;
  }

  function caja(tono: Tono, tamaño: Posicion, posicion: Posicion, parent: T.Object3D = suelo) {
    return volumen(parent, tono, tamaño, posicion);
  }

  function texto(parent: T.Object3D, linea: string, tamaño: [number, number], posicion: Posicion, color = '#235442') {
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 128;
    const ctx = lienzo.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '700 82px Arial';
    ctx.fillText(linea, 256, 66, 490);
    const textura = new T.CanvasTexture(lienzo);
    textura.colorSpace = T.SRGBColorSpace;
    const placa = new T.Mesh(new T.PlaneGeometry(...tamaño), new T.MeshBasicMaterial({
      map: textura, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    placa.position.set(...posicion);
    parent.add(placa);
    return placa;
  }

  function camion(tono: Tono, ventanillaAbierta = false) {
    const parent = new T.Group();
    caja('negro', [8.3, 0.24, 1.85], [0, 0.68, 0], parent);
    volumen(parent, 'blanco', [6.1, 2.36, 2.27], [-1.06, 2.00, 0], redondo);
    caja('salvia', [5.98, 0.20, 2.29], [-1.07, 0.99, 0], parent);
    if (ventanillaAbierta) {
      volumen(parent, tono, [2.06, 1.12, 2.13], [3.11, 1.18, 0], redondo);
      volumen(parent, tono, [2.06, 0.21, 2.13], [3.11, 2.86, 0], redondo);
      caja(tono, [0.16, 1.05, 2.1], [2.17, 2.25, 0], parent);
      caja(tono, [0.18, 1.05, 0.13], [4.05, 2.25, -0.99], parent);
      caja(tono, [0.18, 1.05, 0.13], [4.05, 2.25, 0.99], parent);
      caja(tono, [1.98, 1.05, 0.14], [3.12, 2.25, 0.99], parent);
      caja('negro', [0.44, 0.2, 1.95], [3.82, 1.84, 0], parent);
      caja('bosque', [1.56, 0.64, 0.05], [3.11, 1.29, -1.067], parent);
      caja('metal', [0.24, 0.06, 0.05], [2.52, 1.52, -1.10], parent);
    } else {
      volumen(parent, tono, [2.06, 2.31, 2.13], [3.11, 1.78, 0], redondo);
    }
    volumen(parent, 'negro', [0.27, 0.33, 2.18], [4.04, 0.66, 0], redondo);
    caja('cristal', [0.08, 0.74, 1.82], [4.09, 2.27, 0], parent);
    caja('metal', [0.09, 0.52, 1.65], [4.1, 1.12, 0], parent);
    for (const lado of [-1, 1]) {
      const z = lado * 1.085;
      if (!ventanillaAbierta || lado > 0) caja('cristal', [0.83, 0.66, 0.04], [3.52, 2.27, z], parent);
      caja('negro', [0.19, 0.31, 0.12], [3.8, 2.12, lado * 1.22], parent);
      caja('blanco', [0.10, 0.18, 0.38], [4.13, 0.94, lado * 0.74], parent);
      caja('acero', [0.56, 0.12, 0.29], [3.11, 0.76, lado * 1.10], parent);
      texto(parent, 'Tisnova', [3.85, 0.96], [-1.05, 2.17, lado * 1.15]).rotation.y = lado > 0 ? 0 : Math.PI;
      for (const x of [-3.3, -2.44, 1.68, 3.51]) {
        volumen(parent, 'neum', [0.89, 0.30, 0.89], [x, 0.45, lado * 0.97], rueda).rotation.x = Math.PI / 2;
        volumen(parent, 'acero', [0.49, 0.08, 0.49], [x, 0.45, lado * 1.14], rueda).rotation.x = Math.PI / 2;
      }
    }
    caja('acero', [0.06, 2.06, 0.05], [-4.12, 1.98, 0], parent);
    caja('metal', [0.12, 0.17, 1.99], [-4.17, 0.74, 0], parent);
    return parent;
  }

  function palet(x: number, y: number, z: number, carga = true, parent: T.Object3D = suelo) {
    caja('madera', [1.72, 0.13, 1.30], [x, y + 0.07, z], parent);
    for (const lado of [-0.48, 0, 0.48]) caja('tierra', [1.64, 0.08, 0.26], [x, y + 0.18, z + lado], parent);
    if (carga) {
      for (const lado of [-1, 1]) {
        caja(lado > 0 ? 'carton' : 'cartonClaro', [0.76, 0.72, 1.09], [x + lado * 0.40, y + 0.56, z], parent);
        caja('cal', [0.06, 0.012, 1.08], [x + lado * 0.40, y + 0.926, z], parent);
      }
    }
  }

  function arbol(x: number, z: number, tamaño: number) {
    caja('madera', [0.26, 1.2 * tamaño, 0.26], [x, 0.60 * tamaño, z]);
    for (const [dx, y, dz, escala, tono] of [
      [0, 1.95, 0, 2.15, 'hoja'], [-0.49, 1.66, -0.18, 1.6, 'salvia'], [0.58, 1.72, 0.2, 1.4, 'bosque'],
    ] as const) {
      const a = escala * tamaño;
      volumen(suelo, tono, [a, a * 0.79, a], [x + dx * tamaño, y * tamaño, z + dz * tamaño], copa);
    }
  }

  // Plinto, parcelas y viales de la misma terminal.
  volumen(suelo, 'cal', [96, 1.34, 61], [0, -0.78, 0], redondo);
  caja('junta', [93.2, 0.18, 58.2], [0, -0.11, 0]);
  caja('arena', [91.8, 0.11, 57.3], [0, -0.025, 0]);
  caja('asfalto', [91, 0.018, 8.4], [0, 0.042, 17]);
  caja('hormigon', [37, 0.018, 12], [25, 0.045, 9]);
  caja('asfalto', [7.5, 0.018, 33], [-42.0, 0.043, 1.7]);
  caja('hormigon', [29.0, 0.018, 17], [-22.8, 0.041, 1]);
  for (const z of [12.95, 21.04]) caja('carretera', [90.0, 0.014, 0.095], [0, 0.057, z]);
  for (let x = -40; x <= 42; x += 4.55) caja('carretera', [2.0, 0.014, 0.10], [x, 0.057, 17.92]);
  for (let z = -11; z < 12; z += 4.0) caja('carretera', [0.10, 0.014, 1.85], [-42.3, 0.058, z]);

  for (const [x, z, ancho, fondo] of [
    [-25, -15.7, 27, 12], [-19.5, 25.2, 31, 4.5], [18.0, 25.7, 29, 4.5], [41.8, -14, 4.7, 15], [-33, 10.3, 11, 2.4],
  ]) {
    volumen(suelo, 'junta', [ancho, 0.24, fondo], [x, 0.13, z], redondo);
    volumen(suelo, 'hierba', [ancho - 0.44, 0.12, fondo - 0.44], [x, 0.25, z], redondo);
    for (let index = 0; index < Math.floor(ancho / 4); index++) {
      arbol(x - ancho / 2 + 2.2 + index * 4.1, z + Math.sin(index * 2.1) * Math.min(fondo * 0.3, 1.8), 0.75 + (index % 3) * 0.13);
    }
  }

  for (const x of [-32, -14, 12, 36]) {
    caja('metal', [0.12, 5.5, 0.12], [x, 2.8, 22.15]);
    caja('metal', [0.20, 0.11, 1.3], [x, 5.55, 21.62]);
    caja('blanco', [0.25, 0.10, 0.43], [x, 5.49, 21.03]);
  }

  // La oficina ocupa la misma parcela en el encuadre interior y en la terminal.
  const oficina = new T.Group();
  const fachada = new T.Group();
  const cubierta = new T.Group();
  for (const grupo of [oficina, fachada, cubierta]) grupo.position.set(-28, 0, -4.7);
  suelo.add(oficina);
  escena.add(fachada, cubierta);
  caja('hierba', [12, 0.24, 8.2], [0, 0.14, 0], oficina);
  caja('cal', [12, 4.49, 0.22], [0, 2.5, -4], oficina);
  caja('cal', [0.22, 4.49, 8.2], [-5.89, 2.5, 0], oficina);
  caja('cal', [0.22, 4.49, 8.2], [5.89, 2.5, 0], fachada);
  caja('cal', [12, 4.49, 0.22], [0, 2.5, 4], fachada);
  caja('verde', [12.1, 0.61, 0.25], [0, 3.89, 4.22], fachada);
  for (const x of [-4.3, -1.5, 1.3, 4.1]) {
    caja('cristal', [1.74, 1.3, 0.07], [x, 2.39, 4.15], fachada);
    caja('acero', [0.08, 1.36, 0.11], [x, 2.39, 4.18], fachada);
  }
  texto(fachada, 'Tisnova', [5.1, 1.22], [0, 3.89, 4.36], '#f5faec');
  const tejadoOficina = caja('salvia', [12.5, 0.42, 8.7], [0, 4.95, 0], cubierta);
  const acabadoCubierta = material('salvia').clone();
  acabadoCubierta.transparent = true;
  tejadoOficina.material = acabadoCubierta;

  function cerrarOficina(progreso: number) {
    fachada.visible = progreso > 0;
    fachada.scale.y = Math.max(0.001, progreso);
    cubierta.visible = progreso > 0;
    cubierta.position.y = (1 - progreso) * 4.5;
    cubierta.position.z = -4.7 - (1 - progreso) * 5;
    acabadoCubierta.opacity = Math.min(1, progreso * 2.6);
    tejadoOficina.castShadow = progreso === 1;
  }

  if (interior || transit) cerrarOficina(1);
  else {
    caja('tierra', [4.8, 0.16, 1.78], [-0.9, 1.39, 1.12], oficina);
    for (const x of [-2.94, 1.14]) {
      caja('madera', [0.12, 1.09, 1.42], [x, 0.82, 1.12], oficina);
    }
    caja('cal', [1.04, 0.025, 0.64], [-0.88, 1.48, 1.03], oficina);
    for (const x of [-1.18, -0.88, -0.58]) caja('salvia', [0.17, 0.012, 0.18], [x, 1.497, 1.05], oficina);
    for (const x of [-2.42, 0.58]) {
      caja('metal', [0.78, 0.06, 0.55], [x, 1.49, 1.52], oficina);
      caja('cristal', [0.78, 0.48, 0.07], [x, 1.72, 1.28], oficina).rotation.x = -0.14;
    }
    for (const x of [-3.67, -0.58]) {
      caja('tierra', [2.48, 0.17, 1.28], [x, 1.39, -2.88], oficina);
      caja('madera', [0.25, 1.06, 1.08], [x + 0.95, 0.79, -2.88], oficina);
      caja('metal', [0.1, 1.06, 1.08], [x - 1.06, 0.79, -2.88], oficina);
      caja('metal', [0.18, 0.29, 0.2], [x, 1.62, -3.2], oficina);
      caja('cristal', [1.12, 0.63, 0.10], [x, 2, -3.2], oficina);
      caja('cal', [0.71, 0.05, 0.31], [x, 1.5, -2.73], oficina);
    }
    caja('junta', [0.16, 2.3, 3.5], [2.3, 1.4, -2.35], oficina);
    volumen(oficina, 'verde', [1.38, 2.85, 1.15], [4.23, 1.69, -3], redondo);
    for (const y of [0.82, 1.21, 1.60, 1.99, 2.38, 2.77]) {
      caja('cristal', [1.11, 0.25, 0.06], [4.23, y, -2.41], oficina);
      caja('semaforo', [0.08, 0.05, 0.04], [3.8, y, -2.37], oficina);
    }

    function persona(x: number, z: number, giro: number, ropa: Tono) {
      const grupo = new T.Group();
      grupo.position.set(x, 0.25, z);
      grupo.rotation.y = giro;
      oficina.add(grupo);
      volumen(grupo, 'salvia', [0.79, 0.16, 0.73], [0, 0.71, 0.07], redondo);
      volumen(grupo, 'salvia', [0.78, 0.79, 0.14], [0, 1.05, 0.42], redondo);
      caja('metal', [0.13, 0.64, 0.13], [0, 0.38, 0.07], grupo);
      volumen(grupo, ropa, [0.54, 0.64, 0.32], [0, 1.12, 0], redondo);
      volumen(grupo, 'piel', [0.4, 0.48, 0.39], [0, 1.68, -0.04], copa);
      volumen(grupo, 'madera', [0.41, 0.22, 0.41], [0, 1.85, 0.01], copa);
      for (const lado of [-1, 1]) {
        volumen(grupo, 'negro', [0.24, 0.57, 0.24], [lado * 0.15, 0.48, -0.24], redondo);
        volumen(grupo, ropa, [0.17, 0.20, 0.42], [lado * 0.28, 1.15, -0.23], redondo);
        volumen(grupo, 'piel', [0.15, 0.13, 0.21], [lado * 0.28, 1.17, -0.45], redondo);
      }
    }

    persona(-2.38, 2.75, -0.17, 'cal');
    persona(0.58, 2.75, 0.22, 'bosque');
    persona(-0.9, -0.49, Math.PI, 'salvia');
  }

  for (let x = -36.8; x <= -15; x += 5.5) caja('carretera', [0.1, 0.012, 5.5], [x, 0.06, 5.3]);
  const aparcamiento = transit ? [] : interior
    ? [[-31, 4.5, -0.14, 'salvia'], [-22.5, 7.9, Math.PI, 'verde']] as const
    : [[-35.8, -3, -Math.PI / 2, 'salvia'], [-16.5, 7.9, Math.PI, 'verde']] as const;
  for (const [x, z, giro, tono] of [...aparcamiento, [35.0, 8.3, Math.PI / 2, 'salvia'] as const]) {
    const estacionado = camion(tono);
    estacionado.position.set(x, 0.045, z);
    estacionado.rotation.y = giro;
    suelo.add(estacionado);
  }

  // Control documental, acceso y tótem.
  const gate = -6;
  for (const dx of [-3.05, 3.05]) {
    for (const z of [13.5, 21.2]) {
      caja('verde', [0.42, 4.55, 0.42], [gate + dx, 2.29, z]);
      caja('junta', [0.70, 0.22, 0.70], [gate + dx, 0.14, z]);
    }
  }
  volumen(suelo, 'verde', [7.4, 0.52, 8.7], [gate, 4.63, 17.35], redondo);
  caja('cal', [7.0, 0.07, 8.2], [gate, 4.94, 17.35]);
  texto(suelo, 'TisTransit', [5.9, 1.12], [gate, 4.65, 21.76], '#f5faec');
  caja('cal', [3.1, 2.54, 2.56], [gate + 1.9, 1.29, 23.6]);
  caja('salvia', [3.32, 0.18, 2.76], [gate + 1.9, 2.66, 23.6]);
  caja('cristal', [2.48, 0.92, 0.08], [gate + 1.9, 1.82, 24.90]);
  caja('metal', [0.27, 2.62, 0.34], [gate - 1.8, 1.38, 21.14]);
  caja('verde', [0.94, 1.17, 0.26], [gate - 1.8, 2.22, 21.14]);
  caja('cal', [0.69, 0.71, 0.02], [gate - 1.8, 2.28, 21.28]);
  const patron = ['1110101', '1011111', '1110101', '0100010', '1111001', '1010110', '1110101'];
  patron.forEach((fila, y) => [...fila].forEach((modulo, x) => {
    if (modulo === '1') caja('verde', [0.067, 0.067, 0.018], [gate - 2.0 + x * 0.067, 2.48 - y * 0.067, 21.296]);
  }));
  caja('semaforo', [0.14, 0.14, 0.16], [gate + 3.07, 3.46, 21.43]);
  for (let x = gate - 4; x <= gate + 3.5; x += 1.7) caja('carretera', [0.75, 0.017, 0.11], [x, 0.061, 20.06]);

  // Nave, muelles e interior con estanterías y carretilla.
  const nave = 23;
  const frente = new T.Group();
  const techo = new T.Group();
  escena.add(frente, techo);
  caja('hormigon', [33.6, 0.22, 24.3], [nave, 0.13, -7.2]);
  caja('cal', [33.6, 7.6, 0.35], [nave, 3.96, -19.18]);
  caja('cal', [0.35, 7.6, 24.3], [6.36, 3.96, -7.2]);
  caja('cal', [0.35, 7.6, 24.3], [39.63, 3.96, -7.2], frente);
  caja('cal', [33.6, 7.6, 0.42], [nave, 3.96, 4.81], frente);
  caja('verde', [33.8, 1.07, 0.54], [nave, 6.55, 4.87], frente);
  texto(frente, 'TisSGA', [6.8, 1.2], [31.1, 6.55, 5.16], '#f4f8ec');
  for (let x = 10.3; x < 38; x += 5.1) {
    caja('metal', [3.62, 3.59, 0.11], [x, 2.13, 5.06], frente);
    caja('cristal', [2.98, 2.98, 0.10], [x, 2.11, 5.15], frente);
    for (let y = 0.92; y <= 3.4; y += 0.40) caja('acero', [2.85, 0.029, 0.065], [x, y, 5.22], frente);
    caja('junta', [3.88, 0.23, 1.30], [x, 0.26, 5.49]);
    caja('carretera', [0.088, 0.015, 5.2], [x - 2.49, 0.061, 8.25]);
    caja('carretera', [0.088, 0.015, 5.2], [x + 2.49, 0.061, 8.25]);
  }
  volumen(techo, 'blanco', [34.1, 0.48, 24.9], [nave, 7.88, -7.2], redondo);
  for (let x = 7.7; x < 39.5; x += 1.04) caja('junta', [0.042, 0.068, 23.8], [x, 8.13, -7.2], techo);
  for (const x of [12.5, 22.9, 33.3]) {
    caja('acero', [3.1, 0.2, 9.2], [x, 8.17, -8.0], techo);
    caja('cal', [2.85, 0.09, 8.9], [x, 8.31, -8.0], techo);
  }

  for (const x of [11.1, 17.3, 28.8, 35.0]) {
    for (let z = -16.2; z <= -4; z += 3.45) {
      for (const dx of [-0.98, 0.98]) {
        for (const dz of [-1.7, 1.7]) caja('verde', [0.105, 4.53, 0.105], [x + dx, 2.48, z + dz]);
      }
      for (const y of [0.49, 1.90, 3.36]) {
        caja('salvia', [2.04, 0.10, 3.42], [x, y, z]);
        for (const dz of [-0.78, 0.86]) {
          const hueco = !transit && x === 17.3 && Math.abs(z - (-9.3)) < 0.001 && y === 1.90 && dz === -0.78;
          if (!hueco && Math.round((x + z + y + dz) * 13) % 7 !== 0) {
            const tono = Math.round((x + z + y + dz) * 10) % 2 === 0 ? 'carton' : 'cartonClaro';
            caja(tono, [1.58, 0.82, 1.36], [x, y + 0.46, z + dz]);
            caja('cal', [0.08, 0.012, 1.35], [x + 0.37, y + 0.878, z + dz]);
          }
        }
      }
    }
  }
  const estanterias = tipo === 'terminal' ? aplicacionesMapa.map(({ posicion: [x, z] }) => {
    const base = caja('lima', [3.4, 0.026, 4.15], [x, 0.253, z], escena);
    base.visible = false;
    return { base, anclaje: new T.Vector3(x, 5.4, z) };
  }) : [];
  for (const x of [20.35, 25.65]) caja('carretera', [0.10, 0.015, 20.2], [x, 0.247, -7.0]);
  for (const x of [9.1, 12.2, 31.5, 35.9]) palet(x, 0.23, 0.65, true);

  const carretilla = new T.Group();
  volumen(carretilla, 'salvia', [1.45, 0.69, 1.76], [0, 0.56, 0], redondo);
  caja('negro', [0.63, 0.38, 0.62], [0, 1.10, 0.22], carretilla);
  for (const x of [-0.61, 0.61]) {
    for (const z of [-0.55, 0.58]) {
      caja('verde', [0.11, 1.18, 0.11], [x, 1.33, z], carretilla);
      volumen(carretilla, 'neum', [0.49, 0.23, 0.49], [x, 0.25, z], rueda).rotation.z = Math.PI / 2;
    }
    caja('metal', [0.13, 1.65, 0.13], [x * 0.7, 0.98, -1.01], carretilla);
  }
  caja('verde', [1.44, 0.18, 1.62], [0, 2.0, 0], carretilla);
  const horquillas = new T.Group();
  carretilla.add(horquillas);
  caja('metal', [0.12, 0.08, 1.15], [-0.37, 0.18, -1.55], horquillas);
  caja('metal', [0.12, 0.08, 1.15], [0.37, 0.18, -1.55], horquillas);
  const entrada = new T.Group();
  const salida = new T.Group();
  const marcasAlmacen = new T.Group();
  const cargaRuta = new T.Group();
  horquillas.add(cargaRuta);
  if (!transit) {
    for (const [grupo, z, nombre] of [[entrada, -0.28, 'RECEPCIÓN'], [salida, -13.5, 'PREPARACIÓN']] as const) {
      palet(0, 0, 0, true, grupo);
      caja('verde', [1.61, 0.018, 0.18], [0, 0.933, 0.31], grupo);
      grupo.position.set(23, 0.24, z);
      escena.add(grupo);
      for (const dx of [-1.3, 1.3]) caja('salvia', [0.055, 0.013, 2], [23 + dx, 0.248, z], marcasAlmacen);
      for (const dz of [-1, 1]) caja('salvia', [2.60, 0.013, 0.055], [23, 0.248, z + dz], marcasAlmacen);
      texto(marcasAlmacen, nombre, [2.5, 0.48], [23, 0.265, z + 1.42]).rotation.x = -Math.PI / 2;
    }
    texto(marcasAlmacen, 'SALIDA', [2.8, 0.60], [26.8, 0.265, 3.48]).rotation.x = -Math.PI / 2;
    marcasAlmacen.visible = interior;
    escena.add(marcasAlmacen);
  }
  if (!interior) palet(0, 0.23, -1.53, true, cargaRuta);
  escena.add(carretilla);

  const tractor = camion('verde', transit || terminal);
  escena.add(tractor);
  agruparPiezas(suelo, escena);

  const salidaOficina = interior
    ? [new T.Vector3(-42, 0.057, 15.46), new T.Vector3(-25, 0.057, 15.46)]
    : [new T.Vector3(-39.8, 0.057, -4.7), new T.Vector3(-39.8, 0.057, 1.8),
       new T.Vector3(-39.8, 0.057, 8.4), new T.Vector3(-39.8, 0.057, 12.4),
       new T.Vector3(-37.4, 0.057, 15.3), new T.Vector3(-33, 0.057, 15.46),
       new T.Vector3(-25, 0.057, 15.46)];
  const ruta = new T.CatmullRomCurve3([
    ...salidaOficina,
    new T.Vector3(-14, 0.057, 15.46), new T.Vector3(-6, 0.057, 15.46),
    new T.Vector3(4, 0.057, 15.46), new T.Vector3(15.6, 0.057, 14.8),
    new T.Vector3(21.2, 0.057, 12), new T.Vector3(21.6, 0.057, 9.1),
  ]);
  const muestras = ruta.getSpacedPoints(220);
  const guia = new T.BufferGeometry().setFromPoints(muestras);
  const linea = new T.Line(guia, new T.LineDashedMaterial({
    color: colores.lima, dashSize: 0.27, gapSize: 0.20, transparent: true, opacity: 0.9,
  }));
  linea.computeLineDistances();
  linea.visible = !transit;
  escena.add(linea);
  const segmentos = 220;
  const carasPorSegmento = 5 * 6;
  const trazado = new T.Mesh(new T.TubeGeometry(ruta, segmentos, 0.078, 5, false), new T.MeshBasicMaterial({
    color: 0x78ae54,
  }));
  trazado.geometry.setDrawRange(0, 0);
  escena.add(trazado);

  return {
    techo, frente, tractor, carretilla, horquillas, entrada, salida, ruta, cerrarOficina, estanterias, marcasAlmacen, cargaRuta,
    trazar(progreso: number) {
      trazado.geometry.setDrawRange(0, Math.floor(progreso * segmentos) * carasPorSegmento);
    },
  };
}

function agruparPiezas(origen: T.Group, escena: T.Scene) {
  const lotes = new Map<string, T.Mesh<T.BufferGeometry, T.Material>[]>();
  origen.updateMatrixWorld(true);
  origen.traverse((elemento) => {
    if (!(elemento instanceof T.Mesh) || Array.isArray(elemento.material)) return;
    const clave = `${elemento.geometry.id}:${elemento.material.id}:${elemento.castShadow}`;
    if (!lotes.has(clave)) lotes.set(clave, []);
    lotes.get(clave)!.push(elemento);
  });
  for (const piezas of lotes.values()) {
    const primera = piezas[0];
    const lote = new T.InstancedMesh(primera.geometry, primera.material, piezas.length);
    lote.castShadow = primera.castShadow;
    lote.receiveShadow = primera.receiveShadow;
    piezas.forEach((pieza, indice) => lote.setMatrixAt(indice, pieza.matrixWorld));
    lote.instanceMatrix.needsUpdate = true;
    escena.add(lote);
  }
}
