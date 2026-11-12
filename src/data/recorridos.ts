import { productos } from './negocio';

export const recorridos = {
  interior: {
    producto: productos.find(({ id }) => id === 'tissga')!,
    tipo: 'interior',
    inicio: 'nave-tissga',
    sector: 'Gestión de almacén',
    titulo: 'TisSGA | Dentro del almacén de Tisnova',
    descripcion: 'Recorrido 3D por la recepción, la ubicación y la expedición de mercancía con TisSGA.',
    etiqueta: 'Recorrido por el interior del almacén con TisSGA',
    encabezado: ['Dentro del', 'almacén.'],
    introduccion: 'Seguid la mercancía desde que entra por el muelle hasta que queda lista para salir.',
    accion: 'Entrar en la nave',
    imagenes: 'sga',
    paradas: [
      { id: 'recepcion', nombre: 'Recepción', titulo: 'Registrad la entrada.', texto: 'En el muelle se identifica la mercancía que acaba de llegar. Con su referencia registrada, podéis consultar qué ha entrado y preparar su traslado a una ubicación.' },
      { id: 'ubicacion', nombre: 'Ubicación', titulo: 'Un sitio para cada palé.', texto: 'La carretilla lleva el palé hasta su hueco. TisSGA registra el movimiento y la ubicación para que el equipo pueda localizarlo cuando lo necesite.' },
      { id: 'salida', nombre: 'Salida', titulo: 'Preparad la expedición.', texto: 'Otro palé sale de la zona de almacenamiento hacia el muelle. El registro de movimientos permite seguir la mercancía y preparar la prefacturación de los servicios de almacén.' },
    ],
  },
  transit: {
    producto: productos.find(({ id }) => id === 'tistransit')!,
    tipo: 'transit',
    inicio: 'cabina-tistransit',
    sector: 'Documentación de transporte',
    titulo: 'TisTransit | El documento de transporte, desde la cabina',
    descripcion: 'Recorrido 3D de un control en ruta. El camionero muestra en su móvil el documento de transporte con TisTransit.',
    etiqueta: 'Recorrido por un control en ruta con TisTransit',
    encabezado: ['Desde la', 'cabina.'],
    introduccion: 'Acompañad a un camionero durante un control y ved cómo muestra el documento del viaje desde la cabina.',
    accion: 'Ver el control',
    imagenes: 'transit',
    paradas: [
      { id: 'solicitud', nombre: 'Solicitud', titulo: 'Un control en ruta.', texto: 'El camionero se detiene. La persona encargada del control se acerca a la ventanilla y le pide el documento del transporte.' },
      { id: 'documento', nombre: 'Documento', titulo: 'El DeCA, en el móvil.', texto: 'Desde la cabina, el camionero abre en TisTransit el DeCA de ese viaje y gira el móvil para mostrarlo.' },
      { id: 'comprobacion', nombre: 'Comprobación', titulo: 'A la vista, desde la ventanilla.', texto: 'La persona encargada del control consulta el documento en la pantalla mientras el camionero sigue en la cabina.' },
    ],
  },
} as const;

export type TipoVisita = keyof typeof recorridos;
export type Recorrido = (typeof recorridos)[TipoVisita];
