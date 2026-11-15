import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Las letras de Tisnova (modeladas en Blender, public/visual/tisnova-letras.glb)
 * flotan en órbita, se juntan para formar la marca y, al bajar, vuelven a girar
 * alrededor del titular.
 */
export interface Letras {
  /** 0 = palabra formada, 1 = órbita completa. */
  dispersar(progreso: number): void;
  destruir(): void;
}

interface Pieza {
  malla: T.Mesh;
  casa: T.Vector3;
  angulo: number;
  altura: number;
  giro: T.Vector3;
  fase: number;
  retraso: number;
  base: T.Quaternion;
}

const VIDRIOS: Record<string, { color: string; atenuacion: string }> = {
  esmeralda: { color: '#5fcf86', atenuacion: '#1f8f4c' },
  lima: { color: '#d8f58a', atenuacion: '#8fcf2e' },
};

function suavizar(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

function fondo() {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 512;
  const ctx = lienzo.getContext('2d')!;
  const degradado = ctx.createRadialGradient(256, 236, 10, 256, 256, 330);
  degradado.addColorStop(0, '#2f6a45');
  degradado.addColorStop(0.45, '#123521');
  degradado.addColorStop(1, '#061209');
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, 512, 512);
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, opciones.movil ? 1.5 : 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const escena = new T.Scene();
  escena.background = fondo();
  const pmrem = new T.PMREMGenerator(renderer);
  const estudio = new RoomEnvironment();
  escena.environment = pmrem.fromScene(estudio, 0.03).texture;
  estudio.dispose();
  pmrem.dispose();

  const camara = new T.PerspectiveCamera(32, 1, 0.1, 100);
  camara.position.set(0, 0, 19);

  const luz = new T.DirectionalLight('#fff6dc', 2.4);
  luz.position.set(-4, 6, 8);
  const contraluz = new T.PointLight('#b9f27a', 40, 30);
  contraluz.position.set(3, -2, -5);
  escena.add(luz, contraluz, new T.AmbientLight('#cfe8d4', 0.35));

  const grupo = new T.Group();
  escena.add(grupo);

  const materiales = {
    esmeralda: new T.MeshPhysicalMaterial({
      color: VIDRIOS.esmeralda.color, roughness: 0.08, metalness: 0, transmission: 0.82, thickness: 0.9, ior: 1.45,
      attenuationColor: new T.Color(VIDRIOS.esmeralda.atenuacion), attenuationDistance: 0.9,
      clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, specularIntensity: 1,
    }),
    lima: new T.MeshPhysicalMaterial({
      color: VIDRIOS.lima.color, roughness: 0.1, metalness: 0, transmission: 0.7, thickness: 0.9, ior: 1.45,
      attenuationColor: new T.Color(VIDRIOS.lima.atenuacion), attenuationDistance: 1.1,
      clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6,
    }),
    metal: new T.MeshPhysicalMaterial({ color: '#dfe6dc', roughness: 0.22, metalness: 1, clearcoat: 0.6, envMapIntensity: 1.4 }),
  };

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync('/visual/tisnova-letras.glb');
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

  const piezas: Pieza[] = mallas.map((malla, indice) => {
    const nombre = (malla.material as T.Material).name.toLowerCase();
    malla.material = nombre.includes('metal') ? materiales.metal : nombre.includes('lima') ? materiales.lima : materiales.esmeralda;
    const casa = malla.position.clone().sub(centro);
    malla.position.copy(casa);
    grupo.add(malla);
    return {
      malla,
      casa,
      angulo: (indice / mallas.length) * Math.PI * 2,
      altura: Math.sin(indice * 2.3) * 0.9,
      giro: new T.Vector3(Math.sin(indice * 1.7), Math.cos(indice * 1.3), Math.sin(indice * 0.7)).normalize(),
      fase: indice * 0.83,
      retraso: indice / mallas.length,
      base: malla.quaternion.clone(),
    };
  });

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
    escala = Math.min((anchoVisible * (opciones.movil ? 0.84 : 0.56)) / 10, (altoVisible * 0.3) / 2.2);
    grupo.scale.setScalar(escala);
  };
  const observador = new ResizeObserver(medir);
  observador.observe(canvas);
  medir();

  const puntero = new T.Vector2();
  const punteroSuave = new T.Vector2();
  const alMover = (evento: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    puntero.set(((evento.clientX - rect.left) / rect.width) * 2 - 1, -((evento.clientY - rect.top) / rect.height) * 2 + 1);
  };
  window.addEventListener('pointermove', alMover, { passive: true });

  let dispersion = 0;
  let dispersionSuave = 0;
  const inicio = performance.now();
  const llegada = 2.6; // segundos que tarda la palabra en formarse al cargar
  const posicion = new T.Vector3();
  const orbita = new T.Vector3();
  const cuaternio = new T.Quaternion();
  const quieto = new T.Quaternion();
  const ejeY = new T.Vector3(0, 1, 0);
  let frame = 0;
  let visible = true;

  const visibilidad = new IntersectionObserver(([entrada]) => {
    visible = entrada.isIntersecting;
    if (visible && !frame) frame = requestAnimationFrame(dibujar);
  });
  visibilidad.observe(canvas);

  function dibujar(ahora: number) {
    frame = 0;
    if (!visible || document.hidden) return;
    const t = (ahora - inicio) / 1000;
    dispersionSuave += (dispersion - dispersionSuave) * 0.08;
    punteroSuave.lerp(puntero, 0.05);

    const radio = opciones.movil ? 4.4 : 6.4;
    piezas.forEach((pieza) => {
      // Al cargar, cada letra llega desde la órbita con un pequeño escalonado.
      const formada = suavizar((t - pieza.retraso * 0.9) / (llegada - 0.9));
      const enOrbita = Math.max(1 - formada, suavizar(dispersionSuave * 1.7 - pieza.retraso * 0.35));

      const angulo = pieza.angulo + t * 0.32;
      orbita.set(Math.cos(angulo) * radio, pieza.altura + Math.sin(angulo * 2 + pieza.fase) * 0.35, Math.sin(angulo) * radio * 0.55);
      posicion.copy(pieza.casa);
      posicion.y += Math.sin(t * 1.1 + pieza.fase) * 0.06;
      posicion.lerp(orbita, enOrbita);
      pieza.malla.position.copy(posicion);

      cuaternio.setFromAxisAngle(pieza.giro, t * 0.9 + pieza.fase);
      quieto.setFromAxisAngle(ejeY, Math.sin(t * 0.7 + pieza.fase) * 0.08);
      pieza.malla.quaternion.slerpQuaternions(quieto, cuaternio, enOrbita).multiply(pieza.base);
    });

    // La órbita se inclina como un anillo; el puntero mueve el conjunto.
    grupo.rotation.x = 0.12 + dispersionSuave * 0.32 - punteroSuave.y * 0.18;
    grupo.rotation.y = punteroSuave.x * 0.32;
    grupo.rotation.z = dispersionSuave * -0.12;
    // Formada, la palabra queda en el tercio superior, por encima del titular.
    grupo.position.y = altoVisible * (opciones.movil ? 0.25 : 0.22) * (1 - dispersionSuave);

    renderer.render(escena, camara);
    frame = requestAnimationFrame(dibujar);
  }
  const alVolver = () => { if (!document.hidden && visible && !frame) frame = requestAnimationFrame(dibujar); };
  document.addEventListener('visibilitychange', alVolver);
  frame = requestAnimationFrame(dibujar);

  return {
    dispersar(progreso) { dispersion = Math.min(1, Math.max(0, progreso)); },
    destruir() {
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
