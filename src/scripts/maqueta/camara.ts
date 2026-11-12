import * as T from 'three';
import { construirMundo } from './mundo';
import { prepararInterior } from './interior';

const encuadres = [
  { centro: [-2, 0.6, 0], vista: [49, 52, 65], alto: 70, viaje: 0.03 },
  { centro: [-25, 0.9, 12.5], vista: [32, 28, 48], alto: 38, viaje: 0.26 },
  { centro: [-5.5, 1.65, 17.6], vista: [27, 22, 38], alto: 25, viaje: 0.59 },
  { centro: [22.7, 1.65, -5.1], vista: [19, 42, 39], alto: 42, viaje: 0.99 },
] as const;

function suavizar(inicio: number, final: number, avance: number) {
  const t = T.MathUtils.clamp((avance - inicio) / (final - inicio), 0, 1);
  return t * t * (3 - 2 * t);
}

export function prepararMaqueta(canvas: HTMLCanvasElement, perdido: () => void, interior = false) {
  const context = canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'high-performance' });
  if (!context) return null;
  const renderer = new T.WebGLRenderer({ canvas, context, antialias: true });
  renderer.setClearColor(0xe7eee2);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.39;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;

  const escena = new T.Scene();
  escena.background = new T.Color(0xe7eee2);
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 260);
  escena.add(new T.HemisphereLight(0xfff6e4, 0xc4d2c1, 2.02));
  const sol = new T.DirectionalLight(0xffefda, 2.52);
  sol.position.set(-39, 61, 30);
  sol.castShadow = true;
  sol.shadow.mapSize.setScalar(canvas.clientWidth < 760 ? 1024 : 1536);
  sol.shadow.camera.left = -65;
  sol.shadow.camera.right = 65;
  sol.shadow.camera.top = 53;
  sol.shadow.camera.bottom = -53;
  sol.shadow.camera.near = 2;
  sol.shadow.camera.far = 151;
  sol.shadow.normalBias = 0.045;
  sol.shadow.bias = -0.00018;
  escena.add(sol);

  const base = new T.Mesh(new T.PlaneGeometry(330, 330), new T.MeshStandardMaterial({ color: 0xe7eee2, roughness: 0.9 }));
  base.rotation.x = -Math.PI / 2;
  base.position.y = -1.45;
  base.receiveShadow = true;
  escena.add(base);

  const mundo = construirMundo(escena, interior);
  const recorridoInterior = interior ? prepararInterior(mundo) : null;
  const { techo, frente, tractor, carretilla, horquillas, ruta, trazar } = mundo;
  const centro = new T.Vector3();
  const posicion = new T.Vector3();
  const punto = new T.Vector3();
  const tangente = new T.Vector3();
  let ancho = 1;
  let alto = 1;
  let avance = 0;
  let frame = 0;
  let visible = true;
  let destruida = false;

  function pintar() {
    frame = 0;
    if (!visible || destruida) return;
    if (recorridoInterior) {
      recorridoInterior.actualizar(avance, ancho, alto);
      renderer.render(escena, recorridoInterior.camara);
      return;
    }
    const paso = Math.min(Math.floor(avance), encuadres.length - 2);
    const a = encuadres[paso];
    const b = encuadres[paso + 1];
    const t = suavizar(0, 1, avance - paso);
    const movil = ancho < 760;
    centro.set(
      T.MathUtils.lerp(a.centro[0], b.centro[0], t),
      T.MathUtils.lerp(a.centro[1], b.centro[1], t),
      T.MathUtils.lerp(a.centro[2], b.centro[2], t),
    );
    posicion.set(
      T.MathUtils.lerp(a.vista[0], b.vista[0], t),
      T.MathUtils.lerp(a.vista[1], b.vista[1], t),
      T.MathUtils.lerp(a.vista[2], b.vista[2], t),
    );
    camera.position.copy(centro).add(posicion);
    camera.lookAt(centro);
    const aspecto = ancho / alto;
    const tamaño = T.MathUtils.lerp(a.alto, b.alto, t);
    const vertical = movil ? tamaño * (0.72 + 0.57 / Math.max(0.40, aspecto)) : tamaño;
    camera.left = -vertical * aspecto / 2;
    camera.right = -camera.left;
    camera.top = vertical / 2;
    camera.bottom = -camera.top;
    camera.setViewOffset(ancho, alto, movil ? 0 : -Math.round(ancho * 0.165), movil ? Math.round(alto * 0.17) : 0, ancho, alto);

    const posicionCamion = T.MathUtils.lerp(a.viaje, b.viaje, avance - paso);
    ruta.getPointAt(posicionCamion, punto);
    trazar(posicionCamion);
    ruta.getTangentAt(posicionCamion, tangente);
    tractor.position.copy(punto);
    tractor.rotation.y = Math.atan2(-tangente.z, tangente.x);

    const abrir = suavizar(2.21, 2.89, avance);
    techo.position.set(abrir * 16, abrir * 12, abrir * -36);
    techo.visible = abrir < 0.98;
    frente.scale.y = Math.max(0.016, 1 - abrir);
    frente.visible = abrir < 0.98;
    carretilla.position.set(23.0, 0.24, T.MathUtils.lerp(1.65, -11.2, suavizar(2.49, 3, avance)));
    horquillas.position.y = suavizar(2.74, 3, avance) * 0.68;
    renderer.render(escena, camera);
  }

  function solicitar() {
    if (!frame && visible && !destruida) frame = requestAnimationFrame(pintar);
  }

  function ajustar() {
    ancho = Math.max(1, canvas.clientWidth);
    alto = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, ancho < 760 ? 1.25 : 1.55));
    renderer.setSize(ancho, alto, false);
    solicitar();
  }

  function contextoPerdido(evento: Event) {
    evento.preventDefault();
    destruir();
    perdido();
  }

  const tamaño = new ResizeObserver(ajustar);
  const visibilidad = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    solicitar();
  });
  tamaño.observe(canvas);
  visibilidad.observe(canvas);
  canvas.addEventListener('webglcontextlost', contextoPerdido);
  ajustar();
  pintar();

  function destruir() {
    if (destruida) return;
    destruida = true;
    cancelAnimationFrame(frame);
    tamaño.disconnect();
    visibilidad.disconnect();
    canvas.removeEventListener('webglcontextlost', contextoPerdido);
    const geometrias = new Set<T.BufferGeometry>();
    const materiales = new Set<T.Material>();
    escena.traverse((elemento) => {
      if (elemento instanceof T.InstancedMesh) elemento.dispose();
      if (!(elemento instanceof T.Mesh || elemento instanceof T.Line)) return;
      geometrias.add(elemento.geometry);
      for (const material of Array.isArray(elemento.material) ? elemento.material : [elemento.material]) {
        materiales.add(material);
      }
    });
    geometrias.forEach((geometria) => geometria.dispose());
    materiales.forEach((material) => {
      if ('map' in material && material.map instanceof T.Texture) material.map.dispose();
      material.dispose();
    });
    sol.shadow.dispose();
    renderer.dispose();
  }

  return {
    avanzar(valor: number) {
      avance = T.MathUtils.clamp(valor, 0, 3);
      solicitar();
    },
    destruir,
  };
}
