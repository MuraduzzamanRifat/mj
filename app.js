/* ═══════════════════════════════════════════════════════════════
   app.js
   · Hero: Three.js neural-network scene (nodes + pulsing edges)
   · Specimen cards: 2D canvas archival dot illustrations
   · Custom cursor, preloader, scroll reveals, title typewriter,
     metric count-up
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const IS_MOBILE = window.matchMedia('(max-width: 720px)').matches;
const IS_TOUCH  = window.matchMedia('(hover: none)').matches;

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
  { name: 'ProWorkSpace',              ref: '01', sub: 'AI SaaS Chrome extension',        gen: shapeHarvest },
  { name: 'Forex Lead Finder',         ref: '02', sub: 'Multi-platform scraping engine',  gen: shapeDiscriminator },
  { name: 'AYVA',                      ref: '03', sub: 'Shopify Dawn fork · storefront',  gen: shapeCadence },
  { name: 'BrandiVibe',                ref: '04', sub: '3D WebGL brand experience',       gen: shapeConfluence },
  { name: 'Email Outreach Engine',     ref: '05', sub: 'Rate-limited cold acquisition',   gen: shapeDispatch },
  { name: 'Maps Lead Extractor',       ref: '06', sub: 'Local business data pipeline',    gen: shapeSweep },
];


/* ═══════════════════════════════════════════════════════════════
   NEURON — Three.js network scene for the hero
   Nodes float in 3-D space and form edges whenever they're close
   enough; edges fade with distance. A pulse travels along a random
   edge every couple of seconds.
   ═══════════════════════════════════════════════════════════════ */

class Neuron {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 40);
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.nodeCount = IS_MOBILE ? 48 : 90;
    this.linkDist  = IS_MOBILE ? 1.9 : 1.8;     // connection threshold in world units
    this.maxLinks  = this.nodeCount * 6;        // safety cap on lines

    this.mouse = new THREE.Vector2(-10, -10);
    this.mouseTarget = new THREE.Vector2(-10, -10);

    this.buildNodes();
    this.buildLines();
    this.buildPulses();

    this.clock = new THREE.Clock();

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    if (!IS_TOUCH) {
      window.addEventListener('mousemove', this.onMouse.bind(this));
    }
  }

  buildNodes() {
    const N = this.nodeCount;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const accent = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      // distribute roughly inside a 6 × 4 × 3 box
      positions[i * 3]     = (Math.random() - 0.5) * 6.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.07;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.07;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
      sizes[i] = 0.6 + Math.random() * 1.4;
      accent[i] = Math.random() < 0.18 ? 1 : 0;    // ~18% copper nodes
    }

    this.nodePositions = positions;
    this.nodeVelocities = velocities;

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aAccent',  new THREE.BufferAttribute(accent, 1));

    this.nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixel: { value: Math.min(window.devicePixelRatio, 2) },
        uPaper:  { value: new THREE.Color('#EEE7D8') },
        uCopper: { value: new THREE.Color('#BD5A33') },
      },
      vertexShader: /* glsl */`
        attribute float aSize;
        attribute float aAccent;
        uniform float uPixel;
        varying float vAccent;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixel * (260.0 / -mv.z);
          vAccent = aAccent;
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uPaper;
        uniform vec3 uCopper;
        varying float vAccent;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          vec3 c = mix(uPaper, uCopper, vAccent);
          gl_FragColor = vec4(c, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.nodes = new THREE.Points(g, this.nodeMaterial);
    this.nodeGeometry = g;
    this.scene.add(this.nodes);
  }

  buildLines() {
    const max = this.maxLinks;
    // each edge is 2 vertices; each vertex has xyz + alpha
    this.linePositions = new Float32Array(max * 2 * 3);
    this.lineAlpha     = new Float32Array(max * 2);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    g.setAttribute('aAlpha',   new THREE.BufferAttribute(this.lineAlpha, 1));
    g.setDrawRange(0, 0);

    this.lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#EEE7D8') },
      },
      vertexShader: /* glsl */`
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = aAlpha;
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha * 0.45);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.lines = new THREE.LineSegments(g, this.lineMaterial);
    this.lineGeometry = g;
    this.scene.add(this.lines);
  }

  buildPulses() {
    // a handful of copper "signals" travelling along random edges
    this.pulseCount = IS_MOBILE ? 3 : 6;
    const positions = new Float32Array(this.pulseCount * 3);
    const sizes = new Float32Array(this.pulseCount);

    for (let i = 0; i < this.pulseCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      sizes[i] = 3.0;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

    this.pulseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixel:  { value: Math.min(window.devicePixelRatio, 2) },
        uCopper: { value: new THREE.Color('#D8784F') },
      },
      vertexShader: /* glsl */`
        attribute float aSize;
        uniform float uPixel;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixel * (260.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uCopper;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uCopper, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.pulses = new THREE.Points(g, this.pulseMaterial);
    this.pulseGeometry = g;
    this.scene.add(this.pulses);

    // each pulse travels from node A -> node B with progress t
    this.pulseTracks = [];
    for (let i = 0; i < this.pulseCount; i++) {
      this.pulseTracks.push(this.newPulseTrack());
    }
  }

  newPulseTrack() {
    const a = Math.floor(Math.random() * this.nodeCount);
    let b = Math.floor(Math.random() * this.nodeCount);
    if (b === a) b = (a + 1) % this.nodeCount;
    return { a, b, t: 0, speed: 0.15 + Math.random() * 0.25 };
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    const ny = -(((e.clientY - rect.top)  / rect.height) * 2 - 1);
    const vFOV = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
    const width  = height * this.camera.aspect;
    this.mouseTarget.set(nx * width / 2, ny * height / 2);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.mouse.lerp(this.mouseTarget, 0.08);

    // advect nodes + box bounds + gentle mouse attraction
    const p = this.nodePositions;
    const v = this.nodeVelocities;
    const bx = 3.2, by = 2.2, bz = 1.6;
    const mx = this.mouse.x, my = this.mouse.y;
    for (let i = 0; i < this.nodeCount; i++) {
      const j = i * 3;
      p[j]     += v[j]     * dt;
      p[j + 1] += v[j + 1] * dt;
      p[j + 2] += v[j + 2] * dt;

      // subtle mouse attraction at long range, repulsion very close
      const dx = p[j] - mx;
      const dy = p[j + 1] - my;
      const d2 = dx * dx + dy * dy + 0.0001;
      if (d2 < 4 && this.mouse.x > -5) {
        const f = -0.0012 / d2;       // attract toward mouse
        const near = d2 < 0.18 ? -0.02 / d2 : 0;  // push away if very close
        p[j]     += dx * (f + near);
        p[j + 1] += dy * (f + near);
      }

      // soft walls
      if (p[j] >  bx) v[j] -= 0.02;
      if (p[j] < -bx) v[j] += 0.02;
      if (p[j + 1] >  by) v[j + 1] -= 0.02;
      if (p[j + 1] < -by) v[j + 1] += 0.02;
      if (p[j + 2] >  bz) v[j + 2] -= 0.02;
      if (p[j + 2] < -bz) v[j + 2] += 0.02;
      // gentle damping
      v[j]     *= 0.995;
      v[j + 1] *= 0.995;
      v[j + 2] *= 0.995;
    }
    this.nodeGeometry.attributes.position.needsUpdate = true;

    // rebuild line segments: O(N^2) but N is small
    const lp = this.linePositions;
    const la = this.lineAlpha;
    const maxD = this.linkDist;
    const maxD2 = maxD * maxD;
    let pair = 0;
    const maxPairs = this.maxLinks;
    for (let i = 0; i < this.nodeCount && pair < maxPairs; i++) {
      const ix = p[i * 3], iy = p[i * 3 + 1], iz = p[i * 3 + 2];
      for (let j = i + 1; j < this.nodeCount && pair < maxPairs; j++) {
        const dx = ix - p[j * 3];
        const dy = iy - p[j * 3 + 1];
        const dz = iz - p[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < maxD2) {
          const k = pair * 6;
          lp[k]     = ix; lp[k + 1] = iy; lp[k + 2] = iz;
          lp[k + 3] = p[j * 3]; lp[k + 4] = p[j * 3 + 1]; lp[k + 5] = p[j * 3 + 2];
          const alpha = 1.0 - Math.sqrt(d2) / maxD;
          la[pair * 2]     = alpha;
          la[pair * 2 + 1] = alpha;
          pair++;
        }
      }
    }
    this.lineGeometry.setDrawRange(0, pair * 2);
    this.lineGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.attributes.aAlpha.needsUpdate = true;

    // pulses travelling along edges
    const pulsePos = this.pulseGeometry.attributes.position.array;
    for (let i = 0; i < this.pulseCount; i++) {
      const track = this.pulseTracks[i];
      track.t += dt * track.speed;
      if (track.t >= 1) {
        this.pulseTracks[i] = this.newPulseTrack();
        continue;
      }
      const a = track.a * 3;
      const b = track.b * 3;
      const t = track.t;
      pulsePos[i * 3]     = p[a]     + (p[b]     - p[a])     * t;
      pulsePos[i * 3 + 1] = p[a + 1] + (p[b + 1] - p[a + 1]) * t;
      pulsePos[i * 3 + 2] = p[a + 2] + (p[b + 2] - p[a + 2]) * t;
    }
    this.pulseGeometry.attributes.position.needsUpdate = true;

    // drift the whole scene for depth cue
    this.scene.rotation.y = Math.sin(this.clock.elapsedTime * 0.05) * 0.12;
    this.scene.rotation.x = Math.sin(this.clock.elapsedTime * 0.04) * 0.05;

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
    const isCopper = r < 0.12;
    ctx.fillStyle = isCopper ? '#BD5A33' : 'rgba(238,231,216,0.82)';
    const size = isCopper ? 1.6 : 1.1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(238,231,216,0.25)';
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
    // Preloader total ≈ 1.7 s — long enough to see the name letters
    // reveal and the tagline settle, short enough not to annoy.
    const duration = 1700;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.4);       // ease-out
      const p = eased * 100;
      barEl.style.width = p + '%';
      txtEl.textContent = String(Math.floor(eased * 1000)).padStart(4, '0');
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.classList.add('done');
        setTimeout(() => { el.remove(); resolve(); }, 650);
      }
    }
    requestAnimationFrame(step);
  });
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════════ */

function initCursor() {
  if (IS_TOUCH) return;
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  // If the page is missing the cursor elements, leave the native mouse alone —
  // don't hide it via body.has-custom-cursor, don't wire up listeners.
  if (!dot || !ring) return;

  document.body.classList.add('has-custom-cursor');

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
   SCROLL PROGRESS — thin copper rail at top of viewport
   ═══════════════════════════════════════════════════════════════ */

function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  let ticking = false;
  function update() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    bar.style.width = pct + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ═══════════════════════════════════════════════════════════════
   CARD TILT — subtle rotateX/rotateY based on cursor position
   ═══════════════════════════════════════════════════════════════ */

function initCardTilt() {
  if (IS_TOUCH) return;
  const cards = document.querySelectorAll('.specimen, .code-plate');
  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      const rx = (0.5 - y) * 4;            // max ±2°
      const ry = (x - 0.5) * 4;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
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
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const v = Math.round(target * e);
      el.textContent = String(v).padStart(pad, '0') + (t >= 1 ? suffix : '');
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

function initNavMobile() {
  const burger = document.getElementById('navBurger');
  const menu   = document.getElementById('navMobile');
  if (!burger || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  };

  burger.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  // Close when a nav link is tapped
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setOpen(false);
  });

  // Close if viewport grows past the mobile breakpoint while open
  const mq = window.matchMedia('(min-width: 901px)');
  const onChange = () => { if (mq.matches) setOpen(false); };
  (mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange));
}

async function boot() {
  // Neuron lives inside the preloader only; ticks until the
  // preloader element is removed from the DOM.
  const preCanvas = document.getElementById('preloaderCanvas');
  let preNeuron = null;
  let preRunning = true;
  if (preCanvas) {
    try {
      preNeuron = new Neuron(preCanvas);
      (function loop() {
        if (!preRunning || document.hidden) return;
        if (!document.getElementById('preloader')) {
          preRunning = false;
          return;
        }
        preNeuron.tick();
        requestAnimationFrame(loop);
      })();
    } catch (err) {
      console.warn('Preloader Neuron failed', err);
    }
  }

  const setup = () => {
    initCursor();
    initReveal();
    initNav();
    initNavMobile();
    initHeroTitle();
    initMetricsCount();
    initScrollProgress();
    initCardTilt();

    document.querySelectorAll('.spec-canvas canvas').forEach(cv => {
      renderSpecimenCard(cv, parseInt(cv.dataset.specimen, 10));
    });
  };

  await Promise.all([
    runPreloader(),
    Promise.resolve().then(setup),
  ]);

  document.body.dataset.loaded = 'true';
}

boot();
