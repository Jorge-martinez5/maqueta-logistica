import * as T from 'three';

// Grano determinista y compartido. La escala real la fija mundo.ts con coordenadas UV en metros
// (uvEnMetros), para que el grano mida lo mismo en una losa grande que en una pieza pequeña.
export function crearTexturaSuperficie(tipo: 'pavimento' | 'madera', anisotropia: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const datos = ctx.createImageData(256, 256);
  let semilla = 37;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0;
      const ruido = semilla / 4294967296;
      const veta = tipo === 'madera' ? Math.sin(y * .72 + Math.sin(x * .025) * 2) * 13 : 0;
      const valor = 190 + ruido * (tipo === 'madera' ? 15 : 42) + veta;
      const i = (y * 256 + x) * 4;
      datos.data[i] = datos.data[i + 1] = datos.data[i + 2] = valor;
      datos.data[i + 3] = 255;
    }
  }
  ctx.putImageData(datos, 0, 0);
  const textura = new T.CanvasTexture(canvas);
  textura.wrapS = textura.wrapT = T.RepeatWrapping;
  textura.anisotropy = anisotropia;
  return textura;
}
