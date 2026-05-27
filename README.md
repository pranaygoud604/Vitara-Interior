# Vitara — Luxury Residential Interior & Exterior Design Studio

> v2 — Awwwards-tier immersive: fixed cinematic 3D villa behind the entire scroll, 14-stop camera dolly, animated day → golden → dusk → night, sky shader, ambient audio, chromatic aberration, vignette, grain.

## What's new in v2

- **One fixed WebGL canvas behind the entire journey.** As you scroll, the Three.js camera physically dollies through 14 spots inside the same villa — exterior → gate → driveway → entrance → living → dining → kitchen → bedroom → wardrobe → bathroom → balcony → pool → night → aerial.
- **Sky shader with moving sun.** Gradient sky + sun disc + horizon bloom + star field at night, all driven by a single phase value.
- **Day-to-night transition.** Five colour palettes (morning, noon, golden hour, dusk, night) interpolated continuously. Interior lights ramp up after golden hour; pool reflection sharpens at night; fireflies appear; fog density and tone-mapping exposure shift.
- **Camera dynamics.** Eased keyframe interpolation, micro shake calibrated per chapter, mouse parallax with inertia, dynamic FOV per stop.
- **Rich villa geometry.** Travertine plinth, cantilever first floor, columns, glass facades with mullions, bronze pivot door, dining pendants, kitchen islands, master bed, wardrobe, sculpted tub, mirror pool with rippling water, palms, hedges, gate, distant mountains.
- **Cinematic chrome.** Custom blend-mode cursor, grain, vignette, chromatic aberration overlay, scanline, glassmorphic nav, floating chapter counter, time-of-day HUD pill, ambient sound pill, side rails.
- **Ambient audio.** Pure WebAudio synth — wind (filtered noise + LFO), water shimmer, night drone, intermittent birdsong. Cross-fades by phase. Muted by default.
- **Portfolio 3D tilt.** Cards rotate in 3D on cursor move with radial shine.
- **Cinematic chapter reveals.** GSAP ScrollTrigger drives blur-in/out, depth, oversized roman type that crawls across the viewport.
- **Mobile pass.** Hidden cursor & rails, single-column layout, reduced particle counts, capped pixel ratio.
- **Performance.** `preserveDrawingBuffer` on, ACES tone mapping, mobile auto-detect drops shadows + reduces particle/palm counts, lazy reveal observers.


## Tech

- **React 18** (in-browser via Babel standalone — no build step required)
- **Three.js** — abstract villa model with cantilever volumes, glass facades,
  warm interior glow, palm silhouettes, pool, and ambient particle motes.
  Camera dollies into the house from scroll progress.
- **GSAP + ScrollTrigger** — scroll-pinned chapter reveals, parallax oversized
  typography per chapter.
- **Lenis** — buttery smooth scroll, tied to ScrollTrigger.
- **Bespoke CSS** — Cormorant Garamond (display), Space Grotesk (UI),
  JetBrains Mono (labels). No Tailwind, no UI kit.

## Run

No build step. Open `Vitara.html` in any modern browser — or serve the folder:

```bash
npx serve .
# then visit http://localhost:3000/Vitara.html
```

## File map

```
Vitara.html        # entry — fonts, libs, all React/JS modules
styles.css         # full design system + sections + chrome overlays
villa-scene.js     # Three.js villa: sky shader, 14-stop camera, day-night
audio.js           # WebAudio ambient synth (wind / water / drone / birds)
data.jsx           # editorial content for chapters, projects, services
shell.jsx          # cursor, nav, meta rails, HUD, chapter counter, preloader
chapters.jsx       # Chapter component (transparent overlay over canvas)
sections.jsx       # Intro, Marquee, Portfolio (3D tilt), About, Services, Contact, Footer
main.jsx           # App root, Hero, Journey (ScrollTrigger), canvas host
```

## Site architecture

```
┌─ Hero ────────────── Three.js villa, oversized type, floating glass chips
├─ Intro ───────────── Studio statement, drop-cap
├─ Marquee ─────────── Looping service words
├─ Journey (14 chapters)
│   I    Exterior          VIII  Bathroom
│   II   Entrance          IX    Balcony
│   III  Living            X     Studio
│   IV   Dining            XI    Landscape
│   V    Kitchen           XII   Pool
│   VI   Bedroom           XIII  Night Lighting
│   VII  Wardrobe          XIV   Overview
├─ Portfolio ────────── 5-card asymmetric grid
├─ About ──────────── Founder quote, portrait, drop-capped story, stats
├─ Services ─────────── 7 expanding-on-hover rows
├─ Contact ──────────── Project type, plot size, budget, location, timeline
└─ Footer ──────────── Type-as-image VITARA mark
```

## Roadmap

- Swap CSS "room plates" for real architectural photography
- Replace the abstract villa model with a baked GLTF
- Postprocessing pass (DOF + subtle bloom) for the Three.js scene
- Disable cursor + shadow maps on mobile
- Spline export of the villa for richer materials

## Push this code to GitHub

From the unzipped project root:

```bash
git init
git add .
git commit -m "Initial commit — Vitara cinematic residential studio"
git branch -M main
git remote add origin https://github.com/pranaygoud604/Vitara-Interior.git
git push -u origin main
```

If the repo already has a commit (e.g. a README created on github.com):

```bash
git pull --rebase origin main --allow-unrelated-histories
git push -u origin main
```

---

© Vitara · Composed in Bengaluru · Lisbon · Dubai
