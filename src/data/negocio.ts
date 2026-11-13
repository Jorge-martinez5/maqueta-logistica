const web = 'https://tisnova.es';

export const negocio = {
  nombre: 'Tisnova Soluciones S.L.',
  web,
  ubicacion: 'Molina de Segura, Murcia',
  email: 'info@tisnova.es',
  telefono: '+34 696 027 517',
  telefonoHref: 'tel:+34696027517',
  contacto: `${web}/contacto`,
  privacidad: `${web}/politica-de-privacidad`,
  legal: `${web}/aviso-legal`,
  mapa: 'https://maps.app.goo.gl/zbWRfVAJw55MYg7U6',
  logo: '/marca/tisnova-claro.svg',
  descripcion: 'Consultoría tecnológica, sistemas, soporte y software propio para empresas. Desde Molina de Segura, Murcia.',
};

export const servicios = [
  { nombre: 'Consultoría tecnológica', descripcion: 'Revisamos vuestros procesos y sistemas para decidir qué conviene resolver primero.', url: `${web}/consultoria-tecnologica` },
  { nombre: 'Sistemas y soporte', descripcion: 'Cuidamos vuestros equipos, servidores y redes, y ayudamos a las personas que los utilizan.', url: `${web}/soporte-informatico-empresas-murcia` },
  { nombre: 'Desarrollo e integraciones', descripcion: 'Conectamos las aplicaciones que ya utilizáis y desarrollamos las herramientas que faltan.', url: `${web}/desarrollo-software-a-medida` },
  { nombre: 'Telefonía y conectividad', descripcion: 'Organizamos la telefonía y las conexiones de vuestra empresa según cómo trabajáis.', url: `${web}/telefonia-conectividad-empresas` },
];

export const miniaturas = {
  camion: { width: 472, height: 370 },
  almacen: { width: 282, height: 452 },
  documento: { width: 417, height: 396 },
  reloj: { width: 447, height: 348 },
  alojamiento: { width: 508, height: 386 },
  tenis: { width: 521, height: 381 },
};

const catalogo = [
  {
    id: 'tistms', ruta: 'tistms', nombre: 'TisTms', sector: 'Transporte',
    titulo: 'Del pedido al viaje.',
    descripcion: 'Planificad cargas, asignad vehículos y reunid la documentación de cada viaje. La integración con Business Central conecta el trabajo de tráfico con el de administración.',
    miniatura: 'camion',
  },
  {
    id: 'tissga', ruta: 'sga', nombre: 'TisSGA', sector: 'Almacén',
    titulo: 'Seguid cada palé.',
    descripcion: 'Registrad entradas, ubicaciones y salidas de mercancía. Seguid los movimientos de cada palé y preparad la prefacturación de los servicios de almacén.',
    miniatura: 'almacen',
  },
  {
    id: 'tistransit', ruta: 'tistransit', nombre: 'TisTransit', sector: 'Documentación de transporte',
    titulo: 'Los documentos viajan con la carga.',
    descripcion: 'Reunid agenda, flota y documentos como el DeCA o la hoja de ruta electrónica. Compartidlos entre la oficina y el móvil durante el servicio.',
    miniatura: 'documento',
  },
  {
    id: 'tistime', ruta: 'tistime', nombre: 'TisTime', sector: 'Gestión de equipos',
    titulo: 'La jornada, registrada.',
    descripcion: 'Gestionad fichajes, vacaciones, gastos y kilometraje. El portal del empleado permite consultar contratos y nóminas según los permisos de cada persona.',
    miniatura: 'reloj',
  },
  {
    id: 'tisrural', ruta: 'tisrural', nombre: 'TisRural', sector: 'Reservas',
    titulo: 'De la reserva a la estancia.',
    descripcion: 'Organizad disponibilidad, tarifas, limpieza y extras de vuestros alojamientos. La aplicación nació para casas rurales y se adapta a otros espacios reservables.',
    miniatura: 'alojamiento',
  },
  {
    id: 'tisgame', ruta: 'software-gestion-deportiva', nombre: 'TisGame', sector: 'Clubes y competiciones',
    titulo: 'De la pista al marcador.',
    descripcion: 'Organizad clubes, ligas y competiciones y publicad los resultados. El desarrollo deportivo de Tisnova está presente en Chamartín y, con TisGame, en Murcia Club de Tenis.',
    miniatura: 'tenis',
    caso: { nombre: 'Ver el campeonato de Chamartín', url: 'https://chamartin.tisnova.es/' },
  },
] as const;

export const productos = catalogo.map(({ ruta, ...producto }) => ({ ...producto, url: `${web}/${ruta}` }));

export const proyectos = [
  { categoria: 'Integración', nombre: 'TisTms y Business Central', descripcion: 'Conectamos el trabajo del equipo de tráfico con la gestión de la empresa. La integración está desarrollada y cuenta con un acuerdo de colaboración con Tecon.', url: `${web}/proyectos#tecon` },
  { categoria: 'Colaboración', nombre: 'TisTransit y FROET', descripcion: 'El acuerdo con FROET facilita a sus empresas asociadas el acceso a TisTransit para gestionar sus documentos de transporte.', url: `${web}/proyectos#froet` },
];

export const equipo = [
  { nombre: 'Mariano', foto: '/equipo/mariano-20261109.webp', width: 1200, height: 1200 },
  { nombre: 'José Víctor', foto: '/equipo/jose-victor.webp', width: 400, height: 400 },
  { nombre: 'Ignacio', foto: '/equipo/ignacio.webp', width: 400, height: 400 },
  { nombre: 'Silverio', foto: '/equipo/silverio-20261110.webp', width: 1086, height: 1448 },
];

export const navegacion = [
  { nombre: 'Aplicaciones', href: '#aplicaciones' },
  { nombre: 'Servicios', href: '#servicios' },
  { nombre: 'Productos', href: '#productos' },
  { nombre: 'Proyectos', href: '#proyectos' },
  { nombre: 'Equipo', href: '#equipo' },
];
