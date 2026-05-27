/* ============================================================
   VITARA — Procedural PBR Texture Library
   Canvas-baked textures for: travertine, walnut, marble (calacatta),
   concrete, bronze, linen, bouclé, sand, foliage atlas.
   Each material gets:  base color + roughness + normal (where useful).
   ============================================================ */
(function () {
  if (!window.THREE) return;
  const THREE = window.THREE;
  const TEX_SIZE = 1024;

  /* ---------- helpers ---------- */
  function makeCanvas(w = TEX_SIZE, h = TEX_SIZE) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function rand(min = 0, max = 1) { return min + Math.random() * (max - min); }
  function tex(canvas, repeatU = 1, repeatV = 1) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatU, repeatV);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function texLinear(canvas, repeatU = 1, repeatV = 1) {
    const t = tex(canvas, repeatU, repeatV);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }
  // Generate a normal map from a heightfield canvas using Sobel
  function heightToNormal(srcCanvas, strength = 1.4) {
    const W = srcCanvas.width, H = srcCanvas.height;
    const dst = makeCanvas(W, H);
    const sctx = srcCanvas.getContext('2d');
    const dctx = dst.getContext('2d');
    const src = sctx.getImageData(0, 0, W, H);
    const out = dctx.createImageData(W, H);
    const s = src.data, o = out.data;
    function lum(i) { return (s[i] + s[i+1] + s[i+2]) / 765; }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const xl = (x - 1 + W) % W, xr = (x + 1) % W;
        const yu = (y - 1 + H) % H, yd = (y + 1) % H;
        const dx = (lum((y*W + xr)*4) - lum((y*W + xl)*4)) * strength;
        const dy = (lum((yd*W + x)*4) - lum((yu*W + x)*4)) * strength;
        const nx = -dx, ny = -dy, nz = 1;
        const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
        const i = (y * W + x) * 4;
        o[i  ] = ((nx/len) * 0.5 + 0.5) * 255;
        o[i+1] = ((ny/len) * 0.5 + 0.5) * 255;
        o[i+2] = ((nz/len) * 0.5 + 0.5) * 255;
        o[i+3] = 255;
      }
    }
    dctx.putImageData(out, 0, 0);
    return dst;
  }
  // Cheap value-noise field (octaves)
  function fillNoise(ctx, w, h, baseFreq = 4, octaves = 5, seed = 0) {
    const img = ctx.createImageData(w, h);
    const data = img.data;
    function noise(x, y) {
      const n = Math.sin((x*12.9898 + y*78.233 + seed*0.137) * 43758.5453);
      return n - Math.floor(n);
    }
    function smooth(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const a = noise(ix, iy);
      const b = noise(ix + 1, iy);
      const c = noise(ix, iy + 1);
      const d = noise(ix + 1, iy + 1);
      const ux = fx*fx*(3 - 2*fx);
      const uy = fy*fy*(3 - 2*fy);
      return a*(1-ux)*(1-uy) + b*ux*(1-uy) + c*(1-ux)*uy + d*ux*uy;
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0, amp = 1, freq = baseFreq, norm = 0;
        for (let i = 0; i < octaves; i++) {
          v += smooth(x/w * freq, y/h * freq) * amp;
          norm += amp;
          amp *= 0.5; freq *= 2;
        }
        v = v / norm;
        const i = (y*w + x) * 4;
        const c = Math.floor(v * 255);
        data[i] = data[i+1] = data[i+2] = c;
        data[i+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ============================================================
     TRAVERTINE — warm beige with horizontal banding + pores
     ============================================================ */
  function makeTravertine() {
    const c = makeCanvas();
    const ctx = c.getContext('2d');
    // base warm beige
    const grad = ctx.createLinearGradient(0, 0, 0, TEX_SIZE);
    grad.addColorStop(0, '#e9dec5');
    grad.addColorStop(0.5, '#e2d3b5');
    grad.addColorStop(1, '#d9c7a5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // horizontal banding (travertine signature)
    for (let i = 0; i < 60; i++) {
      const y = rand(0, TEX_SIZE);
      const h = rand(2, 22);
      const alpha = rand(0.05, 0.18);
      ctx.fillStyle = `rgba(120, 90, 60, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= TEX_SIZE; x += 18) {
        ctx.lineTo(x, y + Math.sin(x*0.018 + i)*h*0.4 + rand(-3,3));
      }
      ctx.lineTo(TEX_SIZE, y + h);
      for (let x = TEX_SIZE; x >= 0; x -= 18) {
        ctx.lineTo(x, y + h + Math.sin(x*0.022 + i*1.7)*h*0.4 + rand(-3,3));
      }
      ctx.closePath();
      ctx.fill();
    }
    // small pores / pits
    for (let i = 0; i < 800; i++) {
      const x = rand(0, TEX_SIZE), y = rand(0, TEX_SIZE);
      const r = rand(0.6, 3.4);
      ctx.fillStyle = `rgba(60, 40, 25, ${rand(0.15, 0.45)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    // big pores
    for (let i = 0; i < 80; i++) {
      const x = rand(0, TEX_SIZE), y = rand(0, TEX_SIZE);
      const r = rand(3, 9);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(40, 25, 15, 0.55)');
      g.addColorStop(1, 'rgba(40, 25, 15, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    // overall warm tint variance via noise
    const noiseC = makeCanvas(TEX_SIZE, TEX_SIZE);
    fillNoise(noiseC.getContext('2d'), TEX_SIZE, TEX_SIZE, 6, 5, 12);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.35;
    ctx.drawImage(noiseC, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // roughness — slightly varied (porous = higher rough)
    const roughC = makeCanvas(TEX_SIZE, TEX_SIZE);
    const rctx = roughC.getContext('2d');
    rctx.fillStyle = '#c0c0c0'; rctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    rctx.globalCompositeOperation = 'multiply';
    rctx.drawImage(noiseC, 0, 0);
    rctx.globalCompositeOperation = 'source-over';

    // height for normal (using same noise + bands)
    const heightC = makeCanvas(TEX_SIZE, TEX_SIZE);
    const hctx = heightC.getContext('2d');
    hctx.fillStyle = '#888'; hctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    hctx.globalCompositeOperation = 'overlay';
    hctx.drawImage(noiseC, 0, 0);
    hctx.globalCompositeOperation = 'source-over';
    // re-stamp pores darker (depressions)
    for (let i = 0; i < 200; i++) {
      const x = rand(0, TEX_SIZE), y = rand(0, TEX_SIZE), r = rand(2, 7);
      const g = hctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      hctx.fillStyle = g; hctx.beginPath(); hctx.arc(x,y,r,0,Math.PI*2); hctx.fill();
    }
    const normalC = heightToNormal(heightC, 1.4);
    return { map: c, roughness: roughC, normal: normalC };
  }

  /* ============================================================
     WALNUT WOOD — warm brown grain
     ============================================================ */
  function makeWalnut() {
    const c = makeCanvas();
    const ctx = c.getContext('2d');
    // base brown gradient
    const g = ctx.createLinearGradient(0, 0, TEX_SIZE, 0);
    g.addColorStop(0, '#5b3820');
    g.addColorStop(0.5, '#6a4226');
    g.addColorStop(1, '#4f2f1b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // grain lines (vertical, slightly wavy)
    for (let i = 0; i < 180; i++) {
      const x0 = rand(0, TEX_SIZE);
      const alpha = rand(0.04, 0.22);
      const dark = Math.random() < 0.5;
      ctx.strokeStyle = dark ? `rgba(20, 12, 6, ${alpha})` : `rgba(180, 130, 80, ${alpha})`;
      ctx.lineWidth = rand(0.6, 2.4);
      ctx.beginPath();
      let x = x0;
      ctx.moveTo(x, 0);
      for (let y = 0; y <= TEX_SIZE; y += 8) {
        x += rand(-1.4, 1.4);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // knots
    for (let i = 0; i < 6; i++) {
      const cx = rand(40, TEX_SIZE-40), cy = rand(40, TEX_SIZE-40);
      for (let r = 16; r > 0; r -= 2) {
        ctx.strokeStyle = `rgba(20, 10, 4, ${0.08 + (16-r)*0.02})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r*0.62, rand(0,Math.PI), 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.fillStyle = '#2a1608';
      ctx.beginPath(); ctx.ellipse(cx,cy,4,2.6,0,0,Math.PI*2); ctx.fill();
    }
    // noise overlay
    const n = makeCanvas(TEX_SIZE, TEX_SIZE);
    fillNoise(n.getContext('2d'), TEX_SIZE, TEX_SIZE, 12, 4, 7);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.25; ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // roughness map (woods are mid-rough)
    const r = makeCanvas(TEX_SIZE, TEX_SIZE);
    const rctx = r.getContext('2d');
    rctx.fillStyle = '#777'; rctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    rctx.globalAlpha = 0.4; rctx.drawImage(n, 0, 0); rctx.globalAlpha = 1;

    return { map: c, roughness: r };
  }

  /* ============================================================
     CALACATTA MARBLE — white with bold gray veins
     ============================================================ */
  function makeMarble() {
    const c = makeCanvas();
    const ctx = c.getContext('2d');
    // base near-white
    ctx.fillStyle = '#f4eee2'; ctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    // soft variance
    const n = makeCanvas(TEX_SIZE, TEX_SIZE);
    fillNoise(n.getContext('2d'), TEX_SIZE, TEX_SIZE, 4, 5, 22);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.22;
    ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // veins: meandering Bezier paths, varied thickness
    function vein(startX, startY, len, thickness, alpha) {
      let x = startX, y = startY;
      ctx.strokeStyle = `rgba(74, 60, 44, ${alpha})`;
      ctx.lineCap = 'round';
      for (let i = 0; i < len; i++) {
        const cx1 = x + rand(-40, 40), cy1 = y + rand(-40, 40);
        const nx = x + rand(-30, 80), ny = y + rand(-30, 80);
        ctx.lineWidth = thickness * (0.4 + Math.random()*0.6);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cx1, cy1, nx, ny);
        ctx.stroke();
        x = nx; y = ny;
        if (x < -50 || y < -50 || x > TEX_SIZE+50 || y > TEX_SIZE+50) break;
      }
    }
    for (let i = 0; i < 9; i++) {
      vein(rand(-50, TEX_SIZE), rand(-50, TEX_SIZE), 22, rand(2, 6), rand(0.18, 0.45));
    }
    // hair-thin veins (golden)
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(170, 130, 70, ${rand(0.06, 0.18)})`;
      ctx.lineWidth = rand(0.5, 1.2);
      ctx.beginPath();
      let x = rand(0, TEX_SIZE), y = rand(0, TEX_SIZE);
      ctx.moveTo(x, y);
      for (let s = 0; s < 14; s++) {
        x += rand(-30, 80); y += rand(-30, 80);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // micro speckle
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = `rgba(40, 30, 20, ${rand(0.04, 0.12)})`;
      ctx.fillRect(rand(0,TEX_SIZE), rand(0,TEX_SIZE), 1, 1);
    }
    // roughness (marble is polished, low rough w/ slight variance)
    const r = makeCanvas(TEX_SIZE, TEX_SIZE);
    const rctx = r.getContext('2d');
    rctx.fillStyle = '#444'; rctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    rctx.globalAlpha = 0.2; rctx.drawImage(n, 0, 0);
    return { map: c, roughness: r };
  }

  /* ============================================================
     CONCRETE — cool gray with mottling
     ============================================================ */
  function makeConcrete() {
    const c = makeCanvas();
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#bcb4a4'; ctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    const n = makeCanvas(TEX_SIZE, TEX_SIZE);
    fillNoise(n.getContext('2d'), TEX_SIZE, TEX_SIZE, 8, 5, 33);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.5;
    ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // form-tie holes
    for (let yy = 100; yy < TEX_SIZE; yy += 200) {
      for (let xx = 100; xx < TEX_SIZE; xx += 200) {
        const x = xx + rand(-20,20), y = yy + rand(-20,20);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
        g.addColorStop(0, 'rgba(40,30,20,0.7)'); g.addColorStop(1, 'rgba(40,30,20,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill();
      }
    }
    const r = makeCanvas(TEX_SIZE, TEX_SIZE);
    const rctx = r.getContext('2d');
    rctx.fillStyle = '#b0b0b0'; rctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
    rctx.globalAlpha = 0.5; rctx.drawImage(n, 0, 0);
    return { map: c, roughness: r };
  }

  /* ============================================================
     LINEN — cream fabric with subtle weave
     ============================================================ */
  function makeLinen() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#e6d9c0'; ctx.fillRect(0,0,512,512);
    // weave: vertical+horizontal stripes
    ctx.strokeStyle = 'rgba(180, 150, 110, 0.18)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 512; i += 2) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(80, 60, 35, 0.10)';
    for (let i = 0; i < 512; i += 2) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }
    // noise
    const n = makeCanvas(512, 512);
    fillNoise(n.getContext('2d'), 512, 512, 12, 4, 44);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.3;
    ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
    return { map: c };
  }

  /* ============================================================
     BOUCLÉ — bumpy cream texture
     ============================================================ */
  function makeBoucle() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c8b89a'; ctx.fillRect(0,0,512,512);
    // many small circles
    for (let i = 0; i < 4500; i++) {
      const x = rand(0, 512), y = rand(0, 512);
      const r = rand(2, 6);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const tone = rand(160, 220);
      g.addColorStop(0, `rgba(${tone}, ${tone-15}, ${tone-35}, 0.55)`);
      g.addColorStop(1, `rgba(80, 60, 40, 0.0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    // normal from height
    const h = makeCanvas(512, 512);
    const hctx = h.getContext('2d');
    hctx.fillStyle = '#888'; hctx.fillRect(0,0,512,512);
    for (let i = 0; i < 4500; i++) {
      const x = rand(0, 512), y = rand(0, 512);
      const r = rand(2, 6);
      const g = hctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      hctx.fillStyle = g;
      hctx.beginPath(); hctx.arc(x, y, r, 0, Math.PI*2); hctx.fill();
    }
    const n = heightToNormal(h, 2.2);
    return { map: c, normal: n };
  }

  /* ============================================================
     SAND — warm flat ground
     ============================================================ */
  function makeSand() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#d8c8a8'; ctx.fillRect(0,0,512,512);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `rgba(${rand(160,210)|0}, ${rand(140,180)|0}, ${rand(100,140)|0}, ${rand(0.1, 0.4)})`;
      ctx.fillRect(rand(0,512), rand(0,512), 1, 1);
    }
    return { map: c };
  }

  /* ============================================================
     PEBBLE — driveway gravel
     ============================================================ */
  function makePebble() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#c2b294'; ctx.fillRect(0,0,512,512);
    for (let i = 0; i < 380; i++) {
      const x = rand(0, 512), y = rand(0, 512);
      const r = rand(3, 9);
      const tone = rand(160, 220);
      const g = ctx.createRadialGradient(x-1, y-1, 0, x, y, r);
      g.addColorStop(0, `rgba(${tone}, ${tone-20}, ${tone-50}, 1)`);
      g.addColorStop(0.8, `rgba(${tone-40}, ${tone-60}, ${tone-90}, 1)`);
      g.addColorStop(1, `rgba(80, 60, 40, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, r, r*0.85, rand(0,6.28), 0, Math.PI*2); ctx.fill();
    }
    return { map: c };
  }

  /* ============================================================
     PLASTER — interior walls, warm off-white
     ============================================================ */
  function makePlaster() {
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ede4d2'; ctx.fillRect(0,0,512,512);
    const n = makeCanvas(512, 512);
    fillNoise(n.getContext('2d'), 512, 512, 10, 4, 88);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35;
    ctx.drawImage(n, 0, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // trowel streaks
    for (let i = 0; i < 12; i++) {
      const y = rand(0, 512);
      ctx.strokeStyle = `rgba(120, 100, 70, ${rand(0.04, 0.10)})`;
      ctx.lineWidth = rand(20, 45);
      ctx.beginPath();
      ctx.moveTo(-10, y);
      for (let x = 0; x <= 512; x += 30) ctx.lineTo(x, y + Math.sin(x*0.04 + i)*8);
      ctx.stroke();
    }
    return { map: c };
  }

  /* ============================================================
     IPE WOOD — dark exterior decking
     ============================================================ */
  function makeIpe() {
    const c = makeCanvas(1024, 1024);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#48311e'; ctx.fillRect(0,0,1024,1024);
    // plank lines
    for (let y = 0; y < 1024; y += 128) {
      ctx.fillStyle = '#1c1108';
      ctx.fillRect(0, y, 1024, 2);
    }
    // grain
    for (let i = 0; i < 240; i++) {
      ctx.strokeStyle = `rgba(${rand(20,70)|0}, ${rand(10,40)|0}, ${rand(5,20)|0}, ${rand(0.1, 0.35)})`;
      ctx.lineWidth = rand(0.5, 1.8);
      ctx.beginPath();
      let x = rand(0, 1024), y = rand(0, 1024);
      ctx.moveTo(x, y);
      for (let s = 0; s < 60; s++) { x += rand(2, 7); y += rand(-0.6, 0.6); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    return { map: c };
  }

  /* ============================================================
     CALCULATE & EXPORT
     ============================================================ */
  const built = {};
  function ensure(key, builder) {
    if (!built[key]) built[key] = builder();
    return built[key];
  }

  function buildMaterials() {
    const T = {
      travertine: ensure('travertine', makeTravertine),
      walnut:     ensure('walnut',     makeWalnut),
      marble:     ensure('marble',     makeMarble),
      concrete:   ensure('concrete',   makeConcrete),
      linen:      ensure('linen',      makeLinen),
      boucle:     ensure('boucle',     makeBoucle),
      sand:       ensure('sand',       makeSand),
      pebble:     ensure('pebble',     makePebble),
      plaster:    ensure('plaster',    makePlaster),
      ipe:        ensure('ipe',        makeIpe),
    };

    // floors use larger repeat
    const matTravertineFloor = new THREE.MeshStandardMaterial({
      map: tex(T.travertine.map, 4, 4),
      roughnessMap: texLinear(T.travertine.roughness, 4, 4),
      normalMap: texLinear(T.travertine.normal, 4, 4),
      roughness: 0.72, metalness: 0.02,
      normalScale: new THREE.Vector2(0.45, 0.45),
    });
    const matTravertineWall = new THREE.MeshStandardMaterial({
      map: tex(T.travertine.map, 3, 1.6),
      roughnessMap: texLinear(T.travertine.roughness, 3, 1.6),
      normalMap: texLinear(T.travertine.normal, 3, 1.6),
      roughness: 0.78, metalness: 0.02,
      normalScale: new THREE.Vector2(0.4, 0.4),
    });
    const matWalnut = new THREE.MeshStandardMaterial({
      map: tex(T.walnut.map, 1, 2),
      roughnessMap: texLinear(T.walnut.roughness, 1, 2),
      roughness: 0.55, metalness: 0.05,
    });
    const matWalnutFloor = new THREE.MeshStandardMaterial({
      map: tex(T.walnut.map, 6, 1),
      roughnessMap: texLinear(T.walnut.roughness, 6, 1),
      roughness: 0.5, metalness: 0.06,
    });
    const matMarble = new THREE.MeshStandardMaterial({
      map: tex(T.marble.map, 1, 1),
      roughnessMap: texLinear(T.marble.roughness, 1, 1),
      roughness: 0.18, metalness: 0.05,
      envMapIntensity: 1.1,
    });
    const matMarbleSlab = new THREE.MeshStandardMaterial({
      map: tex(T.marble.map, 2, 1),
      roughnessMap: texLinear(T.marble.roughness, 2, 1),
      roughness: 0.16, metalness: 0.05,
      envMapIntensity: 1.2,
    });
    const matConcrete = new THREE.MeshStandardMaterial({
      map: tex(T.concrete.map, 4, 1),
      roughnessMap: texLinear(T.concrete.roughness, 4, 1),
      roughness: 0.85, metalness: 0.02,
    });
    const matLinen = new THREE.MeshStandardMaterial({
      map: tex(T.linen.map, 2, 2), roughness: 0.95, metalness: 0.0,
    });
    const matBoucle = new THREE.MeshStandardMaterial({
      map: tex(T.boucle.map, 3, 3),
      normalMap: texLinear(T.boucle.normal, 3, 3),
      roughness: 0.95, metalness: 0.0,
      normalScale: new THREE.Vector2(1.2, 1.2),
    });
    const matSand = new THREE.MeshStandardMaterial({
      map: tex(T.sand.map, 20, 20), roughness: 0.95,
    });
    const matPebble = new THREE.MeshStandardMaterial({
      map: tex(T.pebble.map, 8, 16), roughness: 0.88,
    });
    const matPlaster = new THREE.MeshStandardMaterial({
      map: tex(T.plaster.map, 4, 2), roughness: 0.92,
    });
    const matIpe = new THREE.MeshStandardMaterial({
      map: tex(T.ipe.map, 2, 6), roughness: 0.62,
    });

    const matBronze = new THREE.MeshPhysicalMaterial({
      color: 0x8a6a3a, roughness: 0.32, metalness: 0.85,
      clearcoat: 0.4, clearcoatRoughness: 0.3,
      envMapIntensity: 1.4,
    });
    const matBronzeDark = new THREE.MeshPhysicalMaterial({
      color: 0x4a341f, roughness: 0.45, metalness: 0.75,
      envMapIntensity: 1.0,
    });
    const matBlack = new THREE.MeshPhysicalMaterial({
      color: 0x14110e, roughness: 0.42, metalness: 0.55,
      envMapIntensity: 0.9,
    });
    const matChrome = new THREE.MeshPhysicalMaterial({
      color: 0xdcd6c8, roughness: 0.15, metalness: 0.95,
      envMapIntensity: 1.6,
    });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xdfe8eb, roughness: 0.04, metalness: 0.0,
      transmission: 0.92, transparent: true, opacity: 0.35,
      ior: 1.5, thickness: 0.6,
      envMapIntensity: 1.3,
      clearcoat: 1, clearcoatRoughness: 0.04,
    });
    const matMirror = new THREE.MeshPhysicalMaterial({
      color: 0xe6e3da, roughness: 0.02, metalness: 1.0,
      envMapIntensity: 1.8,
    });
    const matFoliage = new THREE.MeshStandardMaterial({
      color: 0x2e4326, roughness: 0.92, metalness: 0.0,
    });
    const matFoliageDark = new THREE.MeshStandardMaterial({
      color: 0x1a2412, roughness: 0.98, metalness: 0.0,
    });
    const matTrunk = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a, roughness: 0.95, metalness: 0.0,
    });
    const matWater = new THREE.MeshPhysicalMaterial({
      color: 0x5d8aa3, roughness: 0.06, metalness: 0.0,
      transmission: 0.35, transparent: true, opacity: 0.88,
      ior: 1.33, thickness: 0.4,
      envMapIntensity: 1.6,
      clearcoat: 1, clearcoatRoughness: 0.02,
    });
    const matRug = new THREE.MeshStandardMaterial({
      color: 0xa89478, roughness: 1, metalness: 0,
    });
    const matEmberWarm = new THREE.MeshStandardMaterial({
      color: 0xffd49a, emissive: 0xffaa55, emissiveIntensity: 1.4, roughness: 0.4,
    });
    const matLeather = new THREE.MeshStandardMaterial({
      color: 0x5a3a26, roughness: 0.55, metalness: 0.08,
    });
    const matBookSpine = (col) => new THREE.MeshStandardMaterial({
      color: col, roughness: 0.7,
    });

    return {
      // floors / walls / surfaces
      matTravertineFloor, matTravertineWall, matWalnutFloor, matWalnut,
      matMarble, matMarbleSlab, matConcrete, matPlaster, matIpe,
      // ground / driveway
      matSand, matPebble,
      // metals / glass
      matBronze, matBronzeDark, matBlack, matChrome, matGlass, matMirror,
      // fabrics
      matBoucle, matLinen, matRug, matLeather,
      // organic
      matFoliage, matFoliageDark, matTrunk,
      // utility
      matWater, matEmberWarm, matBookSpine,
    };
  }

  window.VitaraTextures = { buildMaterials };
})();
