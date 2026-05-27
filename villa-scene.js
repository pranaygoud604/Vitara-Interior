/* ============================================================
   VITARA — Cinematic Villa Scene v3
   - Procedural PBR materials (travertine, walnut, marble, bouclé, ipe…)
   - PMREM env baking from sky shader (true reflections on glass/marble/bronze/water)
   - 18 cinematic camera stops with Catmull-Rom spline interpolation
   - Custom post-FX: bloom + grain + vignette + chromatic aberration + tone mapping
   - Lens breathing, micro shake, FOV variation
   - Day → noon → golden → dusk → night palette + interior light response
   - Clouds, birds, fireflies, weather particles
   - Mobile path: simpler camera, lower res
   ============================================================ */
(function () {
  const VillaScene = {
    init(container, opts = {}) {
      if (!window.THREE) { console.warn("THREE not loaded"); return null; }
      if (!window.VitaraTextures || !window.VitaraBuild) {
        console.warn("Vitara texture/build modules not loaded"); return null;
      }
      const THREE = window.THREE;
      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const lowFi = opts.lowFi ?? isMobile;

      /* =============== SCENE / RENDERER =============== */
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xd8d2c4, 0.011);

      const W = container.clientWidth, H = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 500);
      camera.position.set(38, 18, 50);

      const renderer = new THREE.WebGLRenderer({
        antialias: !lowFi, alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowFi ? 1.25 : 1.85));
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      container.appendChild(renderer.domElement);

      // build materials (cached)
      const M = window.VitaraTextures.buildMaterials();

      /* =============== SKY SHADER =============== */
      const skyUniforms = {
        uTop:    { value: new THREE.Color(0x6a93c0) },
        uMid:    { value: new THREE.Color(0xd8d2c4) },
        uBottom: { value: new THREE.Color(0xc9b89a) },
        uSunDir: { value: new THREE.Vector3(-0.5, 0.7, 0.3) },
        uSunCol: { value: new THREE.Color(0xffe6b8) },
        uStars:  { value: 0.0 },
        uTime:   { value: 0.0 },
      };
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: skyUniforms,
        vertexShader: `
          varying vec3 vWorld;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorld = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: `
          uniform vec3 uTop, uMid, uBottom, uSunCol;
          uniform vec3 uSunDir;
          uniform float uStars, uTime;
          varying vec3 vWorld;
          float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
          // simple 3d-ish value noise for clouds
          float noise2(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            float a = hash(vec3(i, 0.0));
            float b = hash(vec3(i + vec2(1.0,0.0), 0.0));
            float c = hash(vec3(i + vec2(0.0,1.0), 0.0));
            float d = hash(vec3(i + vec2(1.0,1.0), 0.0));
            vec2 u = f*f*(3.0-2.0*f);
            return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
          }
          float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i=0;i<5;i++) { v += a*noise2(p); p *= 2.07; a *= 0.5; }
            return v;
          }
          void main() {
            vec3 dir = normalize(vWorld);
            float h = clamp(dir.y, -0.2, 1.0);
            vec3 col;
            if (h > 0.0) col = mix(uMid, uTop, smoothstep(0.0, 0.7, h));
            else         col = mix(uMid, uBottom, smoothstep(0.0, 0.25, -h));
            // Sun disc + halo
            vec3 sd = normalize(uSunDir);
            float s = max(0.0, dot(dir, sd));
            float disc = smoothstep(0.9988, 0.9999, s);
            float halo = pow(s, 80.0) * 0.55;
            col += uSunCol * (disc * 3.0 + halo);
            // Atmospheric scattering hint near sun
            col += uSunCol * pow(max(0.0, 1.0 - abs(dir.y)*1.6), 4.0) * 0.18 * max(0.0, sd.y);
            // Clouds (only above horizon)
            if (dir.y > 0.05) {
              vec2 cp = dir.xz / (dir.y + 0.4) * 1.2 + vec2(uTime*0.008, uTime*0.004);
              float cloud = smoothstep(0.45, 0.85, fbm(cp));
              cloud *= smoothstep(0.05, 0.3, dir.y);
              vec3 cloudCol = mix(uMid, vec3(1.0), 0.35) + uSunCol * 0.18;
              col = mix(col, cloudCol, cloud * (0.55 + 0.4 * max(0.0, sd.y)));
              // sun edge on clouds
              col += uSunCol * cloud * pow(s, 8.0) * 0.4;
            }
            // Stars
            if (uStars > 0.01 && dir.y > 0.05) {
              vec3 p = floor(dir * 260.0);
              float n = hash(p);
              float star = step(0.9988, n) * uStars;
              col += vec3(star * 1.5);
              // twinkle
              float tw = sin(uTime * 2.0 + n * 30.0) * 0.5 + 0.5;
              col += vec3(star * tw * 0.6);
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
      });
      const sky = new THREE.Mesh(new THREE.SphereGeometry(260, 48, 24), skyMat);
      scene.add(sky);

      /* =============== ENV MAP (PMREM from sky) =============== */
      // Bake the sky into a cubemap via CubeCamera and feed through PMREMGenerator.
      // Re-bake when day phase changes by ≥ 0.06.
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      const envSky = new THREE.Mesh(new THREE.SphereGeometry(260, 32, 16), skyMat); // shares material
      envScene.add(envSky);
      let lastBakePhase = -1;
      function bakeEnv(phase) {
        if (Math.abs(phase - lastBakePhase) < 0.05) return;
        lastBakePhase = phase;
        const rt = pmrem.fromScene(envScene, 0.04);
        scene.environment = rt.texture;
      }
      bakeEnv(0.18);

      /* =============== LIGHTING =============== */
      const hemi = new THREE.HemisphereLight(0xfff1d0, 0x6a5642, 0.45);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffe6b8, 1.6);
      sun.position.set(-22, 30, 18);
      sun.castShadow = true;
      sun.shadow.mapSize.set(lowFi ? 1024 : 2048, lowFi ? 1024 : 2048);
      const sc = sun.shadow.camera;
      sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40;
      sc.near = 0.5; sc.far = 110;
      sun.shadow.bias = -0.0004;
      sun.shadow.radius = 4;
      scene.add(sun);

      // Bounce light from pool / south-side
      const bounce = new THREE.DirectionalLight(0x9ec0d4, 0.25);
      bounce.position.set(0, 6, 30);
      scene.add(bounce);

      // Interior light registry — built by buildInteriors
      const registry = { interiorLights: [], soffits: [] };

      /* =============== TERRAIN =============== */
      const groundGeo = new THREE.PlaneGeometry(260, 260, 36, 36);
      const gpos = groundGeo.attributes.position;
      for (let i = 0; i < gpos.count; i++) {
        const x = gpos.getX(i), y = gpos.getY(i);
        const d = Math.sqrt(x*x + y*y);
        if (d > 24) gpos.setZ(i, Math.sin(x*0.07)*0.4 + Math.cos(y*0.05)*0.4 + (d-24)*0.012);
      }
      groundGeo.computeVertexNormals();
      const ground = new THREE.Mesh(groundGeo, M.matSand);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Driveway (pebble strip)
      const drive = new THREE.Mesh(new THREE.PlaneGeometry(7, 38), M.matPebble);
      drive.rotation.x = -Math.PI/2; drive.position.set(0, 0.006, 22);
      drive.receiveShadow = true; scene.add(drive);
      // entry forecourt — wider plate
      const fore = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), M.matTravertineFloor);
      fore.rotation.x = -Math.PI/2; fore.position.set(0, 0.008, 9);
      fore.receiveShadow = true; scene.add(fore);

      // Distant terrain — gentle hills
      const hillMat = new THREE.MeshStandardMaterial({ color: 0x7e7665, roughness: 1, flatShading: true });
      for (let i = 0; i < 8; i++) {
        const r = 14 + Math.random()*14;
        const h = 10 + Math.random()*16;
        const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1), hillMat);
        const ang = (i / 8) * Math.PI * 2;
        m.position.set(Math.cos(ang)*85, h/2, -50 - Math.sin(ang)*20);
        scene.add(m);
      }

      /* =============== POOL =============== */
      const poolBasinMat = new THREE.MeshStandardMaterial({ color: 0x4a6e80, roughness: 0.5 });
      const poolBasin = new THREE.Mesh(new THREE.BoxGeometry(22.4, 1.2, 6.8), poolBasinMat);
      poolBasin.position.set(0, -0.6, 9);
      poolBasin.receiveShadow = true;
      scene.add(poolBasin);
      // pool tile rim
      const rim = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.04, 7),
        new THREE.MeshStandardMaterial({ color: 0xc4b89a, roughness: 0.8 }));
      rim.position.set(0, 0.02, 9); scene.add(rim);
      // water surface
      const water = new THREE.Mesh(new THREE.PlaneGeometry(21.8, 6.2, 32, 12), M.matWater);
      water.rotation.x = -Math.PI/2; water.position.set(0, 0.05, 9);
      water.receiveShadow = true;
      scene.add(water);
      const waterPos = water.geometry.attributes.position;
      const waterBase = new Float32Array(waterPos.count);
      for (let i = 0; i < waterPos.count; i++) waterBase[i] = waterPos.getZ(i);

      // pool deck (travertine)
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(36, 14), M.matTravertineFloor);
      deck.rotation.x = -Math.PI/2; deck.position.set(0, 0.012, 9);
      deck.receiveShadow = true;
      scene.add(deck);

      /* =============== ARCHITECTURE + INTERIORS + LANDSCAPE =============== */
      window.VitaraBuild.buildArchitecture(scene, M, registry);
      window.VitaraBuild.buildInteriors(scene, M, registry);
      const landscape = window.VitaraBuild.buildLandscape(scene, M, lowFi);

      // Interior point lights placed at room centers (room-by-room glow)
      function placeRoomLight(x, y, z, color = 0xffaa66, base = 1.6, dist = 9) {
        const l = new THREE.PointLight(color, 0, dist, 2);
        l.position.set(x, y, z);
        scene.add(l);
        registry.interiorLights.push({ light: l, base, type: 'room' });
      }
      placeRoomLight(-2.5, 2.4, 1.5, 0xffaa66, 1.6);     // living
      placeRoomLight(-3.6, 2.2, -2.4, 0xffaa66, 1.4);    // dining
      placeRoomLight(3.6, 2.2, -2,  0xffba78, 1.3);      // kitchen
      placeRoomLight(0, 5.4, 1.0, 0xffaa66, 1.4);        // master
      placeRoomLight(-5.5, 5.4, -3.5, 0xffba78, 1.2);    // wardrobe
      placeRoomLight(5, 5.4, -5,   0xffce98, 1.5);       // bathroom
      placeRoomLight(5, 5.4, -0.5, 0xffaa66, 1.3);       // study
      placeRoomLight(0, 1.4, 9,    0x6ac7e3, 1.9, 12);   // pool
      placeRoomLight(-11.5, 1.4, 0, 0xffc89a, 1.1, 7);   // courtyard tree uplight
      placeRoomLight(0, 0.3, 6,    0xffc89a, 0.8, 5);    // entrance step
      placeRoomLight(-6, 2.4, 5,   0xffa860, 1.3, 5);    // entrance pivot lamp wash

      /* =============== ATMOSPHERE: clouds, birds, particles =============== */
      // Birds — sprites that loop a path
      const birdGroup = new THREE.Group(); scene.add(birdGroup);
      const birdMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.85, depthWrite: false });
      const birds = [];
      const numBirds = lowFi ? 4 : 9;
      for (let i = 0; i < numBirds; i++) {
        const g = new THREE.Group();
        const wL = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), birdMat);
        const wR = wL.clone();
        wR.position.x = 0.3; wL.position.x = -0.3;
        g.add(wL, wR);
        g.userData = {
          radius: 30 + Math.random() * 30,
          ySpan: 18 + Math.random() * 12,
          speed: 0.05 + Math.random() * 0.07,
          phase: Math.random() * Math.PI * 2,
          wingPhase: Math.random() * Math.PI * 2,
          wL, wR,
        };
        birdGroup.add(g); birds.push(g);
      }

      // Particle field (dust motes — visible in daytime)
      const moteGeo = new THREE.BufferGeometry();
      const moteCount = lowFi ? 90 : 240;
      const motePos = new Float32Array(moteCount * 3);
      for (let i = 0; i < moteCount; i++) {
        motePos[i*3]   = (Math.random() - 0.5) * 60;
        motePos[i*3+1] = 1 + Math.random() * 12;
        motePos[i*3+2] = (Math.random() - 0.5) * 60;
      }
      moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
      const motes = new THREE.Points(moteGeo,
        new THREE.PointsMaterial({ color: 0xfff0d0, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }));
      scene.add(motes);

      // Fireflies — appear at night only
      const ffGeo = new THREE.BufferGeometry();
      const ffCount = lowFi ? 30 : 90;
      const ffPos = new Float32Array(ffCount * 3);
      for (let i = 0; i < ffCount; i++) {
        ffPos[i*3]   = (Math.random() - 0.5) * 40;
        ffPos[i*3+1] = 0.5 + Math.random() * 6;
        ffPos[i*3+2] = (Math.random() - 0.5) * 40;
      }
      ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
      const fireflies = new THREE.Points(ffGeo,
        new THREE.PointsMaterial({ color: 0xffd66e, size: 0.10, transparent: true, opacity: 0.0, depthWrite: false, sizeAttenuation: true }));
      scene.add(fireflies);

      // Weather/light particles (occasionally faint floating particles like seeds)
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = lowFi ? 80 : 200;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustPos[i*3]   = (Math.random() - 0.5) * 80;
        dustPos[i*3+1] = 0.5 + Math.random() * 20;
        dustPos[i*3+2] = (Math.random() - 0.5) * 80;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dust = new THREE.Points(dustGeo,
        new THREE.PointsMaterial({ color: 0xffe4c0, size: 0.05, transparent: true, opacity: 0.25, depthWrite: false, sizeAttenuation: true }));
      scene.add(dust);

      /* =============== CAMERA PATH (18 stops, Catmull-Rom) =============== */
      // Stops follow the user-spec walkthrough.
      const STOPS = [
        // 0 Aerial reveal
        { p: [42, 22, 56],  l: [0, 4, -2],  fov: 36 },
        // 1 Approach (drone, lower)
        { p: [0, 8, 30],    l: [0, 3.5, 0], fov: 34 },
        // 2 Gate
        { p: [0, 2.4, 40],  l: [0, 2.8, 30], fov: 44 },
        // 3 Landscape / driveway mid
        { p: [-1.5, 2.1, 22], l: [1, 2.5, 6], fov: 46 },
        // 4 Entrance — pivot door
        { p: [-3, 1.7, 9.6], l: [-6.0, 1.7, 4.9], fov: 50 },
        // 5 Foyer (looking into living)
        { p: [-4.0, 1.7, 3.4], l: [-2.4, 1.4, -2.5], fov: 54 },
        // 6 Living
        { p: [-1.8, 1.7, 4.0], l: [-3.0, 1.0, -2.0], fov: 50 },
        // 7 Dining
        { p: [-0.8, 1.7, -0.4], l: [-3.8, 1.0, -2.6], fov: 48 },
        // 8 Kitchen
        { p: [2.0, 1.7, -0.2], l: [3.8, 1.1, -3.0], fov: 50 },
        // 9 Courtyard (looking out west)
        { p: [-7.2, 1.6, 0.4], l: [-12.0, 2.0, 0], fov: 52 },
        // 10 Master bedroom
        { p: [-1.2, 4.8, 3.2], l: [0.5, 4.5, -0.6], fov: 52 },
        // 11 Wardrobe
        { p: [-3.4, 4.8, -2.2], l: [-5.6, 4.7, -4.6], fov: 54 },
        // 12 Bathroom
        { p: [3.4, 4.9, -2.0], l: [5.2, 4.6, -6.0], fov: 50 },
        // 13 Balcony
        { p: [0, 4.9, 5.4],  l: [0, 3.5, 14], fov: 44 },
        // 14 Study
        { p: [3.5, 4.6, 1.4], l: [5.4, 4.6, -1.4], fov: 50 },
        // 15 Theatre
        { p: [0, 1.6, -12.6], l: [0, 1.7, -19.0], fov: 46 },
        // 16 Pool (low to water)
        { p: [-5, 0.7, 12.5], l: [5, 0.8, 8], fov: 42 },
        // 17 Night (over pool, looking at glowing villa)
        { p: [0, 1.6, 20],  l: [0, 3.0, 0], fov: 40 },
        // 18 Aerial ending
        { p: [-28, 24, 38], l: [0, 4, 0],  fov: 30 },
      ];

      // Build Catmull-Rom curves for position and lookAt (smooth spline)
      const posPoints = STOPS.map(s => new THREE.Vector3().fromArray(s.p));
      const lookPoints = STOPS.map(s => new THREE.Vector3().fromArray(s.l));
      const posCurve = new THREE.CatmullRomCurve3(posPoints, false, 'catmullrom', 0.4);
      const lookCurve = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.4);

      const _v = new THREE.Vector3();
      const _l = new THREE.Vector3();
      const targetPos = new THREE.Vector3().copy(posPoints[0]);
      const targetLook = new THREE.Vector3().copy(lookPoints[0]);
      let targetFov = STOPS[0].fov;
      let scrollProgress = 0;
      let mouseX = 0, mouseY = 0;
      let tMouseX = 0, tMouseY = 0;
      let shakeAmt = 0.012;
      let stopIdx = 0;

      function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }

      function sampleCurve(p) {
        // p in [0..1] maps along entire spline. Add slight ease per segment.
        const total = STOPS.length - 1;
        const seg = p * total;
        stopIdx = Math.min(Math.floor(seg), total - 1);
        const f = seg - stopIdx;
        const fE = easeInOutCubic(f);
        // Curve parameter:
        const u = (stopIdx + fE) / total;
        posCurve.getPointAt(Math.max(0, Math.min(1, u)), targetPos);
        lookCurve.getPointAt(Math.max(0, Math.min(1, u)), targetLook);
        // FOV interp (linear between stops, eased)
        const fovA = STOPS[stopIdx].fov;
        const fovB = STOPS[Math.min(stopIdx + 1, total)].fov;
        targetFov = fovA + (fovB - fovA) * fE;
        // Higher shake during gate/driveway/pool (movement)
        if (stopIdx === 1 || stopIdx === 2 || stopIdx === 3 || stopIdx === 16) shakeAmt = 0.045;
        else if (stopIdx >= 13 && stopIdx <= 15) shakeAmt = 0.020;
        else shakeAmt = 0.010;
      }

      /* =============== POST-PROCESSING PIPELINE =============== */
      // Pipeline:
      //   1. Render scene → sceneRT (full res)
      //   2. Bright pass → brightRT (half res)
      //   3. H-blur → blurH RT (half res)
      //   4. V-blur → blurV RT (half res)
      //   5. Composite (scene + bloom + grain + vignette + aberration) → screen
      const halfW = () => Math.max(2, Math.floor(W / 2));
      const halfH = () => Math.max(2, Math.floor(H / 2));
      const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
      let sceneRT  = new THREE.WebGLRenderTarget(W, H, rtOpts);
      let brightRT = new THREE.WebGLRenderTarget(halfW(), halfH(), { ...rtOpts, depthBuffer: false });
      let blurHRT  = new THREE.WebGLRenderTarget(halfW(), halfH(), { ...rtOpts, depthBuffer: false });
      let blurVRT  = new THREE.WebGLRenderTarget(halfW(), halfH(), { ...rtOpts, depthBuffer: false });

      // Fullscreen orthographic quad
      const fsScene = new THREE.Scene();
      const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const fsGeo = new THREE.PlaneGeometry(2, 2);
      const fsMesh = new THREE.Mesh(fsGeo, new THREE.MeshBasicMaterial());
      fsScene.add(fsMesh);

      const vsFullscreen = `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`;

      const brightMat = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, threshold: { value: 0.85 }, softness: { value: 0.3 } },
        vertexShader: vsFullscreen,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float threshold, softness;
          varying vec2 vUv;
          void main() {
            vec4 c = texture2D(tDiffuse, vUv);
            float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
            float k = smoothstep(threshold, threshold + softness, lum);
            gl_FragColor = vec4(c.rgb * k, 1.0);
          }`,
      });
      const blurMat = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1, 0) }, texel: { value: new THREE.Vector2(1/W, 1/H) } },
        vertexShader: vsFullscreen,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 dir, texel;
          varying vec2 vUv;
          void main() {
            // 9-tap gaussian
            vec4 c = vec4(0.0);
            vec2 off = texel * dir;
            c += texture2D(tDiffuse, vUv - off*4.0) * 0.05;
            c += texture2D(tDiffuse, vUv - off*3.0) * 0.09;
            c += texture2D(tDiffuse, vUv - off*2.0) * 0.12;
            c += texture2D(tDiffuse, vUv - off*1.0) * 0.15;
            c += texture2D(tDiffuse, vUv          ) * 0.18;
            c += texture2D(tDiffuse, vUv + off*1.0) * 0.15;
            c += texture2D(tDiffuse, vUv + off*2.0) * 0.12;
            c += texture2D(tDiffuse, vUv + off*3.0) * 0.09;
            c += texture2D(tDiffuse, vUv + off*4.0) * 0.05;
            gl_FragColor = c;
          }`,
      });
      const compMat = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          tBloom:   { value: null },
          uBloomStrength: { value: 0.55 },
          uTime: { value: 0 },
          uGrain: { value: 0.06 },
          uVignette: { value: 0.65 },
          uAberration: { value: 0.0028 },
          uNight: { value: 0.0 },
        },
        vertexShader: vsFullscreen,
        fragmentShader: `
          uniform sampler2D tDiffuse, tBloom;
          uniform float uBloomStrength, uTime, uGrain, uVignette, uAberration, uNight;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            vec2 uv = vUv;
            vec2 toCenter = uv - 0.5;
            float dist = length(toCenter);
            // Chromatic aberration scales with radial distance
            float ab = uAberration * (0.3 + dist * 1.4);
            vec3 c;
            c.r = texture2D(tDiffuse, uv + toCenter * ab).r;
            c.g = texture2D(tDiffuse, uv).g;
            c.b = texture2D(tDiffuse, uv - toCenter * ab).b;
            // Bloom add
            vec3 bloom = texture2D(tBloom, uv).rgb;
            c += bloom * uBloomStrength;
            // Subtle desat at night for cinematic feel
            float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
            c = mix(c, vec3(lum), uNight * 0.18);
            // Vignette
            float vig = 1.0 - smoothstep(0.45, 0.95, dist) * uVignette;
            c *= vig;
            // Film grain (animated)
            float n = (hash(uv * vec2(1920.0, 1080.0) + uTime) - 0.5) * uGrain;
            c += n;
            // Subtle lift on shadows / soft toe
            c = c / (c + vec3(0.06));
            // Re-tonal contrast a touch
            c = pow(c, vec3(0.95));
            gl_FragColor = vec4(c, 1.0);
          }`,
      });

      function renderPostFX() {
        // 1. Render scene
        renderer.setRenderTarget(sceneRT);
        renderer.render(scene, camera);
        // 2. Bright pass
        fsMesh.material = brightMat;
        brightMat.uniforms.tDiffuse.value = sceneRT.texture;
        renderer.setRenderTarget(brightRT);
        renderer.render(fsScene, fsCam);
        // 3. Horizontal blur
        fsMesh.material = blurMat;
        blurMat.uniforms.tDiffuse.value = brightRT.texture;
        blurMat.uniforms.dir.value.set(1.5, 0);
        blurMat.uniforms.texel.value.set(1/halfW(), 1/halfH());
        renderer.setRenderTarget(blurHRT);
        renderer.render(fsScene, fsCam);
        // 4. Vertical blur
        blurMat.uniforms.tDiffuse.value = blurHRT.texture;
        blurMat.uniforms.dir.value.set(0, 1.5);
        renderer.setRenderTarget(blurVRT);
        renderer.render(fsScene, fsCam);
        // 5. Composite to screen
        fsMesh.material = compMat;
        compMat.uniforms.tDiffuse.value = sceneRT.texture;
        compMat.uniforms.tBloom.value = blurVRT.texture;
        renderer.setRenderTarget(null);
        renderer.render(fsScene, fsCam);
      }

      /* =============== DAY → NIGHT =============== */
      function setDayPhase(phase) {
        phase = Math.max(0, Math.min(1, phase));
        // Sun on an arc
        const sunAngle = phase * Math.PI * 1.05 - 0.05;
        const sx = Math.cos(sunAngle) * 60;
        const sy = Math.sin(sunAngle) * 50;
        sun.position.set(sx, Math.max(-5, sy), 18);
        skyUniforms.uSunDir.value.set(-Math.cos(sunAngle), Math.max(-0.2, Math.sin(sunAngle)), 0.3).normalize();

        // Color palettes per phase
        const palettes = [
          { top: 0x4d7aae, mid: 0xe8d8b9, bot: 0xd9c19a, sunC: 0xffd7a8, hemiI: 0.45, sunI: 0.7,  fog: 0xc7c2b5, fogD: 0.012, exp: 0.95 },
          { top: 0x7aabd8, mid: 0xeae3d2, bot: 0xd5c6a8, sunC: 0xfff1d0, hemiI: 0.55, sunI: 1.4,  fog: 0xd5d0c2, fogD: 0.009, exp: 1.05 },
          { top: 0xc07a55, mid: 0xeab984, bot: 0xc88553, sunC: 0xffae50, hemiI: 0.42, sunI: 1.5,  fog: 0xc99878, fogD: 0.014, exp: 1.00 },
          { top: 0x523968, mid: 0xa06868, bot: 0x6e4358, sunC: 0xff7848, hemiI: 0.25, sunI: 0.55, fog: 0x7e5a6a, fogD: 0.020, exp: 0.92 },
          { top: 0x080f24, mid: 0x121e36, bot: 0x080d1c, sunC: 0xa8b6e8, hemiI: 0.08, sunI: 0.12, fog: 0x0c1422, fogD: 0.022, exp: 0.78 },
        ];
        const seg = phase * (palettes.length - 1);
        const i = Math.min(Math.floor(seg), palettes.length - 2);
        const f = seg - i;
        const a = palettes[i], b = palettes[i+1];
        function mix(ca, cb) { return new THREE.Color(ca).lerp(new THREE.Color(cb), f); }
        const cTop = mix(a.top, b.top), cMid = mix(a.mid, b.mid), cBot = mix(a.bot, b.bot);
        const cSun = mix(a.sunC, b.sunC), cFog = mix(a.fog, b.fog);
        skyUniforms.uTop.value.copy(cTop);
        skyUniforms.uMid.value.copy(cMid);
        skyUniforms.uBottom.value.copy(cBot);
        skyUniforms.uSunCol.value.copy(cSun);
        skyUniforms.uStars.value = Math.max(0, (phase - 0.78)) * 4.5;
        sun.color.copy(cSun);
        sun.intensity = a.sunI + (b.sunI - a.sunI) * f;
        hemi.intensity = a.hemiI + (b.hemiI - a.hemiI) * f;
        renderer.toneMappingExposure = a.exp + (b.exp - a.exp) * f;
        scene.fog.color.copy(cFog);
        scene.fog.density = a.fogD + (b.fogD - a.fogD) * f;

        // Interior lights ramp up past golden hour
        const night = Math.max(0, (phase - 0.45)) / 0.55;
        for (const slot of registry.interiorLights) {
          slot.light.intensity = slot.base * night * (0.95 + Math.sin(slot.light.position.x + slot.light.position.z) * 0.08);
        }
        // Soffit emissive
        for (const s of registry.soffits) {
          s.material.emissiveIntensity = 0.25 + night * 1.0;
        }
        if (registry.pendantMat) {
          registry.pendantMat.emissiveIntensity = 0.75 + night * 1.4;
        }
        // Water gets darker/glassier at night
        M.matWater.roughness = 0.06 - night * 0.04;
        M.matWater.color.lerpColors(new THREE.Color(0x5d8aa3), new THREE.Color(0x1a2030), night);
        // Particles
        fireflies.material.opacity = night * 0.85;
        motes.material.opacity = 0.55 - night * 0.4;
        dust.material.opacity = 0.25 - night * 0.18;
        // Bird visibility — only daytime
        birds.forEach(b => { b.children.forEach(c => c.material.opacity = (1 - night) * 0.85); });
        // Post-FX night flag (subtle desat)
        compMat.uniforms.uNight.value = night;
        // Aberration eases at night, bloom strengthens
        compMat.uniforms.uAberration.value = 0.0030 - night * 0.0010;
        compMat.uniforms.uBloomStrength.value = 0.55 + night * 0.65;
        compMat.uniforms.uVignette.value = 0.55 + night * 0.30;
        // Theatre screen gets brighter at night
        if (registry.theatreScreen) {
          registry.theatreScreen.emissiveIntensity = 1.4 + night * 1.2;
        }
        // Re-bake env if phase moved significantly
        bakeEnv(phase);
      }
      setDayPhase(0.18);

      /* =============== EVENTS =============== */
      function onMouseMove(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        tMouseX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        tMouseY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      }
      window.addEventListener('mousemove', onMouseMove);

      function onResize() {
        const w = container.clientWidth, h = container.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        sceneRT.setSize(w, h);
        brightRT.setSize(Math.max(2, Math.floor(w/2)), Math.max(2, Math.floor(h/2)));
        blurHRT.setSize(Math.max(2, Math.floor(w/2)), Math.max(2, Math.floor(h/2)));
        blurVRT.setSize(Math.max(2, Math.floor(w/2)), Math.max(2, Math.floor(h/2)));
      }
      window.addEventListener('resize', onResize);

      /* =============== ANIMATE LOOP =============== */
      const clock = new THREE.Clock();
      let frame;
      let envRebakeCounter = 0;

      function animate() {
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const dt = clock.getDelta();

        // Sky time (for cloud drift)
        skyUniforms.uTime.value = t;

        // Mouse inertia
        mouseX += (tMouseX - mouseX) * 0.05;
        mouseY += (tMouseY - mouseY) * 0.05;

        // Drive camera target along curve
        sampleCurve(scrollProgress);

        // Lens breathing: subtle FOV oscillation while paused on a stop
        const lensBreath = Math.sin(t * 0.6) * 0.6;

        // Position with parallax offset
        const px = mouseX * 0.7;
        const py = -mouseY * 0.35;
        camera.position.lerp(
          _v.copy(targetPos).add(new THREE.Vector3(px, py, 0)),
          0.055
        );
        // Micro shake (handheld)
        const shake = shakeAmt * (Math.sin(t*7.3)*0.5 + Math.sin(t*11.1)*0.3 + Math.cos(t*3.7)*0.2);
        const shakeX = shakeAmt * 0.6 * (Math.cos(t*5.1)*0.5 + Math.sin(t*9.7)*0.3);
        camera.position.y += shake;
        camera.position.x += shakeX;

        _l.lerp(targetLook, 0.075);
        camera.lookAt(_l);

        // FOV with lens breathing
        const desiredFov = targetFov + lensBreath;
        camera.fov += (desiredFov - camera.fov) * 0.06;
        camera.updateProjectionMatrix();

        // Water ripples
        for (let i = 0; i < waterPos.count; i++) {
          const x = waterPos.getX(i), y = waterPos.getY(i);
          const z = Math.sin(x*0.6 + t*1.2) * 0.02 + Math.cos(y*0.8 + t*1.6) * 0.02 + Math.sin(x*1.4 + y*1.1 + t*0.9) * 0.01;
          waterPos.setZ(i, z);
        }
        waterPos.needsUpdate = true;
        water.geometry.computeVertexNormals();

        // Palms sway
        if (landscape && landscape.palms) {
          for (let i = 0; i < landscape.palms.length; i++) {
            landscape.palms[i].rotation.z = Math.sin(t*0.55 + i)*0.012;
            landscape.palms[i].rotation.x = Math.cos(t*0.6 + i*0.7)*0.008;
          }
        }

        // Motes drift
        const mp = motes.geometry.attributes.position;
        for (let i = 0; i < mp.count; i++) {
          mp.array[i*3+1] += Math.sin(t * 0.3 + i) * 0.0014;
          mp.array[i*3]   += Math.cos(t * 0.2 + i) * 0.0011;
        }
        mp.needsUpdate = true;

        // Dust drift (slower)
        const dp = dust.geometry.attributes.position;
        for (let i = 0; i < dp.count; i++) {
          dp.array[i*3+1] += Math.sin(t * 0.15 + i*0.7) * 0.0008;
        }
        dp.needsUpdate = true;

        // Fireflies bob
        const fp = fireflies.geometry.attributes.position;
        for (let i = 0; i < fp.count; i++) {
          fp.array[i*3+1] += Math.sin(t * 1.2 + i*1.7) * 0.007;
          fp.array[i*3]   += Math.cos(t * 0.9 + i*2.3) * 0.005;
          fp.array[i*3+2] += Math.sin(t * 1.1 + i*1.3) * 0.005;
        }
        fp.needsUpdate = true;

        // Birds — circular flight + wing flap
        for (let i = 0; i < birds.length; i++) {
          const b = birds[i];
          const ud = b.userData;
          const a = t * ud.speed + ud.phase;
          b.position.set(Math.cos(a) * ud.radius, ud.ySpan + Math.sin(a*0.7) * 1.5, Math.sin(a) * ud.radius - 30);
          b.rotation.y = -a + Math.PI/2;
          // Wing flap
          const flap = Math.sin(t * 8 + ud.wingPhase) * 0.5;
          ud.wL.rotation.y = -flap;
          ud.wR.rotation.y = flap;
        }

        // Interior lights flicker subtle
        for (const slot of registry.interiorLights) {
          if (slot.light.intensity > 0.01 && slot.type === 'lamp') {
            slot.light.intensity *= 1 + Math.sin(t * 2.6 + slot.light.position.x) * 0.012;
          }
        }

        // Post FX time
        compMat.uniforms.uTime.value = t;

        // Periodically re-bake env map (handle slow phase drift)
        envRebakeCounter++;
        // (no-op; bakeEnv is called from setDayPhase when phase moves)

        // Render via post FX pipeline
        renderPostFX();
      }
      animate();

      /* =============== API =============== */
      return {
        setProgress(p) { scrollProgress = Math.max(0, Math.min(1, p)); },
        setDayPhase,
        snapTo(idx) {
          const total = STOPS.length - 1;
          scrollProgress = Math.max(0, Math.min(1, idx / total));
        },
        getNumStops() { return STOPS.length; },
        destroy() {
          cancelAnimationFrame(frame);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
          sceneRT.dispose(); brightRT.dispose(); blurHRT.dispose(); blurVRT.dispose();
          pmrem.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }
  };
  window.VitaraVilla = VillaScene;
})();
