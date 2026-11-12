import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { prepararMaqueta } from './maqueta/camara';

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
const escenas = Array.from(maqueta?.querySelectorAll<HTMLElement>('[data-escena]') ?? []);
const enlaces = Array.from(maqueta?.querySelectorAll<HTMLAnchorElement>('[data-destino]') ?? []);
const motion = gsap.matchMedia();

motion.add({
  normal: '(prefers-reduced-motion: no-preference)',
  escritorio: '(min-width: 921px) and (pointer: fine)',
}, ({ conditions }) => {
  if (!conditions?.normal || !maqueta || !canvas || escenas.length < 2) return;

  let motor: ReturnType<typeof prepararMaqueta> = null;
  let trigger: ScrollTrigger | undefined;
  let observar: ResizeObserver | undefined;
  let lenis: Lenis | undefined;
  let pendiente = 0;
  let activo = true;
  let marcas: number[] = [];
  let parada = -1;

  const tick = (segundos: number) => lenis?.raf(segundos * 1000);
  const detenerInercia = (evento: MouseEvent) => {
    if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    const enlace = evento.target instanceof Element ? evento.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!enlace || enlace.target || enlace.hasAttribute('download')) return;
    lenis?.stop();
    lenis?.start();
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
    motor.avanzar(indice + fraccion);
    const activa = Math.max(0, marcas.findLastIndex((marca) => marca <= distancia + 24));
    if (parada === activa) return;
    parada = activa;
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
    gsap.ticker.remove(tick);
    document.removeEventListener('click', detenerInercia);
    lenis?.destroy();
    lenis = undefined;
    motor?.destruir();
    motor = null;
    maqueta?.classList.remove('maqueta-lista');
    enlaces.forEach((enlace) => enlace.removeAttribute('aria-current'));
  }

  import('./maqueta/camara').then(({ prepararMaqueta }) => {
    if (!activo) return;
    motor = prepararMaqueta(canvas, limpiar, maqueta.dataset.maqueta === "interior");
    if (!motor) return;

    maqueta.classList.add('maqueta-lista');
    if (conditions.escritorio) {
      lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      document.addEventListener('click', detenerInercia);
    }

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
