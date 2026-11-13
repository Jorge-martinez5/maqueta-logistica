import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { prepararMaqueta } from './maqueta/camara';
import type { TipoVisita } from '../data/recorridos';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const menu = document.querySelector<HTMLDetailsElement>('.mobile-nav');
menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => { menu.open = false; });
});
menu?.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Escape') return;
  menu.open = false;
  menu.querySelector('summary')?.focus();
});

const cabecera = document.querySelector<HTMLElement>('.site-header');
if (cabecera) {
  const medirCabecera = () => {
    document.documentElement.style.setProperty('--sticky-top', `${cabecera.getBoundingClientRect().height}px`);
  };
  medirCabecera();
  new ResizeObserver(medirCabecera).observe(cabecera);
}

const maqueta = document.querySelector<HTMLElement>('[data-maqueta]');
const canvas = maqueta?.querySelector<HTMLCanvasElement>('[data-canvas]');
const todasLasEscenas = Array.from(maqueta?.querySelectorAll<HTMLElement>('[data-escena]') ?? []);
const visitas = Array.from(maqueta?.querySelectorAll<HTMLElement>('[data-visita]') ?? []);
const enlaces = Array.from(maqueta?.querySelectorAll<HTMLAnchorElement>('[data-destino]') ?? []);
const hudPrincipal = maqueta?.querySelector<HTMLElement>('[data-hud-principal]');
const hudVisitas = Array.from(maqueta?.querySelectorAll<HTMLElement>('[data-hud-visita]') ?? []);
let escenas = todasLasEscenas.filter((escena) => !escena.closest('[hidden]'));
let visitaActiva: TipoVisita | undefined;

function tipoVisita(valor?: string): TipoVisita | undefined {
  return valor === 'interior' || valor === 'transit' || valor === 'tms' || valor === 'game' || valor === 'rural' || valor === 'time' ? valor : undefined;
}

function visitaDe(escena: HTMLElement | null) {
  return tipoVisita(escena?.closest<HTMLElement>('[data-visita]')?.dataset.visita);
}

function mostrarVisita(tipo?: TipoVisita) {
  visitaActiva = tipo;
  visitas.forEach((visita) => { visita.hidden = visita.dataset.visita !== tipo; });
  escenas = todasLasEscenas.filter((escena) => !escena.closest('[hidden]'));
}

function mostrarHud(tipo?: TipoVisita) {
  if (hudPrincipal) hudPrincipal.hidden = Boolean(tipo);
  hudVisitas.forEach((hud) => { hud.hidden = hud.dataset.hudVisita !== tipo; });
}

function inicioDeVisita(tipo: TipoVisita) {
  return visitas.find((visita) => visita.dataset.visita === tipo)?.querySelector<HTMLElement>('[data-escena]');
}

function enlaceSimple(evento: MouseEvent) {
  if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return null;
  const enlace = evento.target instanceof Element ? evento.target.closest<HTMLAnchorElement>('a[href]') : null;
  return !enlace?.target && !enlace?.hasAttribute('download') ? enlace : null;
}

function abrirHashEstatico() {
  if (maqueta?.classList.contains('maqueta-lista')) return;
  const destino = document.getElementById(location.hash.slice(1));
  const tipo = visitaDe(destino);
  if (tipo && tipo !== visitaActiva) {
    mostrarVisita(tipo);
    requestAnimationFrame(() => {
      if (location.hash === `#${destino?.id}`) destino?.scrollIntoView({ behavior: 'instant' });
    });
  } else if (!tipo && visitaActiva && location.hash === '#aplicaciones') {
    mostrarVisita();
  }
  mostrarHud(tipo);
}

if (visitas.length) {
  abrirHashEstatico();
  window.addEventListener('hashchange', abrirHashEstatico);
  document.addEventListener('click', (evento) => {
    if (maqueta?.classList.contains('maqueta-lista')) return;
    const tipo = tipoVisita(enlaceSimple(evento)?.dataset.visitaDestino);
    if (!tipo) return;
    const destino = inicioDeVisita(tipo);
    if (!destino) return;
    evento.preventDefault();
    mostrarVisita(tipo);
    mostrarHud(tipo);
    location.hash = destino.id;
    destino.scrollIntoView({ behavior: 'instant' });
    destino.focus({ preventScroll: true });
  });
}

const motion = gsap.matchMedia();

motion.add({
  normal: '(prefers-reduced-motion: no-preference)',
  escritorio: '(min-width: 921px) and (pointer: fine)',
}, ({ conditions }) => {
  if (!conditions?.normal || !maqueta || !canvas || escenas.length < 2) return;
  const tipo = maqueta.dataset.maqueta;

  let motor: ReturnType<typeof prepararMaqueta> = null;
  let trigger: ScrollTrigger | undefined;
  let observar: ResizeObserver | undefined;
  let lenis: Lenis | undefined;
  let pendiente = 0;
  let restauracion = 0;
  let origenAncla: { hash: string; posicion: number } | undefined;
  let activo = true;
  let marcas: number[] = [];
  let parada = -1;

  const tick = (segundos: number) => lenis?.raf(segundos * 1000);
  const detenerInercia = () => {
    lenis?.stop();
    lenis?.start();
  };
  function actualizarVisita(tipo?: TipoVisita) {
    mostrarVisita(tipo);
    parada = -1;
    trigger?.refresh();
  }

  const terminarNavegacion = () => {
    const entradaPendiente = history.state?.maquetaDestino === location.hash;
    const vueltaAlMapa = visitaActiva && location.hash === '#aplicaciones';
    if (entradaPendiente || vueltaAlMapa) {
      const destino = document.getElementById(location.hash.slice(1));
      const margen = destino ? Number.parseFloat(getComputedStyle(destino).scrollMarginTop) : 0;
      if (destino && Math.abs(destino.getBoundingClientRect().top - margen) > 2) return;
      if (entradaPendiente) {
        const { maquetaDestino, ...estado } = history.state;
        history.replaceState(estado, '');
      }
      if (vueltaAlMapa) actualizarVisita();
    }
    origenAncla = undefined;
  };
  const volver = (evento: PopStateEvent) => {
    detenerInercia();
    cancelAnimationFrame(restauracion);
    const origen = origenAncla;
    origenAncla = undefined;
    const destinoHash = document.getElementById(location.hash.slice(1));
    const visitaDelHistorial = visitaDe(destinoHash);
    const cambiaVisita = visitaDelHistorial && visitaDelHistorial !== visitaActiva;
    if (cambiaVisita) actualizarVisita(visitaDelHistorial);
    const vuelveAlMapa = visitaActiva && location.hash === '#aplicaciones';
    const destino = evento.state?.maquetaDestino === location.hash || cambiaVisita || vuelveAlMapa ? destinoHash : null;
    if (!destino && origen?.hash !== location.hash) return;

    window.scrollTo({ top: window.scrollY, behavior: 'instant' });
    restauracion = requestAnimationFrame(() => {
      if (destino) {
        destino.scrollIntoView({ behavior: 'instant' });
        destino.focus({ preventScroll: true });
        terminarNavegacion();
      } else if (origen) {
        window.scrollTo({ top: origen.posicion, behavior: 'instant' });
      }
    });
  };
  const navegarAncla = (evento: MouseEvent) => {
    const enlace = enlaceSimple(evento);
    if (!enlace) return;

    const nuevaVisita = tipoVisita(enlace.dataset.visitaDestino);
    if (!nuevaVisita && !enlace.getAttribute('href')?.startsWith('#')) return;
    const inicioVisita = nuevaVisita ? inicioDeVisita(nuevaVisita) : null;
    const hash = inicioVisita ? `#${inicioVisita.id}` : enlace.hash;
    const destino = document.getElementById(hash.slice(1));
    const esParadaTransit = tipo === 'transit' && escenas.some(({ id }) => id && hash === `#${id}`);
    if (destino && (hash === '#terminal' || hash === '#tistms' || hash === '#aplicaciones' || esParadaTransit || visitaDe(destino))) {
      evento.preventDefault();
      if (nuevaVisita && nuevaVisita !== visitaActiva) {
        actualizarVisita(nuevaVisita);
      }
      if (location.hash !== hash) {
        origenAncla = { hash: location.hash, posicion: window.scrollY };
        history.pushState({ ...history.state, maquetaDestino: hash }, '', hash);
      }
      if (hash === '#aplicaciones' && evento.detail === 0) {
        if (lenis) lenis.scrollTo(destino, { immediate: true });
        else destino.scrollIntoView({ behavior: 'instant' });
        ScrollTrigger.update();
        cancelAnimationFrame(restauracion);
        restauracion = requestAnimationFrame(() => {
          destino.focus({ preventScroll: true });
          terminarNavegacion();
        });
        return;
      }
      destino.focus({ preventScroll: true });
      if (lenis) lenis.scrollTo(destino, {
        duration: 1.45,
        easing: gsap.parseEase('power2.inOut'),
        onComplete: terminarNavegacion,
      });
      else destino.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    origenAncla = undefined;
    detenerInercia();
  };

  function medir() {
    const borde = maqueta!.getBoundingClientRect().top;
    marcas = escenas.map((escena) => escena.getBoundingClientRect().top - borde);
  }

  function actualizar(instancia: ScrollTrigger) {
    if (!motor || marcas.length !== escenas.length) return;
    const distancia = instancia.progress * (instancia.end - instancia.start);
    const indice = Math.max(0, marcas.findLastIndex((marca) => marca <= distancia));
    const siguiente = marcas[indice + 1];
    const fraccion = siguiente === undefined ? 0 : gsap.utils.clamp(0, 1, (distancia - marcas[indice]) / Math.max(1, siguiente - marcas[indice]));
    motor.avanzar(indice + fraccion, visitaActiva);
    const activa = Math.max(0, marcas.findLastIndex((marca) => marca <= distancia + 24));
    if (parada === activa) return;
    parada = activa;
    mostrarHud(visitaDe(escenas[activa]));
    enlaces.forEach((enlace) => {
      if (enlace.dataset.destino === escenas[activa].dataset.escena) enlace.setAttribute('aria-current', 'step');
      else enlace.removeAttribute('aria-current');
    });
  }

  function limpiar() {
    trigger?.kill();
    trigger = undefined;
    observar?.disconnect();
    cancelAnimationFrame(pendiente);
    cancelAnimationFrame(restauracion);
    gsap.ticker.remove(tick);
    document.removeEventListener('click', navegarAncla);
    document.removeEventListener('scrollend', terminarNavegacion);
    window.removeEventListener('popstate', volver);
    lenis?.destroy();
    lenis = undefined;
    motor?.destruir();
    motor = null;
    maqueta?.classList.remove('maqueta-lista');
    abrirHashEstatico();
    enlaces.forEach((enlace) => enlace.removeAttribute('aria-current'));
  }

  import('./maqueta/camara').then(({ prepararMaqueta }) => {
    if (!activo) return;
    motor = prepararMaqueta(canvas, limpiar, tipo === 'interior' || tipo === 'transit' ? tipo : 'terminal');
    if (!motor) return;

    maqueta.classList.add('maqueta-lista');
    if (conditions.escritorio) {
      lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
    } else {
      document.addEventListener('scrollend', terminarNavegacion);
    }
    document.addEventListener('click', navegarAncla);
    window.addEventListener('popstate', volver);

    trigger = ScrollTrigger.create({
      trigger: maqueta,
      start: () => `top ${cabecera?.getBoundingClientRect().height ?? 77}px`,
      end: () => `+=${Math.max(1, escenas[escenas.length - 1].getBoundingClientRect().top - maqueta.getBoundingClientRect().top)}`,
      onRefresh: (instancia) => {
        medir();
        actualizar(instancia);
      },
      onUpdate: actualizar,
    });

    observar = new ResizeObserver(() => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => trigger?.refresh());
    });
    observar.observe(maqueta);
    document.fonts.ready.then(() => { if (activo) trigger?.refresh(); });
  }).catch((error: unknown) => {
    limpiar();
    console.warn('Tisnova muestra las vistas estáticas de la maqueta.', error);
  });

  return () => {
    activo = false;
    limpiar();
  };
});

if (matchMedia('(prefers-reduced-motion: no-preference)').matches && window.scrollY < 20 && !location.hash) {
  gsap.from('[data-enter]', { y: 12, opacity: 0, duration: 0.65, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' });
}
