import * as T from 'three';
import { productos } from '../../data/negocio';

const aplicaciones = [
  { id: 'tistms', etiqueta: 'Transporte', x: 57, y: 151 },
  { id: 'tissga', etiqueta: 'Almacén', x: 483, y: 151 },
  { id: 'tistransit', etiqueta: 'Documentación', x: 57, y: 404 },
  { id: 'tistime', etiqueta: 'Personas y gastos', x: 483, y: 404 },
] as const;

function dibujarPlano(ctx: CanvasRenderingContext2D) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f3f1e4';
  ctx.fillRect(0, 0, 760, 532);

  const tinta = ctx.createLinearGradient(30, 22, 730, 510);
  tinta.addColorStop(0, '#243f30');
  tinta.addColorStop(1, '#142b23');
  ctx.fillStyle = tinta;
  ctx.fillRect(23, 22, 714, 488);

  ctx.strokeStyle = '#9fb88916';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 44; x < 737; x += 24) {
    ctx.moveTo(x, 22);
    ctx.lineTo(x, 510);
  }
  for (let y = 46; y < 510; y += 24) {
    ctx.moveTo(23, y);
    ctx.lineTo(737, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#bbd88b';
  ctx.fillRect(57, 63, 9, 9);
  ctx.fillStyle = '#f2f4e8';
  ctx.font = '650 36px "Archivo Variable", sans-serif';
  ctx.fillText('Plano de integraciones', 81, 81);
  ctx.strokeStyle = '#87a07b80';
  ctx.beginPath();
  ctx.moveTo(57, 110);
  ctx.lineTo(703, 110);
  ctx.stroke();

  // Cada rama entra en el ERP de forma independiente.
  ctx.strokeStyle = '#9ab783';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const x of [323, 437]) {
    ctx.moveTo(x === 323 ? 277 : 483, 192);
    ctx.lineTo(x, 192);
    ctx.lineTo(x, 274);
    ctx.moveTo(x === 323 ? 277 : 483, 445);
    ctx.lineTo(x, 445);
    ctx.lineTo(x, 356);
  }
  ctx.stroke();

  for (const { id, etiqueta, x, y } of aplicaciones) {
    const nombre = productos.find((producto) => producto.id === id)!.nombre;
    ctx.beginPath();
    ctx.roundRect(x, y, 220, 82, 6);
    ctx.fillStyle = '#2a4436';
    ctx.fill();
    ctx.strokeStyle = '#718d68';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#c4d3bc';
    ctx.font = '550 20px "Archivo Variable", sans-serif';
    ctx.fillText(etiqueta, x + 16, y + 28);
    ctx.fillStyle = '#f2f4e8';
    ctx.font = '690 34px "Archivo Variable", sans-serif';
    ctx.fillText(nombre, x + 16, y + 64);
    ctx.fillStyle = '#bbd88b';
    ctx.beginPath();
    ctx.arc(x < 380 ? x + 220 : x, y + 41, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.roundRect(255, 270, 250, 90, 7);
  ctx.fillStyle = '#d0e3a8';
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1c3528';
  ctx.font = '720 43px "Archivo Variable", sans-serif';
  ctx.fillText('ERP', 380, 313);
  ctx.font = '560 17px "Archivo Variable", sans-serif';
  ctx.fillText('Business Central · Sage · SAP', 380, 339);
}

export function crearPlano(anisotropia: number) {
  const plano = new T.Group();
  const ancho = 4.26;
  const alto = ancho * 532 / 760;

  const respaldo = new T.Mesh(
    new T.BoxGeometry(ancho + 0.49, alto + 0.39, 0.14),
    new T.MeshStandardMaterial({ color: 0x6e5137, roughness: 0.85 }),
  );
  respaldo.castShadow = true;
  plano.add(respaldo);

  const corcho = document.createElement('canvas');
  corcho.width = 768;
  corcho.height = 544;
  const grano = corcho.getContext('2d')!;
  grano.fillStyle = '#af8b64';
  grano.fillRect(0, 0, corcho.width, corcho.height);
  let semilla = 523;
  const azar = () => {
    semilla = (Math.imul(1664525, semilla) + 1013904223) >>> 0;
    return semilla / 4294967296;
  };
  for (let i = 0; i < 22000; i++) {
    grano.fillStyle = i % 3 ? '#563b2839' : '#f5d5a95a';
    grano.fillRect(azar() * corcho.width, azar() * corcho.height, 1 + azar() * 3, 1 + azar() * 2);
  }
  const texturaCorcho = new T.CanvasTexture(corcho);
  texturaCorcho.colorSpace = T.SRGBColorSpace;
  texturaCorcho.anisotropy = anisotropia;
  const superficie = new T.Mesh(
    new T.PlaneGeometry(ancho + 0.36, alto + 0.26),
    new T.MeshBasicMaterial({ map: texturaCorcho, toneMapped: false }),
  );
  superficie.position.z = 0.071;
  plano.add(superficie);

  const lienzo = document.createElement('canvas');
  lienzo.width = 1520;
  lienzo.height = 1064;
  const ctx = lienzo.getContext('2d')!;
  const textura = new T.CanvasTexture(lienzo);
  textura.colorSpace = T.SRGBColorSpace;
  textura.anisotropy = anisotropia;
  dibujarPlano(ctx);

  const hoja = new T.PlaneGeometry(ancho, alto, 8, 8).translate(0, -alto / 2, 0);
  const contrahoja = new T.Mesh(hoja, new T.MeshBasicMaterial({ color: 0xdcdcc5, toneMapped: false }));
  contrahoja.position.set(0.045, alto / 2 - 0.045, 0.089);
  contrahoja.rotation.z = 0.015;
  plano.add(contrahoja);

  const diagrama = new T.Mesh(hoja, new T.MeshBasicMaterial({ map: textura, toneMapped: false }));
  diagrama.position.set(0, alto / 2, 0.117);
  plano.add(diagrama);

  const sombra = document.createElement('canvas');
  sombra.width = 256;
  sombra.height = 192;
  const luz = sombra.getContext('2d')!;
  luz.shadowColor = '#23190f85';
  luz.shadowBlur = 12;
  luz.shadowOffsetX = 256;
  luz.fillRect(18 - 256, 14, 220, 164);
  const sombraPapel = new T.Mesh(
    new T.PlaneGeometry(ancho + 0.44, alto + 0.31),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(sombra), transparent: true, depthWrite: false }),
  );
  sombraPapel.position.set(0.04, -0.035, 0.081);
  plano.add(sombraPapel);

  const pin = new T.SphereGeometry(0.041, 12, 8);
  const laton = new T.MeshStandardMaterial({ color: 0xc89e59, roughness: 0.48, metalness: 0.28 });
  for (const x of [-1.89, 1.89]) {
    const chincheta = new T.Mesh(pin, laton);
    chincheta.position.set(x, alto / 2 - 0.075, 0.145);
    plano.add(chincheta);
  }

  // La esquina inferior se curva mientras el borde sujeto por las chinchetas queda fijo.
  diagrama.geometry = hoja.clone();
  const vertices = diagrama.geometry.attributes.position;
  function curvarPapel(progreso: number) {
    for (let i = 0; i < vertices.count; i++) {
      const bordeInferior = (-vertices.getY(i) / alto) ** 3;
      const esquina = (0.5 + vertices.getX(i) / ancho) ** 2;
      vertices.setZ(i, bordeInferior * (0.018 + esquina * (0.045 + 0.19 * progreso)));
    }
    vertices.needsUpdate = true;
  }
  curvarPapel(0);

  return {
    objeto: plano,
    respaldo,
    actualizarTipografia() {
      dibujarPlano(ctx);
      textura.needsUpdate = true;
    },
    animar(progreso: number) {
      curvarPapel(progreso);
    },
  };
}
