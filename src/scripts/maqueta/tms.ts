import * as T from 'three';

export function crearPantallaTms() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 1024;
  lienzo.height = 640;
  const ctx = lienzo.getContext('2d')!;
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  let ultimo = -1;

  function escribir(texto: string, x: number, y: number, tamaño: number, peso = 500, color = '#20372b') {
    ctx.fillStyle = color;
    ctx.font = `${peso} ${tamaño}px "Archivo Variable", sans-serif`;
    ctx.fillText(texto, x, y);
  }

  function tarjeta(x: number, y: number, ancho: number, alto: number, fondo: string, borde: string) {
    ctx.beginPath();
    ctx.roundRect(x, y, ancho, alto, 14);
    ctx.fillStyle = fondo;
    ctx.fill();
    ctx.strokeStyle = borde;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function actualizar(avance: number) {
    const etapa = Math.round(T.MathUtils.clamp(avance - 1, 0, 2) * 32);
    if (etapa === ultimo) return;
    ultimo = etapa;
    const seleccion = T.MathUtils.smoothstep(etapa, 7, 32);
    const asignacion = T.MathUtils.smoothstep(etapa, 35, 61);

    ctx.fillStyle = '#f1f3e9';
    ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = '#20382b';
    ctx.fillRect(0, 0, 1024, 100);
    escribir('TisTms', 48, 65, 49, 750, '#ecf3e1');
    escribir('TRÁFICO', 842, 63, 25, 650, '#c2da9d');
    escribir('Asignación de recursos', 48, 171, 45, 690);

    tarjeta(48, 220, 444, 292, '#fcfdf7', '#cbd6c6');
    escribir(asignacion > 0.65 ? 'VIAJE PLANIFICADO' : 'VIAJE PENDIENTE', 78, 268, 23, 650, '#4d6553');
    escribir('Murcia', 78, 330, 35, 680);
    escribir('Valencia', 320, 470, 35, 680);
    ctx.strokeStyle = '#64883f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(91, 363);
    ctx.bezierCurveTo(215, 363, 276, 412, 398, 413);
    ctx.stroke();
    for (const [x, y] of [[91, 363], [398, 413]]) {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#c7db9f';
      ctx.fill();
      ctx.stroke();
    }

    tarjeta(526, 220, 450, 167, '#fcfdf7', '#cbd6c6');
    ctx.globalAlpha = seleccion;
    tarjeta(526, 220, 450, 167, '#e4efcf', '#64883f');
    ctx.globalAlpha = 1;
    escribir('Vehículo 01', 566, 292, 39, 700);
    escribir(asignacion > 0.65 ? 'Asignado al viaje' : 'Disponible', 566, 342, 31, 530, '#456145');

    tarjeta(526, 418, 450, 94, '#e0e8d7', '#cbd6c6');
    ctx.globalAlpha = seleccion;
    tarjeta(526, 418, 450, 94, '#245943', '#245943');
    ctx.globalAlpha = 1;
    escribir(asignacion > 0.65 ? 'Vinculado al viaje' : 'Asignar', 566, 477, 34, 650, seleccion > 0.6 ? '#f5f8ed' : '#20372b');
    escribir(asignacion > 0.65 ? 'Recurso asignado' : 'Seleccionad un recurso disponible', 48, 588, 31, 570, '#456145');
    textura.needsUpdate = true;
  }

  actualizar(0);
  return {
    textura,
    actualizar,
    redibujar() {
      const etapa = ultimo;
      ultimo = -1;
      actualizar(etapa / 32 + 1);
    },
  };
}

export function prepararTms(pantalla: ReturnType<typeof crearPantallaTms>, monitor: T.Vector3) {
  const camara = new T.OrthographicCamera(-1, 1, 1, -1, 0.03, 260);
  const foco = new T.Vector3();
  const encuadres = [
    { vista: [5, 5, 6], centro: [0.4, -0.6, 0.5], alto: 9.5 },
    { vista: [0, 0, 0.82], centro: [0, 0, 0], alto: 2.08 },
  ] as const;
  const vista = new T.Vector3();
  const destino = new T.Vector3();

  return {
    camara,
    foco,
    actualizar(avance: number, ancho: number, alto: number) {
      const t = T.MathUtils.smoothstep(avance, 0, 1);
      const [a, b] = encuadres;
      foco.copy(monitor).add(vista.set(...a.centro).lerp(destino.set(...b.centro), t));
      camara.position.copy(foco).add(vista.set(...a.vista).lerp(destino.set(...b.vista), t));
      const aspecto = ancho / alto;
      const vertical = T.MathUtils.lerp(a.alto, b.alto, t);
      const horizontal = matchMedia('(max-height: 500px) and (min-aspect-ratio: 7/5)').matches;
      const movil = ancho <= 720 && !horizontal;
      camara.top = Math.max(vertical, (movil ? 2.5 : horizontal ? 4.15 : 3.8) / aspecto) / 2;
      camara.bottom = -camara.top;
      camara.right = camara.top * aspecto;
      camara.left = -camara.right;
      camara.setViewOffset(ancho, alto, movil ? 0 : -ancho * (horizontal ? 0.23 : 0.19), movil ? alto * 0.20 : 0, ancho, alto);
      pantalla.actualizar(avance);
    },
  };
}
