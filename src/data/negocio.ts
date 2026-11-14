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
  cookies: `${web}/politica-de-cookies`,
  mapa: 'https://maps.app.goo.gl/zbWRfVAJw55MYg7U6',
  logo: '/marca/tisnova-claro.svg',
  descripcion: 'Consultoría tecnológica, sistemas, soporte y software propio para empresas. Desde Molina de Segura, Murcia.',
};

export const servicios = [
  {
    nombre: 'Consultoría tecnológica', url: `${web}/consultoria-tecnologica`,
    descripcion: 'Revisamos cómo trabajáis, qué sistemas utilizáis y dónde se atasca el trabajo. Decidimos con vosotros qué conviene resolver primero.',
    puntos: ['Revisión de sistemas y procesos', 'Comparación de alternativas y prioridades', 'Coordinación de proveedores y alcance'],
  },
  {
    nombre: 'Sistemas y soporte', url: `${web}/soporte-informatico-empresas-murcia`,
    descripcion: 'Cuidamos vuestros equipos, servidores y redes. Podemos ser vuestro departamento de IT externo o trabajar junto al equipo que ya tenéis.',
    puntos: ['Mantenimiento y asistencia a usuarios', 'Microsoft 365, servidores y redes', 'Copias de seguridad y continuidad'],
  },
  {
    nombre: 'Desarrollo e integraciones', url: `${web}/desarrollo-software-a-medida`,
    descripcion: 'Conectamos las aplicaciones que ya utilizáis y desarrollamos las herramientas que faltan para dejar de hacer el mismo trabajo dos veces.',
    puntos: ['Aplicaciones y portales empresariales', 'Conexiones entre ERP, TMS y otras herramientas', 'Automatización de tareas y datos'],
  },
  {
    nombre: 'Telefonía y conectividad', url: `${web}/telefonia-conectividad-empresas`,
    descripcion: 'Somos colaboradores de Orange. Estudiamos la fibra, las líneas y el uso de datos de vuestra empresa para valorar opciones con vosotros.',
    puntos: ['Fibra y acceso a Internet', 'Telefonía fija, líneas móviles y datos', 'Estudio de uso, costes y condiciones'],
  },
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
    descripcion: 'Reunid agenda, flota y documentos como el DeCA, la HeRU, el eCNP o el eCMR. Compartidlos entre la oficina y el móvil durante el servicio.',
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
  {
    categoria: 'Integración', nombre: 'TisTms y Business Central', url: `${web}/proyectos#tecon`,
    descripcion: 'Hemos unido TisTms con Microsoft Dynamics 365 Business Central para que tráfico y administración compartan información. Contamos con un acuerdo de colaboración con Tecon.',
    logo: { src: '/clientes/tecon.svg', alt: 'Tecon Soluciones Informáticas', width: 1242, height: 414 },
  },
  {
    categoria: 'Colaboración con el sector', nombre: 'TisTransit y FROET', url: `${web}/proyectos#froet`,
    descripcion: 'El acuerdo con FROET acerca TisTransit a sus empresas asociadas. También participamos en jornadas y demostraciones para enseñar el programa y resolver dudas.',
    logo: { src: '/clientes/froet.png', alt: 'FROET', width: 173, height: 59 },
  },
  {
    categoria: 'Campeonato de España por Equipos', nombre: 'Chamartín', url: 'https://chamartin.tisnova.es/',
    descripcion: 'Gestionamos el marcador del campeonato. Nuestro desarrollo conecta la gestión del torneo, el acceso de los árbitros, los resultados públicos y los marcadores en pantallas.',
  },
  {
    categoria: 'Gestión deportiva', nombre: 'Murcia Club de Tenis', url: `${web}/software-gestion-deportiva`,
    descripcion: 'TisGame es nuestra solución para el club. En agosto también gestionamos el marcador de su campeonato de alevines.',
  },
];

export const clientes = [
  { nombre: 'Vakkaru Inversiones', logo: 'vakkaru.svg', width: 1556, height: 246 },
  { nombre: 'Hercasin', logo: 'hercasin.png', width: 300, height: 60 },
  { nombre: 'Blinda', logo: 'blinda.svg', width: 191, height: 69 },
  { nombre: 'EFIX', logo: 'efix.svg', width: 610, height: 172 },
  { nombre: 'Vetter Hospital Veterinario de Murcia', logo: 'vetter.svg', width: 1226, height: 198 },
  { nombre: 'Solana Logística', logo: 'solana.jpg', width: 1024, height: 373 },
  { nombre: 'Federación de Colombicultura de la Región de Murcia', logo: 'federacion.png', width: 204, height: 192 },
  { nombre: 'Transgesa', logo: 'transgesa.png', width: 341, height: 94 },
  { nombre: 'Miabsa', logo: 'miabsa.png', width: 1453, height: 554 },
  { nombre: 'SAU Agroingenieros', logo: 'sau.png', width: 204, height: 192 },
];

export const equipo = [
  {
    nombre: 'Mariano Fuster Martínez', cargo: 'Dirección y consultoría tecnológica', foto: '/equipo/mariano-20261109.webp', width: 1200, height: 1200,
    bio: 'Más de 18 años en IT y una larga etapa en El Mosca. Aporta esa experiencia para entender cada empresa y ordenar sus prioridades tecnológicas.',
    linkedin: 'https://www.linkedin.com/in/mariano-fuster-mart%C3%ADnez-40b25930/',
  },
  {
    nombre: 'José Víctor Pujante', cargo: 'Director de desarrollo', foto: '/equipo/jose-victor.webp', width: 400, height: 400,
    bio: 'Dirige el desarrollo y la evolución de nuestros productos. Coordina el trabajo a partir de las necesidades de cada empresa.',
    linkedin: 'https://www.linkedin.com/in/jose-victor-pujante-7aaabb66/',
  },
  {
    nombre: 'Ignacio Cano Serrano', cargo: 'Responsable de arquitectura y desarrollo', foto: '/equipo/ignacio.webp', width: 400, height: 400,
    bio: 'Fue jefe de desarrollo en El Mosca. Conoce las aplicaciones de negocio y la operativa del transporte, y cuida cómo se construyen nuestras soluciones.',
    linkedin: 'https://www.linkedin.com/in/ignacio-cano-serrano-25624683/',
  },
  {
    nombre: 'Silverio Mira Ponce', cargo: 'Responsable del área de sistemas', foto: '/equipo/silverio-20261113.webp', width: 800, height: 1067,
    bio: 'Más de 12 años en infraestructuras críticas. Está al frente de sistemas, con la continuidad del trabajo y la respuesta a las incidencias como prioridades.',
    linkedin: 'https://www.linkedin.com/in/silverio-mira-ponce-153771219/',
  },
];

export const formaDeTrabajar = [
  { titulo: 'Escuchamos a quienes lo usan', texto: 'Antes de proponer herramientas, queremos ver cómo trabajáis y qué os está dando problemas.' },
  { titulo: 'Explicamos las opciones', texto: 'Os contamos qué hemos encontrado, qué alternativas hay y por qué recomendamos una.' },
  { titulo: 'Seguimos pendientes', texto: 'El proyecto tiene que arrancar bien y seguir siendo útil cuando ya forma parte de vuestro trabajo.' },
];

export const navegacion = [
  { nombre: 'Aplicaciones', href: '#aplicaciones' },
  { nombre: 'Productos', href: '#productos' },
  { nombre: 'Clientes', href: '#clientes' },
  { nombre: 'Proyectos', href: '#proyectos' },
  { nombre: 'Servicios', href: '#servicios' },
  { nombre: 'Equipo', href: '#equipo' },
];
