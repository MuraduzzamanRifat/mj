/* ═══════════════════════════════════════════════════════════════
   MOTION — cinematic scroll layer for the homepage
   · Lenis weighted smooth scrolling
   · word-by-word blur-in for section headings
   · hero copy drifts and softens as it scrolls away
   · film grain overlay
   Everything here is an enhancement: if this file fails to load,
   the page still reads and scrolls normally.
   ═══════════════════════════════════════════════════════════════ */
import Lenis from './vendor/lenis-1.3.23.mjs';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Smooth scroll ─────────────────────────────────────────────── */
function initSmoothScroll() {
  if (REDUCED) return null;
  // touch devices keep native scrolling: it is already smooth and far cheaper
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true, autoRaf: true });
  document.documentElement.classList.add('has-lenis');
  // freeze the page behind the mobile menu
  new MutationObserver(() => {
    if (document.body.classList.contains('nav-open')) lenis.stop(); else lenis.start();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  return lenis;
}

/* ── Word-by-word blur-in headings ─────────────────────────────── */
function splitWords(root) {
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'bw';
          s.style.setProperty('--i', i++);
          s.textContent = part;
          frag.appendChild(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(root);
}

function initBlurHeadings() {
  if (REDUCED || !('IntersectionObserver' in window)) return;
  const heads = document.querySelectorAll('.act-h, .close-h');
  if (!heads.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('bw-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });
  heads.forEach((h) => {
    splitWords(h);
    h.classList.add('bw-ready');
    io.observe(h);
  });
}

/* ── Hero copy drifts away on scroll ───────────────────────────── */
function initHeroDrift() {
  if (REDUCED) return;
  const hero = document.getElementById('hero');
  const copy = hero && hero.querySelector('.hero-content');
  if (!copy) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const p = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.9), 0), 1);
    copy.style.opacity = String(1 - p * 0.9);
    copy.style.transform = p ? 'translate3d(0,' + (-p * 48).toFixed(1) + 'px,0)' : '';
    copy.style.filter = p > 0.02 ? 'blur(' + (p * 6).toFixed(2) + 'px)' : '';
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ── Film grain ────────────────────────────────────────────────── */
function initGrain() {
  const g = document.createElement('div');
  g.className = 'grain';
  g.setAttribute('aria-hidden', 'true');
  document.body.appendChild(g);
}

function start() {
  initSmoothScroll();
  initBlurHeadings();
  initHeroDrift();
  initGrain();
}

// Wait until the entrance gate is gone: nothing here is visible underneath it.
const rootEl = document.documentElement;
if (rootEl.classList.contains('gate-on')) {
  const mo = new MutationObserver(() => {
    if (!rootEl.classList.contains('gate-on')) { mo.disconnect(); start(); }
  });
  mo.observe(rootEl, { attributes: true, attributeFilter: ['class'] });
} else {
  start();
}
