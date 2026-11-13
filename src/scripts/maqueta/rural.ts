import * as T from 'three';

export function crearPantallaRural(anisotropia: number) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 1040;
  lienzo.height = 600;
  const ctx = lienzo.getContext('2d')!;
  ctx.scale(2, 2);
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  textura.anisotropy = anisotropia;
  let fase = -1;

  function texto(cadena: string, x: number, y: number, tamaño: number, peso = 500, color = '#233927') {
    ctx.font = `${peso} ${tamaño}px "Archivo Variable", sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(cadena, x, y);
  }

  function reserva(columna: number, fila: number, etiqueta: string, destacada = false) {
    const x = 104 + columna * 56;
    const y = 130 + fila * 39;
    ctx.beginPath();
    ctx.roundRect(x, y, 156, 26, 4);
    ctx.fillStyle = destacada ? '#98c34c' : '#dce6cf';
    ctx.fill();
    ctx.textAlign = 'center';
    texto(etiqueta, x + 78, y + 18, 14, destacada ? 700 : 500);
    ctx.textAlign = 'left';
  }

  function redibujar() {
    ctx.fillStyle = '#f7f5eb';
    ctx.fillRect(0, 0, 520, 300);
    texto('T', 20, 38, 26, 800, '#81a93c');
    texto('isRural', 36, 38, 26, 800);
    texto('Calendario de reservas', 20, 76, 22, 650);
    texto('Noviembre', 420, 76, 15, 600);
    ctx.fillStyle = '#fffef8';
    ctx.fillRect(98, 90, 392, 151);
    ctx.fillStyle = '#eeefe4';
    ctx.fillRect(378, 90, 112, 151);
    ctx.strokeStyle = '#e3e6d9';
    ctx.beginPath();
    for (let columna = 0; columna <= 7; columna++) {
      const x = 98 + columna * 56;
      ctx.moveTo(x, 90);
      ctx.lineTo(x, 241);
    }
    for (const y of [124, 163, 202, 241]) {
      ctx.moveTo(98, y);
      ctx.lineTo(490, y);
    }
    ctx.stroke();
    ctx.textAlign = 'center';
    ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].forEach((dia, i) => {
      texto(dia, 126 + i * 56, 103, 11, 600);
      texto(String(16 + i), 126 + i * 56, 118, 13, 650);
    });
    ctx.textAlign = 'left';
    ['Olivo', 'Pino', 'Encina'].forEach((nombre, i) => texto(nombre, 20, 149 + i * 39, 16, 650));
    reserva(0, 0, 'Reservado');
    reserva(4, 2, 'Reservado');
    if (fase >= 1) reserva(2, 1, '3 noches', true);
    texto(fase >= 2 ? 'Reserva confirmada' : fase === 1 ? 'Estancia seleccionada' : 'Consultar disponibilidad', 20, 276, 18, 650);
    if (fase >= 1) texto('18–21 nov.', 412, 276, 14, 600);
    textura.needsUpdate = true;
  }

  function actualizar(avance: number) {
    const siguiente = avance >= 2.75 ? 2 : avance >= 1.75 ? 1 : 0;
    if (fase === siguiente) return;
    fase = siguiente;
    redibujar();
  }

  actualizar(0);
  return { textura, actualizar, redibujar };
}
