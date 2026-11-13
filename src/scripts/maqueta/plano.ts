import * as T from 'three';

// Pantalla de la oficina con el panel «Menos teclear. Más conectar.» de tisnova.es:
// los cables se trazan desde el ERP, cada aplicación se enciende al recibirlos y después
// recorren los cables pulsos de luz. La aplicación activa rota sola o sigue al ratón.

const ANCHO = 640;
const ALTO = 360;
const ESCALA = 2;
const CAMPO = { y: 32, alto: 236 };
const CENTRO = { x: 320, y: CAMPO.y + CAMPO.alto / 2 };
const NODO = { ancho: 196, alto: 64 };
const NUCLEO = { ancho: 156, alto: 74 };

const aplicaciones = [
  { etiqueta: 'Transporte', nombre: 'TisTms', x: 0.22, y: 0.18, descripcion: 'Planificación, recursos y documentación para vuestro equipo de tráfico.' },
  { etiqueta: 'Almacén', nombre: 'TisSGA', x: 0.78, y: 0.18, descripcion: 'Almacén, movimientos y prefacturación con vuestro maestro de artículos.' },
  { etiqueta: 'DeCA · HeRU', nombre: 'TisTransit', x: 0.22, y: 0.82, descripcion: 'Agenda de viajes, flota y documentos DeCA, HeRU, eCNP y eCMR.' },
  { etiqueta: 'Personas / gastos', nombre: 'TisTime', x: 0.78, y: 0.82, descripcion: 'Jornada, personas y gastos en el día a día de vuestro equipo.' },
].map((aplicacion, indice) => {
  const x = aplicacion.x * ANCHO;
  const y = CAMPO.y + aplicacion.y * CAMPO.alto;
  const union = CENTRO.x + (aplicacion.x < 0.5 ? -42 : 42);
  // Del ERP hacia la aplicación, como los trazados del panel original.
  const puntos: [number, number][] = [[CENTRO.x, CENTRO.y], [union, CENTRO.y], [union, y], [x, y]];
  return { ...aplicacion, indice, x, y, union, puntos };
});

const fuente = '"Archivo Variable", Arial, sans-serif';
const verde = '#98c448';
const suave = (t: number) => 1 - (1 - t) ** 3;
const tramo = (t: number, inicio: number, fin: number) => Math.min(1, Math.max(0, (t - inicio) / (fin - inicio)));

function longitud(puntos: [number, number][]) {
  let total = 0;
  for (let i = 1; i < puntos.length; i++) total += Math.hypot(puntos[i][0] - puntos[i - 1][0], puntos[i][1] - puntos[i - 1][1]);
  return total;
}

// Traza solo la parte del recorrido entre dos fracciones de su longitud.
function trazarParte(ctx: CanvasRenderingContext2D, puntos: [number, number][], desde: number, hasta: number) {
  const total = longitud(puntos);
  const a = Math.max(0, desde) * total;
  const b = Math.min(1, hasta) * total;
  if (b <= a) return;
  let recorrido = 0;
  let empezado = false;
  ctx.beginPath();
  for (let i = 1; i < puntos.length; i++) {
    const [x0, y0] = puntos[i - 1];
    const [x1, y1] = puntos[i];
    const largo = Math.hypot(x1 - x0, y1 - y0);
    const s0 = Math.max(a, recorrido);
    const s1 = Math.min(b, recorrido + largo);
    if (s1 > s0) {
      const p0 = (s0 - recorrido) / largo;
      const p1 = (s1 - recorrido) / largo;
      if (!empezado) { ctx.moveTo(x0 + (x1 - x0) * p0, y0 + (y1 - y0) * p0); empezado = true; }
      ctx.lineTo(x0 + (x1 - x0) * p1, y0 + (y1 - y0) * p1);
    }
    recorrido += largo;
  }
  ctx.stroke();
}

function caja(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number, radio: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, ancho, alto, radio);
}

function lienzo() {
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO * ESCALA;
  canvas.height = ALTO * ESCALA;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);
  return { canvas, ctx };
}

const DETALLE = CAMPO.y + CAMPO.alto;
const INTEGRACION = DETALLE + 52;

// Capa fija de fondo: degradado, retícula, cabecera y barras inferiores.
function dibujarFondo(ctx: CanvasRenderingContext2D) {
  const fondo = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
  fondo.addColorStop(0, '#273a2c');
  fondo.addColorStop(1, '#15261d');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const brillo = ctx.createLinearGradient(0, 0, ANCHO * 0.5, ALTO * 0.5);
  brillo.addColorStop(0, '#d3f0ac12');
  brillo.addColorStop(1, '#d3f0ac00');
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.strokeStyle = '#9fc28a10';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 12; x < ANCHO; x += 24) { ctx.moveTo(x, CAMPO.y); ctx.lineTo(x, DETALLE); }
  for (let y = CAMPO.y + 10; y < DETALLE; y += 24) { ctx.moveTo(0, y); ctx.lineTo(ANCHO, y); }
  ctx.stroke();

  ctx.fillStyle = verde;
  ctx.fillRect(18, 13, 6, 6);
  ctx.fillStyle = '#dee6d8';
  ctx.font = `500 12px ${fuente}`;
  ctx.fillText('Menos teclear. Más conectar.', 32, 20.5);
  ctx.strokeStyle = '#71845b55';
  ctx.beginPath();
  ctx.moveTo(0, CAMPO.y - 0.5);
  ctx.lineTo(ANCHO, CAMPO.y - 0.5);
  ctx.stroke();

  ctx.fillStyle = '#101e1855';
  ctx.fillRect(0, DETALLE, ANCHO, 52);
  ctx.strokeStyle = '#3b4930';
  ctx.beginPath();
  ctx.moveTo(0, DETALLE + 0.5);
  ctx.lineTo(ANCHO, DETALLE + 0.5);
  ctx.stroke();

  ctx.fillStyle = '#283c27';
  ctx.fillRect(0, INTEGRACION, ANCHO, ALTO - INTEGRACION);
  ctx.strokeStyle = '#526b3f';
  ctx.beginPath();
  ctx.moveTo(0, INTEGRACION + 0.5);
  ctx.lineTo(ANCHO, INTEGRACION + 0.5);
  ctx.stroke();
  ctx.fillStyle = '#edf7e3';
  ctx.font = `600 12.5px ${fuente}`;
  ctx.fillText('TisTms y Business Central', 18, INTEGRACION + 22);
  const anchoTitulo = ctx.measureText('TisTms y Business Central').width;
  ctx.fillStyle = '#cbd8bd';
  ctx.font = `400 11.5px ${fuente}`;
  ctx.fillText('·  Integración desarrollada · Acuerdo con Tecon', 26 + anchoTitulo, INTEGRACION + 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = verde;
  ctx.font = `400 17px ${fuente}`;
  ctx.fillText('↗', ANCHO - 18, INTEGRACION + 25);
  ctx.textAlign = 'left';
}

// Capa fija de piezas (ERP y aplicaciones), una por cada aplicación activa.
// Las sombras difuminadas son caras, así que solo se calculan aquí.
function dibujarPiezas(ctx: CanvasRenderingContext2D, activa: number) {
  const nx = CENTRO.x - NUCLEO.ancho / 2;
  const ny = CENTRO.y - NUCLEO.alto / 2;
  ctx.shadowColor = '#00000055';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  const nucleo = ctx.createLinearGradient(nx, ny, nx + NUCLEO.ancho, ny + NUCLEO.alto);
  nucleo.addColorStop(0, '#3c572e');
  nucleo.addColorStop(1, '#223c24');
  ctx.fillStyle = nucleo;
  caja(ctx, nx, ny, NUCLEO.ancho, NUCLEO.alto, 5);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#b7dc85';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = '#98c4480d';
  ctx.lineWidth = 6;
  caja(ctx, nx - 3, ny - 3, NUCLEO.ancho + 6, NUCLEO.alto + 6, 7);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eff8e6';
  ctx.font = `600 30px ${fuente}`;
  ctx.fillText('ERP', CENTRO.x, CENTRO.y + 2);
  ctx.fillStyle = '#d1e0c0';
  ctx.font = `400 10.5px ${fuente}`;
  ctx.fillText('(Business Central,', CENTRO.x, CENTRO.y + 18);
  ctx.fillText('SAGE, SAP…)', CENTRO.x, CENTRO.y + 30);

  ctx.textAlign = 'left';
  for (const aplicacion of aplicaciones) {
    const x = aplicacion.x - NODO.ancho / 2;
    const y = aplicacion.y - NODO.alto / 2;
    const activo = aplicacion.indice === activa;
    ctx.shadowColor = '#00000044';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 7;
    const relleno = ctx.createLinearGradient(x, y, x + NODO.ancho, y + NODO.alto);
    relleno.addColorStop(0, activo ? '#455d2e' : '#233c2b');
    relleno.addColorStop(1, activo ? '#2b4227' : '#17291e');
    ctx.fillStyle = relleno;
    caja(ctx, x, y, NODO.ancho, NODO.alto, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = activo ? '#b2db76' : '#668356';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (activo) {
      ctx.strokeStyle = '#98c4480c';
      ctx.lineWidth = 3;
      caja(ctx, x - 2, y - 2, NODO.ancho + 4, NODO.alto + 4, 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#c0cdb5';
    ctx.font = `400 10.5px ${fuente}`;
    ctx.fillText(aplicacion.etiqueta, x + 11, y + 21);
    ctx.fillStyle = activo ? '#edf7e4' : '#ffffff';
    ctx.font = `500 20px ${fuente}`;
    ctx.fillText(aplicacion.nombre, x + 11, y + 47);
    ctx.fillStyle = verde;
    ctx.fillRect(x + NODO.ancho - 11, y + NODO.alto - 13, 4, 4);
  }
}

// Trazo con halo: una pasada ancha y transparente debajo sustituye a shadowBlur.
function trazarConHalo(ctx: CanvasRenderingContext2D, puntos: [number, number][], desde: number, hasta: number, color: string, halo: string, grosor: number) {
  ctx.strokeStyle = halo;
  ctx.lineWidth = grosor * 2.6;
  trazarParte(ctx, puntos, desde, hasta);
  ctx.strokeStyle = color;
  ctx.lineWidth = grosor;
  trazarParte(ctx, puntos, desde, hasta);
}

interface Capas {
  fondo: HTMLCanvasElement;
  piezas: HTMLCanvasElement[];
}

function dibujarPanel(ctx: CanvasRenderingContext2D, capas: Capas, t: number, activa: number, cambio: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(capas.fondo, 0, 0);
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.textAlign = 'left';

  // Cables: primero se construyen desde el ERP y luego quedan en reposo.
  for (const aplicacion of aplicaciones) {
    const retraso = aplicacion.indice * 0.1;
    const construccion = tramo(t, retraso, retraso + 1.85);
    const trazado = suave(Math.min(1, construccion / 0.65));
    const enfriado = tramo(construccion, 0.65, 1);
    if (aplicacion.indice === activa) trazarConHalo(ctx, aplicacion.puntos, 0, trazado, '#b6e978', '#98c44826', 1.4);
    else {
      ctx.strokeStyle = '#687d5f';
      ctx.lineWidth = 1.25;
      trazarParte(ctx, aplicacion.puntos, 0, trazado);
    }
    if (construccion < 1) {
      ctx.strokeStyle = `rgba(218, 245, 182, ${1 - enfriado})`;
      ctx.lineWidth = 3;
      trazarParte(ctx, aplicacion.puntos, 0, trazado);
    }
    const encendido = tramo(construccion, 0.2, 0.5);
    ctx.globalAlpha = 0.25 + 0.75 * encendido;
    ctx.fillStyle = construccion > 0.5 && construccion < 0.75 ? '#eeffd3' : '#b5d98c';
    ctx.strokeStyle = '#182112';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(aplicacion.union, aplicacion.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Pulsos que recorren los cables sin parar, desfasados 1,1 s entre sí.
  ctx.lineCap = 'round';
  if (t > 2) {
    for (const aplicacion of aplicaciones) {
      const fase = (((t - 2 + aplicacion.indice * 1.1) / 4.4) % 1 + 1) % 1;
      ctx.globalAlpha = 0.85 * Math.min(1, fase / 0.12, (1 - fase) / 0.12);
      trazarConHalo(ctx, aplicacion.puntos, fase - 0.07, fase, '#d4f997', '#b3e36e40', 3);
    }
    ctx.globalAlpha = 1;
  }

  // Al cambiar de aplicación, una señal más intensa viaja de ella al ERP.
  if (cambio < 1) {
    const vuelta = [...aplicaciones[activa].puntos].reverse() as [number, number][];
    const avance = suave(cambio);
    ctx.globalAlpha = Math.min(1, cambio / 0.12, (1 - cambio) / 0.22);
    trazarConHalo(ctx, vuelta, avance - 0.18, avance, '#efffd3', '#b4e37355', 4);
    ctx.globalAlpha = 1;
  }
  ctx.lineCap = 'butt';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(capas.piezas[activa], 0, 0);
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);

  // Onda de arranque del ERP.
  const onda = tramo(t, 0, 1.1);
  if (onda > 0 && onda < 1) {
    const crecer = 0.94 + 0.24 * onda;
    ctx.globalAlpha = onda < 0.25 ? onda / 0.25 * 0.95 : 0.95 * (1 - onda) / 0.75;
    ctx.strokeStyle = '#d3f0ac';
    ctx.lineWidth = 1.5;
    caja(ctx, CENTRO.x - NUCLEO.ancho * crecer / 2, CENTRO.y - NUCLEO.alto * crecer / 2, NUCLEO.ancho * crecer, NUCLEO.alto * crecer, 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Destello de cada aplicación cuando le llega su cable.
  for (const aplicacion of aplicaciones) {
    const llegada = tramo(t, 0.6 + aplicacion.indice * 0.1, 2.2 + aplicacion.indice * 0.1);
    const brillo = llegada <= 0 || llegada >= 1 ? 0
      : llegada < 0.28 ? llegada / 0.28 : llegada < 0.55 ? 1 : (1 - llegada) / 0.45;
    if (brillo <= 0) continue;
    const x = aplicacion.x - NODO.ancho / 2;
    const y = aplicacion.y - NODO.alto / 2;
    ctx.globalAlpha = 0.95 * brillo;
    ctx.strokeStyle = '#98c44840';
    ctx.lineWidth = 7;
    caja(ctx, x - 1, y - 1, NODO.ancho + 2, NODO.alto + 2, 6);
    ctx.stroke();
    ctx.strokeStyle = '#c9ef93';
    ctx.lineWidth = 1.5;
    caja(ctx, x, y, NODO.ancho, NODO.alto, 5);
    ctx.stroke();
    ctx.fillStyle = '#efffd3';
    ctx.fillRect(x + NODO.ancho - 11, y + NODO.alto - 13, 4, 4);
    ctx.globalAlpha = 1;
  }

  // Detalle de la aplicación activa.
  const texto = aplicaciones[activa];
  ctx.globalAlpha = cambio < 1 ? Math.min(1, cambio / 0.3) : 1;
  ctx.fillStyle = '#cbd6c0';
  ctx.font = `400 13px ${fuente}`;
  ctx.fillText(texto.descripcion, 18, DETALLE + 31);
  ctx.textAlign = 'right';
  ctx.fillStyle = verde;
  ctx.font = `500 12.5px ${fuente}`;
  ctx.fillText(`Ver ${texto.nombre} ↗`, ANCHO - 18, DETALLE + 31);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function crearCapas(): Capas {
  const fondo = lienzo();
  dibujarFondo(fondo.ctx);
  const piezas = aplicaciones.map(({ indice }) => {
    const capa = lienzo();
    dibujarPiezas(capa.ctx, indice);
    return capa.canvas;
  });
  return { fondo: fondo.canvas, piezas };
}

export function crearPlano(anisotropia: number) {
  const tele = new T.Group();
  const ancho = 4.5;
  const alto = ancho * ALTO / ANCHO;
  const negro = new T.MeshStandardMaterial({ color: 0x15191a, roughness: 0.38, metalness: 0.2 });
  const aluminio = new T.MeshStandardMaterial({ color: 0x3a403f, roughness: 0.32, metalness: 0.65 });

  // Marco fino y trasera algo más estrecha, como un televisor actual.
  const respaldo = new T.Mesh(new RoundedFrame(ancho + 0.12, alto + 0.12, 0.07), negro);
  respaldo.castShadow = true;
  tele.add(respaldo);
  const trasera = new T.Mesh(new T.BoxGeometry(ancho * 0.7, alto * 0.62, 0.12), negro);
  trasera.position.set(0, -0.08, -0.08);
  trasera.castShadow = true;
  tele.add(trasera);

  // Peana sobre las mesas de la oficina.
  const columna = new T.Mesh(new T.BoxGeometry(0.16, 0.5, 0.08), aluminio);
  columna.position.set(0, -alto / 2 - 0.2, -0.1);
  columna.castShadow = true;
  tele.add(columna);
  const base = new T.Mesh(new T.BoxGeometry(1.25, 0.04, 0.5), aluminio);
  base.position.set(0, -alto / 2 - 0.45, 0.02);
  base.castShadow = true;
  tele.add(base);
  const piloto = new T.Mesh(new T.BoxGeometry(0.05, 0.015, 0.01), new T.MeshBasicMaterial({ color: 0x98c448 }));
  piloto.position.set(0, -alto / 2 - 0.035, 0.046);
  tele.add(piloto);

  const { canvas: pantallaCanvas, ctx } = lienzo();
  let capas = crearCapas();
  const textura = new T.CanvasTexture(pantallaCanvas);
  textura.colorSpace = T.SRGBColorSpace;
  textura.anisotropy = anisotropia;
  const pantalla = new T.Mesh(new T.PlaneGeometry(ancho, alto), new T.MeshBasicMaterial({ map: textura, toneMapped: false }));
  pantalla.position.z = 0.046;
  tele.add(pantalla);

  // Reflejo diagonal muy tenue sobre el cristal.
  const reflejo = document.createElement('canvas');
  reflejo.width = 256;
  reflejo.height = 144;
  const luz = reflejo.getContext('2d')!;
  const degradado = luz.createLinearGradient(0, 0, 256, 144);
  degradado.addColorStop(0, '#ffffff14');
  degradado.addColorStop(0.42, '#ffffff05');
  degradado.addColorStop(0.43, '#ffffff00');
  luz.fillStyle = degradado;
  luz.fillRect(0, 0, 256, 144);
  const texturaReflejo = new T.CanvasTexture(reflejo);
  const cristal = new T.Mesh(
    new T.PlaneGeometry(ancho, alto),
    new T.MeshBasicMaterial({ map: texturaReflejo, transparent: true, depthWrite: false, toneMapped: false }),
  );
  cristal.position.z = 0.048;
  tele.add(cristal);

  let inicio = -1;
  let activa = 0;
  let cambio = 1;
  let ultimoCambio = 0;
  let ultimoTiempo = 0;
  const ROTACION = 4.2;

  function seleccionar(indice: number, segundos: number) {
    if (indice === activa) return;
    activa = indice;
    cambio = 0;
    ultimoCambio = segundos;
  }

  dibujarPanel(ctx, capas, 99, activa, 1);

  return {
    objeto: tele,
    respaldo,
    pantalla,
    actualizarTipografia() {
      // Con la fuente ya cargada se rehacen las capas fijas, que llevan texto.
      capas = crearCapas();
      dibujarPanel(ctx, capas, inicio < 0 ? 99 : ultimoTiempo, activa, 1);
      textura.needsUpdate = true;
    },
    /** Avanza la animación; `uv` es el punto de la pantalla bajo el ratón, si lo hay. */
    animar(tiempo: number, uv?: T.Vector2) {
      if (inicio < 0) inicio = tiempo;
      const segundos = (tiempo - inicio) / 1000;
      const paso = Math.max(0, segundos - ultimoTiempo);
      ultimoTiempo = segundos;
      if (uv) {
        const x = uv.x * ANCHO;
        const y = (1 - uv.y) * ALTO;
        const encima = aplicaciones.find((aplicacion) => Math.abs(x - aplicacion.x) < NODO.ancho / 2 && Math.abs(y - aplicacion.y) < NODO.alto / 2);
        if (encima) seleccionar(encima.indice, segundos);
        ultimoCambio = segundos;
      } else if (segundos > 3 && segundos - ultimoCambio > ROTACION) {
        seleccionar((activa + 1) % aplicaciones.length, segundos);
      }
      cambio = Math.min(1, cambio + paso / 1.1);
      dibujarPanel(ctx, capas, segundos, activa, cambio);
      textura.needsUpdate = true;
    },
  };
}

// Marco de la pantalla: una caja con los cantos apenas redondeados.
class RoundedFrame extends T.ExtrudeGeometry {
  constructor(ancho: number, alto: number, fondo: number) {
    const r = 0.035;
    const forma = new T.Shape();
    forma.moveTo(-ancho / 2 + r, -alto / 2);
    forma.lineTo(ancho / 2 - r, -alto / 2);
    forma.quadraticCurveTo(ancho / 2, -alto / 2, ancho / 2, -alto / 2 + r);
    forma.lineTo(ancho / 2, alto / 2 - r);
    forma.quadraticCurveTo(ancho / 2, alto / 2, ancho / 2 - r, alto / 2);
    forma.lineTo(-ancho / 2 + r, alto / 2);
    forma.quadraticCurveTo(-ancho / 2, alto / 2, -ancho / 2, alto / 2 - r);
    forma.lineTo(-ancho / 2, -alto / 2 + r);
    forma.quadraticCurveTo(-ancho / 2, -alto / 2, -ancho / 2 + r, -alto / 2);
    super(forma, { depth: fondo, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 });
    this.translate(0, 0, -fondo / 2);
  }
}
