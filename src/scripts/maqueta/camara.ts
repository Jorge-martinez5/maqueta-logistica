import * as T from 'three';
import { construirMundo, type TipoMaqueta } from './mundo';
import { prepararInterior } from './interior';
import { prepararTransit } from './transit';
import { prepararTms } from './tms';
import { crearPistaGame, prepararGame } from './game';
import type { TipoVisita } from '../../data/recorridos';

const encuadres = [
  { momento: 0, centro: [-30.3, 3.13, -8.49], vista: [0.42, 2.05, 6], alto: 4.35, viaje: 0 },
  { momento: 0.38, centro: [-28, 1.3, -4.7], vista: [11, 15, 15], alto: 16.5, viaje: 0 },
  { momento: 0.58, centro: [-28, 1.6, -1.1], vista: [16, 17, 24], alto: 24, viaje: 0 },
  { momento: 1, centro: [-2, 0.6, 0], vista: [49, 52, 65], alto: 70, viaje: 0.08 },
  { momento: 2, centro: [-28, 0.9, 12.5], vista: [32, 28, 48], alto: 38, viaje: 0.36 },
  { momento: 3, centro: [-5.5, 1.65, 17.6], vista: [27, 22, 38], alto: 25, viaje: 0.63 },
  { momento: 4, centro: [22.7, 1.65, -5.1], vista: [19, 42, 39], alto: 42, viaje: 0.99 },
  { momento: 5, centro: [23, 1.5, -7.1], vista: [7, 54, 32], alto: 36, viaje: 0.99 },
] as const;
const ultimoEncuadre = encuadres[encuadres.length - 1].momento;
const duracionEntradaMapa = 0.67;

function suavizar(inicio: number, final: number, avance: number) {
  const t = T.MathUtils.clamp((avance - inicio) / (final - inicio), 0, 1);
  return t * t * (3 - 2 * t);
}

export function prepararMaqueta(canvas: HTMLCanvasElement, perdido: () => void, tipo: TipoMaqueta = 'terminal') {
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
  const pantallaEstrecha = canvas.clientWidth < 760;
  sol.shadow.mapSize.setScalar(pantallaEstrecha ? 1024 : 2048);
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

  const anisotropia = renderer.capabilities.getMaxAnisotropy();
  const mundo = construirMundo(escena, tipo, anisotropia);
  const maqueta = canvas.closest<HTMLElement>('[data-maqueta]');
  const recorrido = tipo === 'interior' ? prepararInterior(mundo)
    : tipo === 'transit' ? prepararTransit(mundo.tractor) : null;
  const visitaInterior = tipo === 'terminal' ? prepararInterior(mundo, true) : null;
  const visitaTransit = tipo === 'terminal' ? prepararTransit(mundo.tractor, true) : null;
  const visitaTms = mundo.puestoTms ? prepararTms(mundo.puestoTms.pantalla, mundo.puestoTms.monitor) : null;
  const pistaGame = tipo === 'terminal' ? crearPistaGame() : null;
  if (pistaGame) {
    pistaGame.textura.anisotropy = anisotropia;
    escena.add(pistaGame.pista);
  }
  if (mundo.puestoTms) mundo.puestoTms.pantalla.textura.anisotropy = anisotropia;
  const visitaGame = pistaGame ? prepararGame(pistaGame) : null;
  const { techo, frente, tractor, carretilla, horquillas, ruta, trazar, cerrarOficina, estanterias, cargaRuta, marcasAlmacen, plano } = mundo;
  const mapa = maqueta?.querySelector<HTMLElement>('#aplicaciones');
  const enlacesMapa = mapa?.querySelector<HTMLElement>('.mapa-enlaces');
  const capaMapa = maqueta?.querySelector<HTMLElement>('[data-anclajes]');
  const marcadores = Array.from(mapa?.querySelectorAll<HTMLElement>('[data-punto-aplicacion]') ?? []);
  const eventosMarcador = ['pointerenter', 'pointerleave', 'focus', 'blur'] as const;
  const centro = new T.Vector3();
  const posicion = new T.Vector3();
  const punto = new T.Vector3();
  const tangente = new T.Vector3();
  const proyeccion = new T.Vector3();
  const puntero = new T.Vector2();
  const raycaster = new T.Raycaster();
  const mapaHorizontal = matchMedia('(max-height: 500px) and (min-aspect-ratio: 7/5)');
  let posicionRaton: { x: number; y: number } | undefined;
  let sobrePlano = false;
  let aperturaPlano = 0;
  let tiempoPlano = 0;
  let ancho = 1;
  let alto = 1;
  let avance = 0;
  let visita: TipoVisita | undefined;
  let avanceVisita = 0;
  let frame = 0;
  let visible = true;
  let destruida = false;
  let sombrasMapa = false;

  function proyectarMarcadores() {
    const margen = ancho <= 720 ? 49 : 65;
    estanterias.forEach(({ anclaje }, indice) => {
      const marcador = marcadores[indice];
      if (!marcador) return;
      proyeccion.copy(anclaje).project(camera);
      const x = T.MathUtils.clamp((proyeccion.x + 1) * ancho / 2, margen, ancho - margen);
      const y = (1 - proyeccion.y) * alto / 2;
      marcador.style.setProperty('--anclaje-x', `${x}px`);
      marcador.style.setProperty('--anclaje-y', `${y}px`);
    });
  }

  function moverRaton(evento: PointerEvent) {
    if (evento.pointerType !== 'mouse') return;
    posicionRaton = { x: evento.clientX, y: evento.clientY };
    if (detectarPlano() !== sobrePlano) solicitar();
  }

  function salirRaton() {
    posicionRaton = undefined;
    if (sobrePlano) solicitar();
  }

  function detectarPlano() {
    if (!plano || avance >= 0.5 || !posicionRaton || !visible) return false;
    const rect = canvas.getBoundingClientRect();
    puntero.set(
      2 * (posicionRaton.x - rect.left) / ancho - 1,
      1 - 2 * (posicionRaton.y - rect.top) / alto,
    );
    if (Math.abs(puntero.x) > 1 || Math.abs(puntero.y) > 1) return false;
    raycaster.setFromCamera(puntero, camera);
    return raycaster.intersectObject(plano.respaldo, false).length > 0;
  }

  function animarPlano(tiempo: number) {
    if (!plano) return;
    sobrePlano = detectarPlano();
    const objetivo = Number(sobrePlano);
    const segundos = Math.min(0.05, (tiempo - tiempoPlano) / 1000);
    tiempoPlano = tiempo;
    aperturaPlano = Math.abs(aperturaPlano - objetivo) < 0.01
      ? objetivo : T.MathUtils.damp(aperturaPlano, objetivo, 23, segundos);
    plano.animar(suavizar(0, 1, aperturaPlano));
    if (aperturaPlano !== objetivo) solicitar();
  }

  function pintar(tiempo: number) {
    frame = 0;
    if (!visible || destruida) return;
    if (recorrido) {
      recorrido.actualizar(avance, ancho, alto);
      renderer.render(escena, recorrido.camara);
      return;
    }
    const avanceCamara = avance > 4 ? Math.min(ultimoEncuadre, 4 + (avance - 4) / duracionEntradaMapa) : avance;
    const paso = Math.min(encuadres.findLastIndex(({ momento }) => momento <= avanceCamara), encuadres.length - 2);
    const a = encuadres[paso];
    const b = encuadres[paso + 1];
    const fraccion = (avanceCamara - a.momento) / (b.momento - a.momento);
    const t = suavizar(0, 1, fraccion);
    const movil = ancho <= 720;
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
    const aspecto = ancho / alto;
    const tamaño = T.MathUtils.lerp(a.alto, b.alto, t);
    const salidaCorcho = suavizar(0, 0.38, avance);
    maqueta?.style.setProperty('--visibilidad-corcho', String(1 - salidaCorcho));
    const alturaNormal = movil ? tamaño * (0.72 + 0.57 / Math.max(0.40, aspecto)) : tamaño;
    const anchoCorcho = movil ? 5.7 : 9.2;
    const alturaEscena = Math.max(alturaNormal, anchoCorcho * (1 - salidaCorcho) / aspecto);
    const haciaMapa = suavizar(4, 5, avanceCamara);
    const anchoMapa = movil ? 43 : 63;
    let vertical = T.MathUtils.lerp(alturaEscena, Math.max(alturaEscena, anchoMapa / aspecto), haciaMapa);
    const margenMapaX = -ancho * 0.19;
    const margenMapaY = -alto * 0.12;
    let margenX = movil ? 0 : -ancho * T.MathUtils.lerp(0.205, 0.165, salidaCorcho);
    const margenCorcho = T.MathUtils.clamp(0.46 - 1.72 / vertical, 0, mapaHorizontal.matches ? 0.12 : 0.28);
    const margenMapaMovil = T.MathUtils.lerp(0.02, 0.23, suavizar(460, 640, alto));
    let margenY = movil ? alto * T.MathUtils.lerp(margenCorcho, T.MathUtils.lerp(0.17, margenMapaMovil, haciaMapa), salidaCorcho) : 0;
    if (mapaHorizontal.matches) {
      margenX = T.MathUtils.lerp(margenX, margenMapaX, haciaMapa);
      margenY = T.MathUtils.lerp(margenY, margenMapaY, haciaMapa);
    }

    cerrarOficina(suavizar(0.42, 0.79, avance));
    const posicionCamion = T.MathUtils.lerp(a.viaje, b.viaje, avance < 1 ? fraccion ** 2 : fraccion);
    ruta.getPointAt(posicionCamion, punto);
    trazar(posicionCamion);
    ruta.getTangentAt(posicionCamion, tangente);
    tractor.position.copy(punto);
    tractor.rotation.y = Math.atan2(-tangente.z, tangente.x);

    const abrir = suavizar(3.21, 3.89, avance);
    techo.position.set(abrir * 16, abrir * 12, abrir * -36);
    techo.visible = abrir < 0.98;
    frente.scale.y = Math.max(0.016, 1 - abrir);
    frente.visible = abrir < 0.98;
    const entradaVisita = suavizar(0, 1, avanceVisita);
    const tramoVisita = Math.max(0, avanceVisita - 1);
    if (visitaTms) maqueta?.style.setProperty('--visibilidad-monitor', String(visita === 'tms' || visita === 'game' ? suavizar(0.35, 1, tramoVisita) : 0));
    const entrandoEnNave = visita === 'interior' ? entradaVisita : 0;
    visitaInterior?.actualizar(visita === 'interior' ? tramoVisita : 0, ancho, alto);
    carretilla.position.z = T.MathUtils.lerp(
      T.MathUtils.lerp(1.65, -11.2, suavizar(3.49, 4, avance)), carretilla.position.z, entrandoEnNave,
    );
    horquillas.position.y = T.MathUtils.lerp(suavizar(3.74, 4, avance) * 0.68, horquillas.position.y, entrandoEnNave);
    cargaRuta.visible = entrandoEnNave < 0.72;
    marcasAlmacen.visible = entrandoEnNave > 0.35;
    if (visitaTransit) {
      visitaTransit.control.visible = visita === 'transit' && avance >= ultimoEncuadre;
      visitaTransit.actualizar(visita === 'transit' ? tramoVisita : 0, ancho, alto);
    }

    visitaTms?.actualizar(visita === 'tms' ? tramoVisita : 0, ancho, alto);
    visitaGame?.actualizar(visita === 'game' ? tramoVisita : 0, ancho, alto);
    const recorridoActivo = visita === 'interior' ? visitaInterior : visita === 'transit' ? visitaTransit : visita === 'tms' ? visitaTms : visita === 'game' ? visitaGame : null;
    if (entradaVisita > 0 && recorridoActivo?.camara instanceof T.OrthographicCamera) {
      const destino = recorridoActivo.camara;
      camera.position.lerp(destino.position, entradaVisita);
      centro.lerp(recorridoActivo.foco, entradaVisita);
      vertical *= (destino.top * 2 / vertical) ** entradaVisita;
      margenX = T.MathUtils.lerp(margenX, destino.view?.offsetX ?? 0, entradaVisita);
      margenY = T.MathUtils.lerp(margenY, destino.view?.offsetY ?? 0, entradaVisita);
      if (visita === 'interior') {
        // La cámara ortográfica conserva el encuadre al alejarse sobre su eje.
        // El retroceso evita que el plano cercano seccione el mobiliario de la nave.
        camera.position.addScaledVector(posicion.subVectors(camera.position, centro).normalize(), 16 * entradaVisita);
      }
    }

    camera.lookAt(centro);
    camera.left = -vertical * aspecto / 2;
    camera.right = -camera.left;
    camera.top = vertical / 2;
    camera.bottom = -camera.top;
    camera.setViewOffset(ancho, alto, margenX, margenY, ancho, alto);
    camera.updateMatrixWorld();
    // En la columna estrecha los rótulos y el texto de almacén comparten el ancho.
    const llegadaMapa = ancho <= 720 && !mapaHorizontal.matches
      ? suavizar(4.87, 4.96, avance)
      : suavizar(4.27, 4.56, avance);
    const opacidadMapa = llegadaMapa * (1 - suavizar(0.08, 0.45, avanceVisita));
    if (enlacesMapa) {
      enlacesMapa.style.opacity = String(opacidadMapa);
      enlacesMapa.inert = llegadaMapa < 0.85 || avanceVisita > 0.16;
    }
    if (opacidadMapa > 0) proyectarMarcadores();
    const marcadorActivo = llegadaMapa >= 0.85 && avanceVisita < 0.16
      ? marcadores.findIndex((marcador) => marcador.matches(':hover, :focus-visible')) : -1;
    estanterias.forEach(({ base }, indice) => { base.visible = indice === marcadorActivo; });
    animarPlano(tiempo);
    // En el mapa se mueve la cámara, con la nave, el camión y la carga ya en reposo.
    const escenaEstatica = avance >= 4 && !visita;
    sol.shadow.autoUpdate = !escenaEstatica;
    if (escenaEstatica && !sombrasMapa) sol.shadow.needsUpdate = true;
    sombrasMapa = escenaEstatica;
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
  marcadores.forEach((marcador) => eventosMarcador.forEach((evento) => marcador.addEventListener(evento, solicitar)));
  if (enlacesMapa && capaMapa) {
    enlacesMapa.inert = true;
    enlacesMapa.style.opacity = '0';
    capaMapa.append(enlacesMapa);
  }
  document.fonts.ready.then(() => {
    if (destruida) return;
    mundo.actualizarTipografia();
    pistaGame?.redibujar();
    solicitar();
  });
  if (plano) {
    window.addEventListener('pointermove', moverRaton, { passive: true });
    document.documentElement.addEventListener('pointerleave', salirRaton);
    window.addEventListener('blur', salirRaton);
  }
  ajustar();

  function destruir() {
    if (destruida) return;
    destruida = true;
    cancelAnimationFrame(frame);
    tamaño.disconnect();
    visibilidad.disconnect();
    canvas.removeEventListener('webglcontextlost', contextoPerdido);
    window.removeEventListener('pointermove', moverRaton);
    document.documentElement.removeEventListener('pointerleave', salirRaton);
    window.removeEventListener('blur', salirRaton);
    maqueta?.style.removeProperty('--visibilidad-corcho');
    maqueta?.style.removeProperty('--visibilidad-monitor');
    if (enlacesMapa) {
      enlacesMapa.inert = false;
      enlacesMapa.style.removeProperty('opacity');
      mapa?.append(enlacesMapa);
    }
    marcadores.forEach((marcador) => {
      eventosMarcador.forEach((evento) => marcador.removeEventListener(evento, solicitar));
      marcador.style.removeProperty('--anclaje-x');
      marcador.style.removeProperty('--anclaje-y');
    });
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
    avanzar(valor: number, visitaActiva?: TipoVisita) {
      avance = T.MathUtils.clamp(valor, 0, recorrido ? 3 : ultimoEncuadre);
      visita = visitaActiva;
      avanceVisita = visita ? T.MathUtils.clamp(valor - ultimoEncuadre, 0, 4) : 0;
      solicitar();
    },
    destruir,
  };
}
