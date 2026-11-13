import * as T from 'three';

export function crearPantallaTime(anisotropia: number) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 360;
  lienzo.height = 680;
  const ctx = lienzo.getContext('2d')!;
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  textura.anisotropy = anisotropia;
  let fase = -1;

  function texto(valor: string, x: number, y: number, tamaño: number, peso = 550, color = '#253b29') {
    ctx.font = `${peso} ${tamaño}px "Archivo Variable", sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(valor, x, y);
  }

  function redibujar() {
    ctx.fillStyle = fase === 0 ? '#24392d' : '#f6f5ec';
    ctx.fillRect(0, 0, 360, 680);
    ctx.textAlign = 'center';
    if (fase === 0) {
      texto('TisTime', 180, 358, 47, 750, '#f3f7e9');
    } else {
      ctx.textAlign = 'left';
      texto('T', 23, 89, 41, 800, '#84ae45');
      texto('isTime', 48, 89, 41, 800);
      texto('Mi jornada', 24, 139, 24);
      ctx.fillStyle = '#dce4d1';
      ctx.fillRect(24, 160, 312, 2);
      ctx.textAlign = 'center';
      ctx.beginPath();
      ctx.arc(180, 280, 42, 0, Math.PI * 2);
      ctx.fillStyle = '#dfeacb';
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = '#537839';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      if (fase === 2) {
        ctx.moveTo(161, 280);
        ctx.lineTo(175, 294);
        ctx.lineTo(199, 267);
      } else {
        ctx.arc(180, 280, 21, 0, Math.PI * 2);
        ctx.moveTo(180, 266);
        ctx.lineTo(180, 280);
        ctx.lineTo(191, 286);
      }
      ctx.stroke();
      texto(fase === 2 ? 'Fichaje realizado' : 'Jornada en curso', 180, 370, 34, 700);
      texto(fase === 2 ? 'Salida registrada' : 'Entrada registrada a las 08:00', 180, 415, 21);
      ctx.beginPath();
      ctx.roundRect(36, 466, 288, 59, 28);
      ctx.fillStyle = fase === 2 ? '#dfeacb' : '#285b38';
      ctx.fill();
      texto(fase === 2 ? 'Jornada finalizada' : 'Registrar salida', 180, 503, 23, 650, fase === 2 ? '#3e622b' : '#ffffff');
    }
    ctx.fillStyle = fase === 0 ? '#c7d7c3' : '#899886';
    ctx.beginPath();
    ctx.roundRect(126, 651, 108, 6, 3);
    ctx.fill();
    textura.needsUpdate = true;
  }

  return {
    textura,
    redibujar,
    actualizar(avance: number) {
      const siguiente = avance >= 1.75 ? 2 : avance >= 0.7 ? 1 : 0;
      if (fase === siguiente) return;
      fase = siguiente;
      redibujar();
    },
  };
}

export function prepararTime(puesto: { actualizar(avance: number): void; telefono: T.Group }) {
  const camara = new T.OrthographicCamera(-1, 1, 1, -1, 0.03, 260);
  const foco = new T.Vector3();
  const movil = new T.Vector3();
  const escritorio = new T.Vector3(10.15, 1.61, 2.33);
  const vista = new T.Vector3();
  const destino = new T.Vector3();

  return {
    camara, foco,
    actualizar(avance: number, ancho: number, alto: number) {
      puesto.actualizar(avance);
      puesto.telefono.getWorldPosition(movil);
      const acercar = T.MathUtils.smoothstep(avance, 0.08, 1);
      foco.copy(escritorio).lerp(movil, acercar);
      vista.set(4.7, 4.8, 4.6).lerp(destino.set(0.90, 0.055, 0.43), acercar);
      camara.position.copy(foco).add(vista);
      const aspecto = ancho / alto;
      const apaisado = alto <= 500 && aspecto >= 1.4;
      const estrecho = ancho <= 720 && !apaisado;
      const inicial = Math.max(5.4, (estrecho ? 4.7 : 5.4) / aspecto);
      const final = Math.max(estrecho ? 0.99 : apaisado ? 0.84 : 0.80, (estrecho ? 0.43 : 0.63) / aspecto);
      camara.top = T.MathUtils.lerp(inicial, final, acercar) / 2;
      camara.setViewOffset(ancho, alto, estrecho ? 0 : -ancho * (apaisado ? 0.24 : 0.19), estrecho ? alto * 0.23 : 0, ancho, alto);
    },
  };
}
