/* ══════════════════════════════════════════════════════════════
   QUIET APPARATUS — app.js
   · Hero: WebGL particle instrument morphing through 6 specimens
   · Close: WebGL ambient drift field
   · Specimen cards: 2D canvas archival dot illustrations
   · Custom cursor, preloader, scroll reveals, smooth scroll
   ══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const COLORS = {
  paper:   new THREE.Color('#EEE7D8'),
  copper:  new THREE.Color('#BD5A33'),
};

const IS_MOBILE = window.matchMedia('(max-width: 720px)').matches;
const PARTICLE_COUNT = IS_MOBILE ? 6000 : 18000;
const IS_TOUCH = window.matchMedia('(hover: none)').matches;

/* ═══════════════════════════════════════════════════════════════
   SHAPE GENERATORS
   Each returns a Float32Array of length N*3 with x,y,z for N particles.
   World units are ~[-1.5, 1.5].
   ═══════════════════════════════════════════════════════════════ */

function rand(a, b) { return a + Math.random() * (b - a); }

function allocate(N, slots) {
  // slots: [{ weight, gen(i, count) -> [x,y,z?] }]
  const total = slots.reduce((s, x) => s + x.weight, 0);
  const positions = new Float32Array(N * 3);
  let idx = 0;
  for (const slot of slots) {
    const count = Math.floor(N * slot.weight / total);
    for (let i = 0; i < count && idx < N; i++) {
      const p = slot.gen(i, count);
      positions[idx * 3]     = p[0];
      positions[idx * 3 + 1] = p[1];
      positions[idx * 3 + 2] = p[2] ?? rand(-0.02, 0.02);
      idx++;
    }
  }
  // fill remainder with last slot
  const last = slots[slots.length - 1];
  while (idx < N) {
    const p = last.gen(idx, last.weight);
    positions[idx * 3]     = p[0];
    positions[idx * 3 + 1] = p[1];
    positions[idx * 3 + 2] = p[2] ?? rand(-0.02, 0.02);
    idx++;
  }
  return positions;
}

// I.i — Continuous Harvest: 5 source nodes, feed lines, central collector, reference ring
function shapeHarvest(N) {
  const R = 1.05;
  const nodes = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
    nodes.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  return allocate(N, [
    { weight: 0.08, gen: () => {                       // outer reference ring
      const a = Math.random() * Math.PI * 2;
      const r = R + rand(-0.005, 0.005);
      return [Math.cos(a) * r, Math.sin(a) * r];
    }},
    { weight: 0.16, gen: () => {                       // central collector (dense disc)
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * 0.14;
      return [Math.cos(a) * r, Math.sin(a) * r];
    }},
    { weight: 0.26, gen: () => {                       // 5 source nodes (clusters)
      const n = nodes[Math.floor(Math.random() * 5)];
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5) * 0.09;
      return [n[0] + Math.cos(a) * r, n[1] + Math.sin(a) * r];
    }},
    { weight: 0.50, gen: () => {                       // feed lines (dotted)
      const n = nodes[Math.floor(Math.random() * 5)];
      const t = 0.12 + Math.random() * 0.76;
      // dashed effect: only keep certain t bands
      const band = (Math.floor(t * 14) % 2 === 0) ? t : t + 0.025;
      const j1 = rand(-0.008, 0.008);
      const j2 = rand(-0.008, 0.008);
      return [n[0] * (1 - band) + j1, n[1] * (1 - band) + j2];
    }},
  ]);
}

// I.ii — Weighted Discriminator: 14 bars, last 5 copper, threshold line
function shapeDiscriminator(N) {
  const baseY = -0.85;
  const maxH = 1.7;
  const heights = [0.18, 0.22, 0.30, 0.34, 0.42, 0.48, 0.55, 0.62, 0.66, 0.72, 0.78, 0.82, 0.88, 0.95];
  const barW = 0.09;
  const gap = 0.16 - barW;
  const leftX = -((14 * barW + 13 * gap) / 2);
  return allocate(N, [
    // bars as filled rectangles
    { weight: 0.84, gen: () => {
      const i = Math.floor(Math.random() * 14);
      const x0 = leftX + i * (barW + gap);
      const h = heights[i] * maxH;
      const x = x0 + Math.random() * barW;
      const y = baseY + Math.pow(Math.random(), 1.1) * h;
      return [x, y];
    }},
    // threshold line (dashed horizontal)
    { weight: 0.10, gen: () => {
      const x = rand(-1.1, 1.1);
      const y = baseY + heights[9] * maxH + 0.015;
      const dash = (Math.floor(x * 12) % 2 === 0) ? y : y + rand(-0.003, 0.003);
      return [x, dash];
    }},
    // axes
    { weight: 0.06, gen: () => {
      const axis = Math.random() < 0.6;
      if (axis) {
        return [rand(-1.15, 1.15), baseY + rand(-0.003, 0.003)]; // x-axis
      } else {
        return [-1.15 + rand(-0.003, 0.003), rand(baseY, baseY + maxH + 0.05)]; // y-axis
      }
    }},
  ]);
}

// II.i — Cadence Engine: 6-lobed wheel with orbit, hub, spokes, notches
function shapeCadence(N) {
  const outer = 0.98;
  const inner = 0.38;
  const notchR = 0.11;
  const notches = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 6);
    notches.push([Math.cos(a) * outer, Math.sin(a) * outer, a]);
  }
  return allocate(N, [
    // outer dashed orbit
    { weight: 0.22, gen: () => {
      const a = Math.random() * Math.PI * 2;
      const band = Math.floor((a / (Math.PI * 2)) * 60);
      if (band % 2 === 1) return [Math.cos(a) * outer + rand(-0.003, 0.003), Math.sin(a) * outer + rand(-0.003, 0.003)];
      // gap → jitter onto nearby
      const a2 = a + 0.05;
      return [Math.cos(a2) * outer, Math.sin(a2) * outer];
    }},
    // inner hub ring (fills the disc lightly)
    { weight: 0.14, gen: () => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * inner;
      return [Math.cos(a) * r, Math.sin(a) * r];
    }},
    // 6 radial spokes
    { weight: 0.22, gen: () => {
      const n = notches[Math.floor(Math.random() * 6)];
      const t = inner + 0.02 + Math.random() * (outer - notchR - inner - 0.04);
      return [Math.cos(n[2]) * t + rand(-0.004, 0.004), Math.sin(n[2]) * t + rand(-0.004, 0.004)];
    }},
    // 6 copper notch circles
    { weight: 0.36, gen: () => {
      const n = notches[Math.floor(Math.random() * 6)];
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.4) * notchR;
      return [n[0] + Math.cos(a) * r, n[1] + Math.sin(a) * r];
    }},
    // pointer (line from center to one notch)
    { weight: 0.06, gen: () => {
      const t = Math.random() * inner;
      const a = -Math.PI / 2 + (Math.PI * 2 / 6) * 1;
      return [Math.cos(a) * t + rand(-0.004, 0.004), Math.sin(a) * t + rand(-0.004, 0.004)];
    }},
  ]);
}

// II.ii — Sensor Confluence: three overlapping circles, copper intersection
function shapeConfluence(N) {
  const r = 0.62;
  const off = 0.34;
  const centers = [
    [0,        off * 0.7],
    [-off,     -off * 0.45],
    [ off,     -off * 0.45],
  ];
  return allocate(N, [
    // three circle outlines
    { weight: 0.72, gen: () => {
      const c = centers[Math.floor(Math.random() * 3)];
      const a = Math.random() * Math.PI * 2;
      return [c[0] + Math.cos(a) * r + rand(-0.005, 0.005),
              c[1] + Math.sin(a) * r + rand(-0.005, 0.005)];
    }},
    // copper intersection (center-ish disc)
    { weight: 0.28, gen: () => {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.pow(Math.random(), 0.5) * 0.14;
      return [Math.cos(a) * rr, Math.sin(a) * rr - 0.04];
    }},
  ]);
}

// III.i — Metered Dispatch: 50-dot grid (5x10), first 22 filled, threshold bar below
function shapeDispatch(N) {
  const cols = 10, rows = 5, total = 50, filled = 22;
  const spacingX = 0.20;
  const spacingY = 0.20;
  const startX = -((cols - 1) * spacingX) / 2;
  const startY = 0.95 - 0.22;
  const barY = startY - rows * spacingY - 0.15;

  return allocate(N, [
    // filled dots (dense)
    { weight: 0.48, gen: () => {
      const i = Math.floor(Math.random() * filled);
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cx = startX + c * spacingX;
      const cy = startY - r * spacingY;
      const a = Math.random() * Math.PI * 2;
      const rr = Math.pow(Math.random(), 0.4) * 0.07;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    }},
    // hollow dots (just outlines)
    { weight: 0.32, gen: () => {
      const i = filled + Math.floor(Math.random() * (total - filled));
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cx = startX + c * spacingX;
      const cy = startY - r * spacingY;
      const a = Math.random() * Math.PI * 2;
      const rr = 0.055 + rand(-0.003, 0.003);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    }},
    // meter bar
    { weight: 0.15, gen: () => {
      const x = rand(startX - 0.05, startX + (cols - 1) * spacingX + 0.05);
      return [x + rand(-0.003, 0.003), barY + rand(-0.004, 0.004)];
    }},
    // threshold tick (copper)
    { weight: 0.05, gen: () => {
      const tickX = startX - 0.05 + ((cols - 1) * spacingX + 0.1) * (filled / 50);
      return [tickX + rand(-0.005, 0.005), barY + rand(-0.05, 0.05)];
    }},
  ]);
}

// III.ii — Coordinate Sweep: grid of intersections + spiral of copper marks + corner refs
function shapeSweep(N) {
  const size = 1.6;
  const n = 11;
  const sx = -size / 2;
  const sy = -size / 2;
  const step = size / (n - 1);

  // pre-compute spiral points
  const spiral = [];
  const ci = 5, cj = 5;
  for (let t = 0; t < 14; t++) {
    const ang = t * 0.82;
    const rr = 0.4 + t * 0.28;
    const ii = Math.round(ci + rr * Math.cos(ang));
    const jj = Math.round(cj + rr * Math.sin(ang));
    if (ii >= 0 && ii < n && jj >= 0 && jj < n) {
      spiral.push([sx + ii * step, sy + jj * step]);
    }
  }
  const corners = [
    [sx + step, sy + step],
    [sx + (n - 2) * step, sy + step],
    [sx + step, sy + (n - 2) * step],
    [sx + (n - 2) * step, sy + (n - 2) * step],
  ];

  return allocate(N, [
    // grid lines (verticals)
    { weight: 0.22, gen: () => {
      const i = Math.floor(Math.random() * n);
      const x = sx + i * step;
      const y = rand(sy, sy + size);
      return [x + rand(-0.003, 0.003), y];
    }},
    // grid lines (horizontals)
    { weight: 0.22, gen: () => {
      const j = Math.floor(Math.random() * n);
      const y = sy + j * step;
      const x = rand(sx, sx + size);
      return [x, y + rand(-0.003, 0.003)];
    }},
    // outer frame
    { weight: 0.08, gen: () => {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) return [rand(sx, sx + size), sy + rand(-0.003, 0.003)];
      if (side === 1) return [rand(sx, sx + size), sy + size + rand(-0.003, 0.003)];
      if (side === 2) return [sx + rand(-0.003, 0.003), rand(sy, sy + size)];
      return [sx + size + rand(-0.003, 0.003), rand(sy, sy + size)];
    }},
    // spiral of copper marks (dense)
    { weight: 0.30, gen: () => {
      const p = spiral[Math.floor(Math.random() * spiral.length)];
      const a = Math.random() * Math.PI * 2;
      const rr = Math.pow(Math.random(), 0.4) * 0.04;
      return [p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr];
    }},
    // corner references (hollow)
    { weight: 0.18, gen: () => {
      const c = corners[Math.floor(Math.random() * 4)];
      const a = Math.random() * Math.PI * 2;
      const rr = 0.05 + rand(-0.003, 0.003);
      return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr];
    }},
  ]);
}

const SHAPES = [
  { name: 'Continuous Harvest', ref: 'I · i',   sub: 'loop · multi-source',         gen: shapeHarvest },
  { name: 'Weighted Discriminator', ref: 'I · ii', sub: 'classifier · threshold',    gen: shapeDiscriminator },
  { name: 'Cadence Engine',     ref: 'II · i',  sub: 'scheduler · 6h interval',      gen: shapeCadence },
  { name: 'Sensor Confluence',  ref: 'II · ii', sub: 'fusion · ambient state',       gen: shapeConfluence },
  { name: 'Metered Dispatch',   ref: 'III · i', sub: 'rate-limited · N / diem',      gen: shapeDispatch },
  { name: 'Coordinate Sweep',   ref: 'III · ii',sub: 'grid · paginated',             gen: shapeSweep },
];

/* ═══════════════════════════════════════════════════════════════
   SHADERS
   ═══════════════════════════════════════════════════════════════ */

const VERT = /* glsl */`
  uniform float uTime;
  uniform float uProgress;
  uniform vec2  uMouse;
  uniform float uMouseStrength;
  uniform float uPointSize;
  uniform float uPixelRatio;

  attribute vec3 aPosA;
  attribute vec3 aPosB;
  attribute float aRandom;

  varying float vAlpha;
  varying float vAccent;
  varying float vMouseGlow;

  // ease
  float easeInOut(float t) { return t * t * (3.0 - 2.0 * t); }

  void main() {
    float t = easeInOut(clamp(uProgress, 0.0, 1.0));
    vec3 p = mix(aPosA, aPosB, t);

    // organic drift (breath)
    float phase = uTime * 0.35 + aRandom * 6.28;
    p.x += sin(phase * 0.9) * 0.006;
    p.y += cos(phase * 1.15) * 0.006;
    p.z += sin(phase * 0.4) * 0.03;

    // mouse repulsion in world space
    vec2 toMouse = p.xy - uMouse;
    float d = length(toMouse);
    float force = smoothstep(0.55, 0.0, d) * uMouseStrength;
    p.xy += normalize(toMouse + vec2(0.0001)) * force * 0.22;
    vMouseGlow = smoothstep(0.4, 0.0, d);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uPointSize * (0.55 + aRandom * 0.95);
    size += vMouseGlow * 0.5;
    gl_PointSize = size * uPixelRatio * (340.0 / -mv.z);

    vAlpha  = 0.4 + aRandom * 0.55;
    vAccent = step(0.93, aRandom);   // ~7 % copper accent particles
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uCopper;
  uniform vec3 uPaper;

  varying float vAlpha;
  varying float vAccent;
  varying float vMouseGlow;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 base = mix(uPaper, uCopper, vAccent);
    base = mix(base, uCopper, vMouseGlow * 0.6);
    gl_FragColor = vec4(base, a * vAlpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════
   HERO WEBGL — particle instrument
   ═══════════════════════════════════════════════════════════════ */

class HeroInstrument {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
    this.camera.position.z = 3.2;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.mouse = new THREE.Vector2(-10, -10);
    this.mouseTarget = new THREE.Vector2(-10, -10);
    this.mouseStrength = 0;
    this.mouseStrengthTarget = 0;

    this.buildGeometry();
    this.buildMaterial();
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.currentIndex = 0;
    this.nextIndex = 1;
    this.transition = 0;
    this.transitionDuration = 1.4;
    this.holdDuration = 5.6;
    this.timer = this.holdDuration;
    this.transitioning = false;

    this.clock = new THREE.Clock();

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    if (!IS_TOUCH) {
      window.addEventListener('mousemove', this.onMouse.bind(this));
    }

    this.onShapeChange = null;
  }

  buildGeometry() {
    const N = PARTICLE_COUNT;
    const g = new THREE.BufferGeometry();

    // Precompute one BufferAttribute per specimen; transitions just swap references.
    this.attrPool = SHAPES.map(s => new THREE.BufferAttribute(s.gen(N), 3));

    const random = new Float32Array(N);
    for (let i = 0; i < N; i++) random[i] = Math.random();

    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aPosA', this.attrPool[0]);
    g.setAttribute('aPosB', this.attrPool[1]);
    g.setAttribute('aRandom', new THREE.BufferAttribute(random, 1));

    this.geometry = g;
  }

  buildMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime:           { value: 0 },
        uProgress:       { value: 0 },
        uMouse:          { value: new THREE.Vector2(-10, -10) },
        uMouseStrength:  { value: 0 },
        uPointSize:      { value: IS_MOBILE ? 3.0 : 3.2 },
        uPixelRatio:     { value: Math.min(window.devicePixelRatio, 2) },
        uPaper:          { value: COLORS.paper },
        uCopper:         { value: COLORS.copper },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onMouse(e) {
    // normalise to clip space, project to world at z=0
    const rect = this.canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    // convert to world-ish coords at z=0 plane
    const vFOV = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.mouseTarget.set(nx * width / 2, ny * height / 2);
    this.mouseStrengthTarget = 1;
  }

  beginTransition() {
    this.currentIndex = this.nextIndex;
    this.nextIndex = (this.nextIndex + 1) % SHAPES.length;
    this.geometry.setAttribute('aPosA', this.attrPool[this.currentIndex]);
    this.geometry.setAttribute('aPosB', this.attrPool[this.nextIndex]);
    this.transition = 0;
    this.transitioning = true;
    if (this.onShapeChange) this.onShapeChange(this.currentIndex, this.nextIndex);
  }

  // 0 → 1 across one full hold + transition cycle
  getCycleProgress() {
    const total = this.holdDuration + this.transitionDuration;
    const elapsed = this.transitioning
      ? this.holdDuration + this.transition * this.transitionDuration
      : this.holdDuration - this.timer;
    return Math.max(0, Math.min(1, elapsed / total));
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const t  = this.clock.elapsedTime;

    // mouse smoothing
    this.mouse.lerp(this.mouseTarget, 0.08);
    this.mouseStrength += (this.mouseStrengthTarget - this.mouseStrength) * 0.08;
    this.mouseStrengthTarget *= 0.985;
    this.material.uniforms.uMouse.value.copy(this.mouse);
    this.material.uniforms.uMouseStrength.value = this.mouseStrength;
    this.material.uniforms.uTime.value = t;

    // state machine
    if (this.transitioning) {
      this.transition += dt / this.transitionDuration;
      if (this.transition >= 1) {
        this.transition = 1;
        this.transitioning = false;
        this.timer = this.holdDuration;
      }
      this.material.uniforms.uProgress.value = this.transition;
    } else {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.beginTransition();
      }
      // Keep uProgress at 1.0 so last B stays rendered; after beginTransition it resets to 0
    }

    // gentle rotation for depth
    this.points.rotation.z = Math.sin(t * 0.05) * 0.015;
    this.points.rotation.y = Math.sin(t * 0.07) * 0.10;

    this.renderer.render(this.scene, this.camera);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CLOSE WEBGL — ambient drift
   ═══════════════════════════════════════════════════════════════ */

class AmbientDrift {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
    this.camera.position.z = 3.5;
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const N = IS_MOBILE ? 2500 : 7000;
    const posA = new Float32Array(N * 3);
    const posB = new Float32Array(N * 3);
    const random = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // dispersed cloud
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.8) * 1.5;
      posA[i*3]   = Math.cos(a) * r;
      posA[i*3+1] = Math.sin(a) * r * 0.55;
      posA[i*3+2] = (Math.random() - 0.5) * 0.8;
      posB[i*3]   = posA[i*3];
      posB[i*3+1] = posA[i*3+1];
      posB[i*3+2] = posA[i*3+2];
      random[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aPosA', new THREE.BufferAttribute(posA, 3));
    g.setAttribute('aPosB', new THREE.BufferAttribute(posB, 3));
    g.setAttribute('aRandom', new THREE.BufferAttribute(random, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime:           { value: 0 },
        uProgress:       { value: 1 },
        uMouse:          { value: new THREE.Vector2(-10, -10) },
        uMouseStrength:  { value: 0 },
        uPointSize:      { value: 2.0 },
        uPixelRatio:     { value: Math.min(window.devicePixelRatio, 2) },
        uPaper:          { value: COLORS.paper },
        uCopper:         { value: COLORS.copper },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(g, this.material);
    this.scene.add(this.points);

    this.clock = new THREE.Clock();
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  tick() {
    this.clock.getDelta(); // advances elapsedTime
    const t = this.clock.elapsedTime;
    this.material.uniforms.uTime.value = t;
    this.points.rotation.z = t * 0.01;
    this.renderer.render(this.scene, this.camera);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SPECIMEN CARD (2D CANVAS) — static archival dot illustration
   ═══════════════════════════════════════════════════════════════ */

function renderSpecimenCard(canvas, shapeIdx) {
  const dpr = Math.min(window.devicePixelRatio, 2);
  const W = 180, H = 180;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const N = 1800;
  const positions = SHAPES[shapeIdx].gen(N);

  const cx = W / 2, cy = H / 2;
  const scale = 64;                         // world → px
  for (let i = 0; i < N; i++) {
    const x = positions[i * 3] * scale + cx;
    const y = -positions[i * 3 + 1] * scale + cy;
    const r = Math.random();
    const isCopper = r < 0.08;
    ctx.fillStyle = isCopper ? '#BD5A33' : 'rgba(20,20,22,0.82)';
    const size = isCopper ? 1.6 : 1.1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // subtle inner frame tick (archival)
  ctx.strokeStyle = 'rgba(186,176,160,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = '#BD5A33';
  [[8,8],[W-8,8],[8,H-8],[W-8,H-8]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */

function runPreloader() {
  return new Promise((resolve) => {
    const el = document.getElementById('preloader');
    const barEl = document.getElementById('preBar');
    const txtEl = document.getElementById('preProgress');
    let p = 0;
    const int = setInterval(() => {
      p += 6 + Math.random() * 10;
      if (p >= 100) {
        p = 100;
        clearInterval(int);
        setTimeout(() => {
          el.classList.add('done');
          setTimeout(() => el.remove(), 900);
          resolve();
        }, 200);
      }
      barEl.style.width = p + '%';
      txtEl.textContent = String(Math.floor(p * 10)).padStart(4, '0');
    }, 60);
  });
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════════ */

function initCursor() {
  if (IS_TOUCH) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  // hover active on interactives
  document.querySelectorAll('a, button, .specimen').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
  });

  function raf() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  }
  raf();
}

/* ═══════════════════════════════════════════════════════════════
   REVEAL ON SCROLL
   ═══════════════════════════════════════════════════════════════ */

function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ═══════════════════════════════════════════════════════════════
   HERO TITLE TYPEWRITER — slit-clip line reveal on load
   ═══════════════════════════════════════════════════════════════ */

function initHeroTitle() {
  document.querySelectorAll('.tw-line').forEach(el => {
    const delay = parseInt(el.dataset.delay || '0', 10);
    setTimeout(() => el.classList.add('in'), delay);
  });
}

/* ═══════════════════════════════════════════════════════════════
   HERO METRICS COUNT-UP — numbers tick up once on reveal
   ═══════════════════════════════════════════════════════════════ */

function initMetricsCount() {
  const metrics = document.querySelectorAll('.metric-num[data-count]');
  if (!metrics.length) return;

  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const pad = parseInt(el.dataset.pad || '2', 10);
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      const v = Math.round(target * e);
      el.textContent = String(v).padStart(pad, '0');
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  // fire when the metric strip reveals into view
  const strip = document.getElementById('heroMetrics');
  if (!strip) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        metrics.forEach((m, i) => setTimeout(() => runCount(m), i * 140));
        io.disconnect();
      }
    });
  }, { threshold: 0.35 });
  io.observe(strip);
}

/* ═══════════════════════════════════════════════════════════════
   NAV BEHAVIOUR — light when past hero/positioning (dark act)
   ═══════════════════════════════════════════════════════════════ */

function initNav() {
  const nav = document.getElementById('nav');
  const actTwo = document.querySelector('.act-two');
  const close = document.querySelector('.close');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.target === actTwo) {
        nav.classList.toggle('light', e.isIntersecting);
      }
      if (e.target === close && e.isIntersecting) {
        nav.classList.remove('light');
      }
    });
  }, { threshold: [0, 0.01, 0.99, 1] });
  if (actTwo) io.observe(actTwo);
  if (close)  io.observe(close);
}

/* ═══════════════════════════════════════════════════════════════
   HERO LEGEND — reflect current specimen
   ═══════════════════════════════════════════════════════════════ */

function updateLegend(idx) {
  const shape = SHAPES[idx];
  const refEl = document.getElementById('legendRef');
  const nameEl = document.getElementById('legendName');
  const subEl = document.getElementById('legendSub');
  const idxEl = document.getElementById('legendIdx');
  if (!refEl) return;

  // fade out and swap
  [nameEl, subEl, refEl, idxEl].forEach(el => el.style.opacity = '0.2');
  setTimeout(() => {
    refEl.textContent = shape.ref;
    nameEl.textContent = shape.name;
    subEl.textContent = shape.sub;
    idxEl.textContent = String(idx + 1).padStart(2, '0');
    [nameEl, subEl, refEl, idxEl].forEach(el => el.style.opacity = '1');
  }, 180);
}

function makeLegendBarUpdater(hero) {
  const fill = document.getElementById('legendBarFill');
  if (!fill) return () => {};
  let lastPct = -1;
  return () => {
    const pct = hero.getCycleProgress() * 100;
    if (Math.abs(pct - lastPct) >= 0.4) {
      fill.style.width = pct + '%';
      lastPct = pct;
    }
  };
}

async function boot() {
  // WebGL and DOM init happen in parallel with the preloader animation.
  const setup = () => {
    initCursor();
    initReveal();
    initNav();
    initHeroTitle();
    initMetricsCount();

    let hero = null;
    const heroCanvas = document.getElementById('heroCanvas');
    if (heroCanvas) {
      try {
        hero = new HeroInstrument(heroCanvas);
        hero.onShapeChange = (cur) => updateLegend(cur);
        updateLegend(0);
      } catch (err) { console.warn('Hero WebGL failed', err); }
    }

    let close = null;
    const closeCanvas = document.getElementById('closeCanvas');
    if (closeCanvas) {
      try {
        close = new AmbientDrift(closeCanvas);
      } catch (err) { console.warn('Close WebGL failed', err); }
    }

    document.querySelectorAll('.spec-canvas canvas').forEach(cv => {
      renderSpecimenCard(cv, parseInt(cv.dataset.specimen, 10));
    });

    return { hero, close };
  };

  const [ { hero, close } ] = await Promise.all([
    Promise.resolve().then(setup),
    runPreloader(),
  ]);

  document.body.dataset.loaded = 'true';

  const updateLegendBar = hero ? makeLegendBarUpdater(hero) : () => {};

  function loop() {
    if (!document.hidden) {
      if (hero)  { hero.tick();  updateLegendBar(); }
      if (close) close.tick();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

boot();
