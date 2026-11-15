import * as T from 'three';
import { cargarModelo } from '../modelos';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Las letras de Tisnova (modeladas en Blender, public/visual/tisnova-letras.glb)
 * llegan dando tumbos y forman la marca. Al bajar, salen despedidas en desorden y
 * acaban girando, ordenadas, en un anillo alrededor del titular.
 */
export interface Letras {
  /** 0 = palabra formada, 1 = órbita completa. */
  dispersar(progreso: number): void;
  destruir(): void;
}

interface Pieza {
  malla: T.Mesh;
  /** Sitio en la palabra formada. */
  casa: T.Vector3;
  /** Hacia dónde sale despedida al desmontarse. */
  estallido: T.Vector3;
  /** Desde dónde llega al cargar la página. */
  origen: T.Vector3;
  velocidad: T.Vector3;
  eje: T.Vector3;
  volteo: number;
  rigidez: number;
  giroRapidez: number;
  fase: number;
  retraso: number;
  base: T.Quaternion;
}

const VIDRIOS: Record<string, { color: string; atenuacion: string; distancia: number }> = {
  esmeralda: { color: '#d9fbe2', atenuacion: '#3fbf72', distancia: 1.8 },
  lima: { color: '#f6ffe0', atenuacion: '#c4ec62', distancia: 2.4 },
};

function suavizar(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

function fondo() {
  const lado = 1024;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = lado;
  const ctx = lienzo.getContext('2d')!;
  const degradado = ctx.createRadialGradient(lado / 2, lado * 0.46, 20, lado / 2, lado / 2, lado * 0.66);
  degradado.addColorStop(0, '#2f6a45');
  degradado.addColorStop(0.45, '#123521');
  degradado.addColorStop(1, '#061209');
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, lado, lado);
  // Manchas de luz y franjas suaves: el vidrio necesita algo detrás que refractar.
  // Resplandor claro detrás de la palabra formada (tercio superior): es lo que el vidrio deja ver y dobla.
  const halo = ctx.createRadialGradient(lado / 2, lado * 0.3, 0, lado / 2, lado * 0.3, lado * 0.42);
  halo.addColorStop(0, '#c8f0b0aa');
  halo.addColorStop(0.35, '#6fcf8a55');
  halo.addColorStop(1, '#00000000');
  ctx.save();
  ctx.translate(lado / 2, lado * 0.3);
  ctx.scale(1.6, 0.55);
  ctx.translate(-lado / 2, -lado * 0.3);
  ctx.fillStyle = halo;
  ctx.fillRect(-lado, -lado * 2, lado * 3, lado * 5);
  ctx.restore();
  const manchas: [number, number, number, string][] = [
    [0.3, 0.38, 0.16, '#d8f58a38'], [0.72, 0.34, 0.2, '#7ee0a030'], [0.55, 0.62, 0.12, '#ffffff1c'], [0.18, 0.66, 0.1, '#c9f27a24'],
  ];
  for (const [x, y, r, color] of manchas) {
    const luz = ctx.createRadialGradient(x * lado, y * lado, 0, x * lado, y * lado, r * lado);
    luz.addColorStop(0, color);
    luz.addColorStop(1, '#00000000');
    ctx.fillStyle = luz;
    ctx.fillRect(0, 0, lado, lado);
  }
  ctx.save();
  ctx.translate(lado / 2, lado / 2);
  ctx.rotate(-0.5);
  for (let i = -6; i <= 6; i++) {
    const franja = ctx.createLinearGradient(i * 70 - 18, 0, i * 70 + 18, 0);
    franja.addColorStop(0, '#ffffff00');
    franja.addColorStop(0.5, i % 2 ? '#ffffff05' : '#d8f58a08');
    franja.addColorStop(1, '#ffffff00');
    ctx.fillStyle = franja;
    ctx.fillRect(i * 70 - 18, -lado, 36, lado * 2);
  }
  ctx.restore();
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  return textura;
}

export async function prepararLetras(canvas: HTMLCanvasElement, opciones: { movil: boolean }): Promise<Letras | null> {
  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, opciones.movil ? 1 : 1.5));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const escena = new T.Scene();
  escena.background = fondo();
  const pmrem = new T.PMREMGenerator(renderer);
  const estudio = new RoomEnvironment();
  escena.environment = pmrem.fromScene(estudio, 0.03).texture;
  estudio.dispose();
  pmrem.dispose();

  const camara = new T.PerspectiveCamera(32, 1, 0.1, 100);
  camara.position.set(0, 0, 19);

  // Luz principal cálida y dos contraluces que dibujan los cantos del vidrio.
  const luz = new T.DirectionalLight('#fff6dc', 2.6);
  luz.position.set(-4, 6, 8);
  const contraluzIzquierda = new T.DirectionalLight('#ffffff', 3);
  contraluzIzquierda.position.set(-9, 3, -6);
  const contraluzDerecha = new T.DirectionalLight('#d8f58a', 2.6);
  contraluzDerecha.position.set(9, -2, -5);
  escena.add(luz, contraluzIzquierda, contraluzDerecha, new T.AmbientLight('#cfe8d4', 0.25));

  const grupo = new T.Group();
  escena.add(grupo);

  // Vidrio macizo: transmisión total, color por absorción (más oscuro donde es más grueso),
  // dispersión para el arcoíris en los cantos y una película irisada muy leve.
  const vidrio = (tipo: keyof typeof VIDRIOS) => new T.MeshPhysicalMaterial({
    color: VIDRIOS[tipo].color, metalness: 0, roughness: 0.02,
    transmission: 1, thickness: 0.7, ior: 1.52, dispersion: opciones.movil ? 0 : 4,
    attenuationColor: new T.Color(VIDRIOS[tipo].atenuacion), attenuationDistance: VIDRIOS[tipo].distancia,
    specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: opciones.movil ? 0 : 0.22, iridescenceIOR: 1.3,
    envMapIntensity: 2.3,
  });
  const materiales = {
    esmeralda: vidrio('esmeralda'),
    lima: vidrio('lima'),
    metal: new T.MeshPhysicalMaterial({ color: '#e8eee4', roughness: 0.12, metalness: 1, clearcoat: 1, envMapIntensity: 1.8 }),
  };


  let gltf;
  try {
    gltf = await cargarModelo('/visual/tisnova-letras.glb');
  } catch (error) {
    renderer.dispose();
    throw error;
  }

  const mallas: T.Mesh[] = [];
  gltf.scene.traverse((objeto) => { if ((objeto as T.Mesh).isMesh) mallas.push(objeto as T.Mesh); });
  // Orden de lectura, para que la órbita y la llegada sigan la palabra.
  mallas.sort((a, b) => a.position.x - b.position.x);

  const caja = new T.Box3();
  mallas.forEach((malla) => caja.expandByPoint(malla.position));
  const centro = caja.getCenter(new T.Vector3());

  // Pseudoaleatorio con semilla: el desorden es el mismo en cada visita.
  let semilla = 7;
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };

  const piezas: Pieza[] = mallas.map((malla, indice) => {
    const nombre = (malla.material as T.Material).name.toLowerCase();
    malla.material = nombre.includes('metal') ? materiales.metal : nombre.includes('lima') ? materiales.lima : materiales.esmeralda;
    const casa = malla.position.clone().sub(centro);
    grupo.add(malla);
    // Sale despedida hacia fuera de la palabra, con algo de profundidad y altura al azar.
    const estallido = new T.Vector3(
      casa.x * 0.45 + (azar() - 0.5) * 5,
      (azar() - 0.5) * 4.6,
      (azar() - 0.35) * 7,
    );
    const origen = new T.Vector3((azar() - 0.5) * 26, (azar() - 0.5) * 12, -6 - azar() * 10);
    malla.position.copy(origen);
    return {
      malla,
      casa,
      estallido,
      origen,
      velocidad: new T.Vector3(),
      eje: new T.Vector3(azar() - 0.5, azar() - 0.5, azar() - 0.5).normalize(),
      volteo: 0,
      rigidez: 26 + azar() * 34,
      giroRapidez: 5 + azar() * 7,
      fase: indice * 0.83,
      retraso: 0.15 + azar() * 0.75,
      base: malla.quaternion.clone(),
    };
  });



  let frame = 0;
  let visible = true;
  let destruida = false;
  let animarHasta = performance.now() + 6000;
  function solicitar() {
    if (destruida || !visible || document.hidden || frame) return;
    frame = requestAnimationFrame(dibujar);
  }
  function despertar() {
    animarHasta = Math.max(animarHasta, performance.now() + 1800);
    solicitar();
  }

  let ancho = 0;
  let alto = 0;
  let escala = 1;
  let altoVisible = 1;
  const medir = () => {
    ancho = canvas.clientWidth;
    alto = canvas.clientHeight;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    // La palabra mide ~10 unidades: que ocupe ~70 % del ancho visible sin pasarse de alto.
    altoVisible = 2 * Math.tan(T.MathUtils.degToRad(camara.fov / 2)) * camara.position.z;
    const anchoVisible = altoVisible * camara.aspect;
    escala = Math.min((anchoVisible * (opciones.movil ? 0.84 : 0.46)) / 10, (altoVisible * (opciones.movil ? 0.3 : 0.23)) / 2.2);
    grupo.scale.setScalar(escala);
    despertar();
  };
  const observador = new ResizeObserver(medir);
  observador.observe(canvas);
  medir();

  const puntero = new T.Vector2();
  const punteroSuave = new T.Vector2();
  const alMover = (evento: PointerEvent) => {
    if (evento.pointerType !== 'mouse' || !visible) return;
    const rect = canvas.getBoundingClientRect();
    puntero.set(((evento.clientX - rect.left) / rect.width) * 2 - 1, -((evento.clientY - rect.top) / rect.height) * 2 + 1);
    despertar();
  };
  window.addEventListener('pointermove', alMover, { passive: true });

  const RADIO = opciones.movil ? 4.7 : 6.8;
  // Anillo achatado en profundidad: las letras de delante no se acercan tanto a cámara.
  const FONDO = 0.5;
  let dispersion = 0;
  let impulso = 0;
  let anillo = 0;
  let antes = 0;
  const inicio = performance.now();
  const objetivo = new T.Vector3();
  const enAnillo = new T.Vector3();
  const aceleracion = new T.Vector3();
  const qCasa = new T.Quaternion();
  const qAnillo = new T.Quaternion();
  const qVolteo = new T.Quaternion();
  const qObjetivo = new T.Quaternion();
  const ejeY = new T.Vector3(0, 1, 0);
  const visibilidad = new IntersectionObserver(([entrada]) => {
    visible = entrada.isIntersecting;
    if (visible) { antes = 0; despertar(); }
  });
  visibilidad.observe(canvas);

  function dibujar(ahora: number) {
    frame = 0;
    if (!visible || document.hidden || destruida) return;
    const t = (ahora - inicio) / 1000;
    const dt = Math.min(1 / 30, antes ? (ahora - antes) / 1000 : 1 / 60);
    antes = ahora;
    punteroSuave.lerp(puntero, 1 - Math.exp(-dt * 3));

    // Tres momentos: palabra → desorden (las letras salen despedidas y dan tumbos) → anillo ordenado.
    const caos = suavizar((dispersion - 0.04) / 0.2) * (1 - suavizar((dispersion - 0.36) / 0.26));
    const orden = suavizar((dispersion - 0.34) / 0.34);
    impulso *= Math.exp(-dt * 2.5);
    const actividad = T.MathUtils.clamp((animarHasta - ahora) / 600, 0, 1);
    anillo += dt * (0.28 + impulso) * actividad;
    if (!actividad) punteroSuave.copy(puntero);

    piezas.forEach((pieza, indice) => {
      const llegando = t < pieza.retraso;

      // Posición objetivo.
      const angulo = (indice / piezas.length) * Math.PI * 2 + anillo;
      enAnillo.set(Math.cos(angulo) * RADIO, Math.sin(angulo * 3) * 0.18, Math.sin(angulo) * RADIO * FONDO);
      if (llegando) objetivo.copy(pieza.origen);
      else {
        objetivo.copy(pieza.casa);
        objetivo.lerp(enAnillo, orden).addScaledVector(pieza.estallido, caos);
      }

      // Muelle poco amortiguado: cada letra con su rigidez, así llegan a destiempo y rebotan.
      const amortiguacion = 2 * 0.52 * Math.sqrt(pieza.rigidez) * (1 + orden * 0.5);
      aceleracion.subVectors(objetivo, pieza.malla.position).multiplyScalar(pieza.rigidez).addScaledVector(pieza.velocidad, -amortiguacion);
      pieza.velocidad.addScaledVector(aceleracion, dt);
      pieza.malla.position.addScaledVector(pieza.velocidad, dt);

      // Giro: quieta en la palabra, dando tumbos en el desorden y ordenada en el anillo.
      pieza.volteo += dt * pieza.giroRapidez * (caos + (llegando ? 1 : 0) + Math.min(1, pieza.velocidad.length() * 0.04));
      qCasa.identity();
      // Miran a cámara y se giran un poco en los laterales, como siguiendo la curva; nunca quedan del revés.
      qAnillo.setFromAxisAngle(ejeY, -Math.cos(angulo) * 0.65);
      qObjetivo.slerpQuaternions(qCasa, qAnillo, orden);
      qVolteo.setFromAxisAngle(pieza.eje, pieza.volteo);
      qObjetivo.premultiply(qVolteo.slerp(qCasa.identity(), 1 - Math.min(1, caos + (llegando ? 1 : 0)))).multiply(pieza.base);
      pieza.malla.quaternion.slerp(qObjetivo, 1 - Math.exp(-dt * (6 + pieza.rigidez * 0.08)));
      if (!actividad) {
        pieza.malla.position.copy(objetivo);
        pieza.malla.quaternion.copy(qObjetivo);
        pieza.velocidad.set(0, 0, 0);
      }
    });

    // El anillo se inclina para verse en perspectiva; el puntero mueve el conjunto.
    grupo.rotation.x = 0.1 + orden * 0.5 - punteroSuave.y * 0.16;
    grupo.rotation.y = punteroSuave.x * 0.3;
    grupo.rotation.z = orden * -0.09;
    // Formada, la palabra queda en el tercio superior; el anillo rodea el titular.
    grupo.position.y = altoVisible * T.MathUtils.lerp(opciones.movil ? 0.25 : 0.30, 0.07, orden);

    renderer.render(escena, camara);
    if (ahora < animarHasta) solicitar();
  }
  const alVolver = () => { if (!document.hidden && visible) { antes = 0; despertar(); } };
  document.addEventListener('visibilitychange', alVolver);
  solicitar();

  return {
    dispersar(progreso) {
      const nuevo = Math.min(1, Math.max(0, progreso));
      if (Math.abs(nuevo - dispersion) < 0.0001) return;
      // Bajar rápido acelera el anillo.
      impulso = Math.min(3, impulso + Math.abs(nuevo - dispersion) * 9);
      dispersion = nuevo;
      despertar();
    },
    destruir() {
      destruida = true;
      cancelAnimationFrame(frame);
      observador.disconnect();
      visibilidad.disconnect();
      window.removeEventListener('pointermove', alMover);
      document.removeEventListener('visibilitychange', alVolver);
      mallas.forEach((malla) => malla.geometry.dispose());
      Object.values(materiales).forEach((material) => material.dispose());
      (escena.background as T.Texture).dispose();
      escena.environment?.dispose();
      renderer.dispose();
    },
  };
}
