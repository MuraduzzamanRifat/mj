# Muraduzzaman — Quiet Apparatus

A premium, WebGL-driven personal portfolio. Three acts: dark WebGL hero, light archival register, dark close. No framework, no build step — three files, ~80 KB.

## Files

```text
portfolio/
  index.html     — structure
  styles.css     — ~25 KB, fully styled Quiet Apparatus
  app.js         — ~32 KB, Three.js hero instrument + 2D canvas cards + cursor + preloader
  README.md      — this file
```

## What's built

### Act I — Dark (WebGL)

- **Preloader** with copper-ink rotating registration mark + progress bar
- **Custom cursor** — difference-blend dot + lerped ring, copper-tinted on interactives
- **Hero instrument** — 18,000-particle GPU system (6,000 on mobile) that **morphs through all six of your shipped specimens** every ~7 s
- **Particles respond to cursor** — a gravity well pushes them aside, revealing the form beneath
- **Live legend** below the hero updates automatically with the current specimen (ref, name, description, progress bar, 01/06 index)
- **Positioning section** — massive Bodoni "Most marketers buy tools. I build them."

### Act II — Light (archival)

- **Proof of Work** — six specimen cards, each with a **2D canvas dot illustration** rendered from the same shape generator as the hero (so the small cards match the large instrument)
- **Core Stack** — six numbered domains
- **Experience** — numbered list
- **Credentials** — two-column register

### Act III — Dark close

- **WebGL ambient drift field** (7,000 particles, slow rotation, noise)
- Ruthless close copy: "Hire me, you get the system."
- Contact grid with copper arrows that slide on hover

## Technical highlights

- **Three.js via ESM CDN** — no bundler, loaded through importmap
- **Custom GLSL shaders** — vertex shader handles position interpolation, organic drift, and mouse repulsion; fragment shader does soft dot rendering with copper accent particles
- **GPU particle morphing** via two position attributes (`aPosA`, `aPosB`) + `uProgress` uniform — interpolation happens on the GPU
- **Additive blending** for luminous copper accents against the ink background
- **Scroll reveals** via IntersectionObserver
- **Nav auto-switches** between light/dark based on which act is in viewport
- **Mobile-aware** — reduces particle count, disables custom cursor, layout stacks

## Run locally

```bash
cd portfolio
python -m http.server 8000
# open http://localhost:8000
```

Any static server works. The files have no build step.

## Deploy

### Netlify / Vercel / Cloudflare Pages

1. Drag the `portfolio/` folder onto the dashboard
2. Free SSL + CDN + custom domain supported

### GitHub Pages

1. Push to a repo, enable Pages on `main`
2. Live in ~60 seconds

### Cloudflare Pages (recommended)

- Fastest global CDN, free, no build config needed

## Editing

- **Palette:** CSS variables at top of `styles.css`
- **Specimen shapes:** `shapeHarvest`, `shapeDiscriminator`, etc. in `app.js` — pure geometry generators; tweak weights to change density
- **Hero timing:** `holdDuration` and `transitionDuration` on `HeroInstrument`
- **Particle count:** `PARTICLE_COUNT` at top of `app.js`
- **Copy:** everything lives in `index.html`; search for the section and edit

## Browser support

- Chrome / Edge / Firefox / Safari 15+ (requires WebGL + ES modules + importmap)
- Gracefully degrades: if WebGL fails, the dark background remains and the rest of the page works normally

## Performance

- Hero runs at 60 fps on a mid-range laptop with 18k particles
- No external CSS frameworks, no jQuery, no icon fonts, no trackers
- Total transfer: ~80 KB of local files + Three.js (~650 KB gzipped from CDN) + Google Fonts
