/* ═══════════════════════════════════════════════════════════════
   HERO CHARACTER — 2.5D depth-parallax portrait
   A still render + its depth map, drawn in WebGL so the figure
   turns slightly as the page scrolls and the pointer moves.
   Tunables: TURN_SCROLL, TURN_MOUSE, FOCUS_X.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

const TURN_SCROLL = 0.030;   // how far the figure turns across the hero scroll
const TURN_MOUSE  = 0.014;   // extra turn from pointer position
const FOCUS_X     = 0.68;    // horizontal centre of the figure in the image (0–1)
const IMG_ASPECT  = 16 / 9;

const VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  uniform sampler2D uImg;
  uniform sampler2D uDepth;
  uniform vec2 uOff;     // parallax offset in uv units
  uniform vec2 uScale;   // cover-fit scale
  uniform vec2 uShift;   // cover-fit shift
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * uScale + uShift;
    // two-step lookup: sample depth, shift, re-sample for a cleaner edge
    float d  = texture2D(uDepth, uv).r;
    float d2 = texture2D(uDepth, uv + uOff * (d - 0.35)).r;
    vec2 p   = uv + uOff * (d2 - 0.35);
    gl_FragColor = vec4(texture2D(uImg, clamp(p, 0.002, 0.998)).rgb, 1.0);
  }
`;

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, (t) => {
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      resolve(t);
    }, undefined, reject);
  });
}

async function initCharacter() {
  const wrap   = document.getElementById('heroChar');
  const canvas = document.getElementById('heroCharCanvas');
  const hero   = document.getElementById('hero');
  if (!wrap || !canvas || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch (err) {
    wrap.classList.add('ready');   // CSS background still shows the still image
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const [img, depth] = await Promise.all([
    loadTexture('media/character.webp'),
    loadTexture('media/character-depth.jpg'),
  ]);

  const uniforms = {
    uImg:   { value: img },
    uDepth: { value: depth },
    uOff:   { value: new THREE.Vector2(0, 0) },
    uScale: { value: new THREE.Vector2(1, 1) },
    uShift: { value: new THREE.Vector2(0, 0) },
  };
  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, depthTest: false })
  ));

  const ZOOM = 0.94;   // slight zoom-in so shifted edges never show
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const ca = w / h;
    let sx = 1, sy = 1;
    if (ca > IMG_ASPECT) sy = IMG_ASPECT / ca; else sx = ca / IMG_ASPECT;
    sx *= ZOOM; sy *= ZOOM;
    const shiftX = Math.min(Math.max(FOCUS_X - sx / 2, 0), 1 - sx);
    const shiftY = (1 - sy) * 0.72;   // keep the head in frame when cropping vertically
    uniforms.uScale.value.set(sx, sy);
    uniforms.uShift.value.set(shiftX, shiftY);
    dirty = true;
  }

  // target vs. current offset — lerped for a weighted, cinematic feel
  const target = { x: 0, y: 0 };
  const mouse  = { x: 0, y: 0 };
  let scrollP = 0, visible = true, dirty = true, raf = 0;

  function readScroll() {
    const r = hero.getBoundingClientRect();
    scrollP = Math.min(Math.max(-r.top / Math.max(r.height, 1), 0), 1);
    // drift down at a third of scroll speed so the figure lingers in view
    wrap.style.transform = 'translate3d(0,' + Math.round(Math.max(-r.top, 0) * 0.3) + 'px,0)';
  }
  function retarget() {
    target.x = -((scrollP * 2 - 1) * TURN_SCROLL + mouse.x * TURN_MOUSE);
    target.y = (scrollP * 0.4) * TURN_SCROLL + mouse.y * TURN_MOUSE * 0.6;
    kick();
  }
  function frame() {
    raf = 0;
    const o = uniforms.uOff.value;
    const dx = target.x - o.x, dy = target.y - o.y;
    o.x += dx * 0.07; o.y += dy * 0.07;
    renderer.render(scene, camera);
    dirty = false;
    if (visible && (Math.abs(dx) > 0.00005 || Math.abs(dy) > 0.00005)) kick();
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  resize();
  readScroll();
  if (!reduceMotion) retarget();
  uniforms.uOff.value.set(target.x, target.y);
  renderer.render(scene, camera);
  wrap.classList.add('ready');

  window.addEventListener('resize', () => { resize(); kick(); }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);

  if (reduceMotion) return;   // static portrait only

  window.addEventListener('scroll', () => { readScroll(); retarget(); }, { passive: true });
  if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      retarget();
    }, { passive: true });
  }
}

initCharacter().catch((err) => {
  console.warn('Hero character failed', err);
  document.getElementById('heroChar')?.classList.add('ready');
});
