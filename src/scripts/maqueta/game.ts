import * as T from 'three';

const tanteos = [
  { puntos: ['30', '30'], juegos: ['5', '4'], set: ['—', '—'], estado: 'Juego igualado' },
  { puntos: ['40', '30'], juegos: ['5', '4'], set: ['—', '—'], estado: 'Punto de set · Jugador A' },
  { puntos: ['0', '0'], juegos: ['0', '0'], set: ['6', '4'], estado: 'Primer set · 6–4' },
];

export function crearPistaGame() {
  const pista = new T.Group();
  pista.position.set(55, 0, -7);
  const cubo = new T.BoxGeometry(1, 1, 1);

  function pieza(color: number, ancho: number, alto: number, fondo: number, x: number, y: number, z: number) {
    const mesh = new T.Mesh(cubo, new T.MeshStandardMaterial({ color, roughness: 0.88 }));
    mesh.scale.set(ancho, alto, fondo);
    mesh.position.set(x, y, z);
    mesh.castShadow = alto > 0.18;
    mesh.receiveShadow = true;
    pista.add(mesh);
  }

  pieza(0xd9dfce, 13, 0.85, 21, 0, -0.41, 0);
  pieza(0xa5b695, 12.65, 0.13, 20.65, 0, 0.05, 0);
  pieza(0x60877d, 10.4, 0.06, 17.8, 0, 0.14, 0);
  const cal = 0xf4f2dc;
  for (const x of [-4.1, -3.1, 3.1, 4.1]) pieza(cal, 0.065, 0.008, 15, x, 0.174, 0);
  for (const z of [-7.5, 7.5]) pieza(cal, 8.27, 0.008, 0.065, 0, 0.174, z);
  for (const z of [-4, 4]) pieza(cal, 6.2, 0.008, 0.065, 0, 0.174, z);
  pieza(cal, 0.065, 0.008, 8, 0, 0.174, 0);
  for (const x of [-4.4, 4.4]) pieza(0x273d35, 0.13, 0.93, 0.13, x, 0.63, 0);
  pieza(cal, 8.8, 0.065, 0.045, 0, 1.01, 0);
  const red = new T.BufferGeometry();
  const segmentos = [];
  for (let x = -4.35; x <= 4.35; x += 0.15) segmentos.push(x, 0.2, 0, x, 1, 0);
  for (let y = 0.2; y < 1; y += 0.1) segmentos.push(-4.35, y, 0, 4.35, y, 0);
  red.setAttribute('position', new T.Float32BufferAttribute(segmentos, 3));
  pista.add(new T.LineSegments(red, new T.LineBasicMaterial({ color: 0x425f50, transparent: true, opacity: 0.66 })));

  pieza(0x283f35, 4.72, 2.9, 0.25, 0, 2.63, -9.15);
  for (const x of [-1.8, 1.8]) pieza(0x526b59, 0.16, 1.45, 0.19, x, 0.83, -9.2);
  pieza(0xc1a87b, 2.6, 0.16, 0.69, 5.55, 0.59, 4.1);
  for (const x of [4.6, 6.4]) pieza(0x526b59, 0.14, 0.46, 0.55, x, 0.35, 4.1);

  for (const [x, z, camiseta, lado] of [[-1.5, 6.7, 0xe8e9da, -1], [3.3, -6.5, 0xc4d88f, 1]]) {
    pieza(camiseta, 0.43, 0.56, 0.29, x, 1.12, z);
    pieza(0xb98968, 0.31, 0.32, 0.31, x, 1.57, z);
    pieza(0x394a40, 0.36, 0.10, 0.34, x, 1.74, z);
    for (const dx of [-0.12, 0.12]) pieza(0x31483d, 0.16, 0.63, 0.18, x + dx, 0.53, z);
    pieza(camiseta, 0.27, 0.15, 0.18, x + 0.29, 1.1, z);
    pieza(0x31483d, 0.055, 0.34, 0.065, x + 0.42, 1.23, z + lado * 0.10);
    const raqueta = new T.Mesh(
      new T.TorusGeometry(0.13, 0.023, 6, 16),
      new T.MeshStandardMaterial({ color: 0xe9eadc }),
    );
    raqueta.scale.y = 1.35;
    raqueta.position.set(x + 0.42, 1.52, z + lado * 0.10);
    pista.add(raqueta);
  }

  const lienzo = document.createElement('canvas');
  lienzo.width = 1024;
  lienzo.height = 620;
  const ctx = lienzo.getContext('2d')!;
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  const marcador = new T.Mesh(new T.PlaneGeometry(4.52, 2.74), new T.MeshBasicMaterial({ map: textura, toneMapped: false }));
  marcador.position.set(0, 2.63, -9.017);
  pista.add(marcador);

  function texto(valor: string, x: number, y: number, tamaño: number, color = '#f1f5e7', peso = 650) {
    ctx.fillStyle = color;
    ctx.font = `${peso} ${tamaño}px "Archivo Variable", sans-serif`;
    ctx.fillText(valor, x, y);
  }

  let estadoAnterior = -1;
  function actualizar(avance: number) {
    const estado = avance >= 2.75 ? 2 : avance >= 1.75 ? 1 : 0;
    if (estado === estadoAnterior) return;
    estadoAnterior = estado;
    const { set, juegos, puntos, estado: mensaje } = tanteos[estado];
    ctx.fillStyle = '#152c24';
    ctx.fillRect(0, 0, 1024, 620);
    ctx.fillStyle = '#223c31';
    ctx.fillRect(0, 0, 1024, 126);
    ctx.textAlign = 'left';
    texto('TisGame', 42, 78, 52);
    texto('PISTA 1  /  INDIVIDUAL', 659, 75, 27, '#c6d9b4');
    const columnas = [521, 699, 885];
    ctx.textAlign = 'center';
    ['SET 1', 'JUEGOS', 'PUNTOS'].forEach((nombre, i) => texto(nombre, columnas[i], 190, 26, '#aabfa4'));
    for (const [i, y] of [218, 356].entries()) {
      ctx.fillStyle = i === 0 && estado > 0 ? '#385346' : '#263f34';
      ctx.fillRect(37, y, 950, 121);
      ctx.textAlign = 'left';
      texto(i === 0 ? 'Jugador A' : 'Jugador B', 65, y + 76, 40);
      ctx.textAlign = 'center';
      [set[i], juegos[i], puntos[i]].forEach((valor, j) => texto(valor, columnas[j], y + 83, 62, i === 0 && estado > 0 ? '#d6ed9e' : '#f1f5e7'));
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b9da81';
    ctx.fillRect(42, 544, 12, 12);
    texto(mensaje, 72, 565, 34, '#d2e6ad');
    textura.needsUpdate = true;
  }

  actualizar(0);
  return { pista, marcador: marcador.position.clone().add(pista.position), actualizar };
}

export function prepararGame(pista: ReturnType<typeof crearPistaGame>) {
  const camara = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 260);
  const foco = new T.Vector3();
  const vistaInicial = new T.Vector3(11, 22, 24);
  const vistaFinal = new T.Vector3(0.2, 0.25, 5);
  const vista = new T.Vector3();
  const horizontal = matchMedia('(max-height: 500px) and (min-aspect-ratio: 7/5)');

  return {
    camara,
    foco,
    actualizar(avance: number, ancho: number, alto: number) {
      const acercamiento = T.MathUtils.smoothstep(avance, 0, 1);
      foco.lerpVectors(pista.pista.position, pista.marcador, acercamiento);
      camara.position.copy(foco).add(vista.lerpVectors(vistaInicial, vistaFinal, acercamiento));
      const aspecto = ancho / alto;
      const movil = ancho <= 720 && !horizontal.matches;
      const vertical = T.MathUtils.lerp(Math.max(24, 18 / aspecto), Math.max(4.4, (movil ? 5.5 : 9.1) / aspecto), acercamiento);
      camara.top = vertical / 2;
      camara.bottom = -camara.top;
      camara.right = camara.top * aspecto;
      camara.left = -camara.right;
      camara.setViewOffset(ancho, alto, movil ? 0 : -ancho * 0.21, movil ? alto * 0.20 : 0, ancho, alto);
      pista.actualizar(avance);
    },
  };
}
