import * as T from 'three';
import { cargarModelo } from '../modelos';

/**
 * Personas modeladas en Blender (blender/personas.py → public/maqueta/personas.glb).
 * Cada pieza llega con materiales por nombre (Ropa, Pantalón, Piel…) y aquí se
 * visten con los colores de cada personaje.
 */
export type Prenda = 'Ropa' | 'Pantalón' | 'Calzado' | 'Piel' | 'Pelo' | 'Chaleco' | 'Reflectante' | 'Ojos' | 'Gorra' | 'Mejilla';
export type Vestuario = Partial<Record<Prenda, number>>;
type NombrePieza = 'Sentado' | 'TorsoDePie' | 'Pierna' | 'Cabeza' | 'Gorra' | 'Moño' | 'BrazoSuperior' | 'Antebrazo';

const BASE: Record<Prenda, number> = {
  Ropa: 0xf4efdf, Pantalón: 0x354d57, Calzado: 0x242e2d, Piel: 0xd8a478, Pelo: 0x4a3529,
  Chaleco: 0xcbd86e, Reflectante: 0xedeee0, Ojos: 0x1d2422, Gorra: 0x37664c, Mejilla: 0xe48f78,
};
// Largo de cada tramo del brazo en el modelo (crecen hacia +Y desde la articulación).
const LARGO_SUPERIOR = 0.45;
const LARGO_ANTEBRAZO = 0.47;

export interface Personas {
  pieza(nombre: NombrePieza, vestuario?: Vestuario): T.Object3D;
  /** Brazo de dos tramos; devuelve la función que lo coloca entre hombro, codo y palma (en coordenadas de `parent`). */
  brazo(parent: T.Object3D, vestuario?: Vestuario, grosor?: number): (hombro: T.Vector3, codo: T.Vector3, palma: T.Vector3) => void;
}

let carga: Promise<Personas> | undefined;

export function cargarPersonas() {
  carga ??= cargarModelo('/maqueta/personas.glb').then(({ scene }) => crearPersonas(scene)).catch((error: unknown) => {
    carga = undefined; // El siguiente intento vuelve a pedir el archivo.
    throw error;
  });
  return carga;
}

function crearPersonas(escena: T.Object3D): Personas {
  const modelos = new Map<string, T.Object3D>();
  for (const hijo of escena.children) modelos.set(hijo.name, hijo);
  const materiales = new Map<string, T.MeshStandardMaterial>();

  function tela(prenda: Prenda, color: number) {
    const clave = `${prenda}:${color}`;
    if (!materiales.has(clave)) {
      materiales.set(clave, new T.MeshStandardMaterial({
        color,
        roughness: prenda === 'Ojos' ? 0.25 : prenda === 'Reflectante' ? 0.35 : prenda === 'Piel' ? 0.62 : 0.82,
        name: prenda,
      }));
    }
    return materiales.get(clave)!;
  }

  function pieza(nombre: NombrePieza, vestuario: Vestuario = {}) {
    const modelo = modelos.get(nombre);
    if (!modelo) throw new Error(`Falta la pieza «${nombre}» en personas.glb`);
    const copia = modelo.clone();
    copia.position.set(0, 0, 0);
    copia.traverse((parte) => {
      if (!(parte instanceof T.Mesh)) return;
      const prenda = (parte.material as T.Material).name as Prenda;
      parte.material = tela(prenda, vestuario[prenda] ?? BASE[prenda] ?? 0x888888);
      parte.castShadow = true;
      parte.receiveShadow = true;
    });
    return copia;
  }

  const eje = new T.Vector3(0, 1, 0);
  const direccion = new T.Vector3();

  function brazo(parent: T.Object3D, vestuario: Vestuario = {}, grosor = 1) {
    const superior = pieza('BrazoSuperior', vestuario);
    const antebrazo = pieza('Antebrazo', vestuario);
    parent.add(superior, antebrazo);
    const orientar = (tramo: T.Object3D, desde: T.Vector3, hasta: T.Vector3, largo: number) => {
      direccion.subVectors(hasta, desde);
      tramo.position.copy(desde);
      tramo.scale.set(grosor, Math.max(0.01, direccion.length() / largo), grosor);
      tramo.quaternion.setFromUnitVectors(eje, direccion.normalize());
    };
    return (hombro: T.Vector3, codo: T.Vector3, palma: T.Vector3) => {
      orientar(superior, hombro, codo, LARGO_SUPERIOR);
      orientar(antebrazo, codo, palma, LARGO_ANTEBRAZO);
    };
  }

  return { pieza, brazo };
}
