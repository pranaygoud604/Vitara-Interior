/* ============================================================
   VITARA — Cinematic Villa Scene v2
   - Animated sky shader (sun + horizon gradient)
   - 14-keyframe camera path through entire villa
   - Day → golden → dusk → night transition
   - Rich villa: ground floor, cantilever, interior rooms,
     furniture volumes, columns, pool with fake reflection,
     palms with fronds, mountains, particles & fireflies
   - Mouse parallax + inertia + micro camera shake + FOV
   - Single fixed canvas; mounted once, drives whole site
   ============================================================ */
(function () {
  const VillaScene = {
    init(container, opts = {}) {
      if (!window.THREE) { console.warn("THREE not loaded"); return null; }
      const THREE = window.THREE;
      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const lowFi = opts.lowFi ?? isMobile;

      const scene = new THREE.Scene();
      const fogCol = new THREE.Color(0xd8d2c4);
      scene.fog = new THREE.FogExp2(fogCol.getHex(), 0.012);

      const W = container.clientWidth, H = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 400);
      camera.position.set(38, 18, 50);

      const renderer = new THREE.WebGLRenderer({
        antialias: !lowFi, alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowFi ? 1.25 : 2));
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = !lowFi;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      container.appendChild(renderer.domElement);

      /* ====================== SKY SHADER ====================== */
      const skyUniforms = {
        uTop:    { value: new THREE.Color(0x6a93c0) },
        uMid:    { value: new THREE.Color(0xd8d2c4) },
        uBottom: { value: new THREE.Color(0xc9b89a) },
        uSunDir: { value: new THREE.Vector3(-0.5, 0.7, 0.3) },
        uSunCol: { value: new THREE.Color(0xffe6b8) },
        uStars:  { value: 0.0 },
      };
      const skyGeo = new THREE.SphereGeometry(220, 32, 16);
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
          uniform float uStars;
          varying vec3 vWorld;

          float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }

          void main() {
            vec3 dir = normalize(vWorld);
            float h = clamp(dir.y, -0.2, 1.0);
            vec3 col;
            if (h > 0.0) {
              col = mix(uMid, uTop, smoothstep(0.0, 0.7, h));
            } else {
              col = mix(uMid, uBottom, smoothstep(0.0, 0.25, -h));
            }
            // Sun disc + halo
            float s = max(0.0, dot(dir, normalize(uSunDir)));
            float disc = smoothstep(0.9985, 0.9998, s);
            float halo = pow(s, 90.0) * 0.55;
            col += uSunCol * (disc * 2.2 + halo);
            // Subtle horizon bloom
            col += uSunCol * pow(max(0.0, 1.0 - abs(dir.y)*2.0), 6.0) * 0.18 * max(0.0, uSunDir.y);
            // Stars (visible at night)
            if (uStars > 0.01 && dir.y > 0.0) {
              vec3 p = floor(dir * 220.0);
              float n = hash(p);
              float star = step(0.9985, n) * uStars;
              col += vec3(star * 1.4);
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
      });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      scene.add(sky);

      /* ====================== LIGHTING ====================== */
      const hemi = new THREE.HemisphereLight(0xfff1d0, 0x705a44, 0.55);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffe6b8, 1.6);
      sun.position.set(-22, 30, 18);
      sun.castShadow = !lowFi;
      if (sun.castShadow) {
        sun.shadow.mapSize.set(lowFi ? 512 : 1024, lowFi ? 512 : 1024);
        const s = sun.shadow.camera;
        s.left = -32; s.right = 32; s.top = 32; s.bottom = -32;
        s.near = 0.5; s.far = 90;
        sun.shadow.bias = -0.0005;
      }
      scene.add(sun);

      // Interior lights (room-by-room warm sources)
      const interiorLights = [];
      function addInteriorLight(x, y, z, color = 0xffc183, intensity = 0.0, distance = 10) {
        const l = new THREE.PointLight(color, intensity, distance, 2);
        l.position.set(x, y, z);
        scene.add(l);
        interiorLights.push(l);
        return l;
      }
      addInteriorLight(0, 2.4, 1.5);   // living
      addInteriorLight(-3.6, 2.4, -1); // dining
      addInteriorLight(3.6, 2.4, -1);  // kitchen
      addInteriorLight(0, 5.2, 1.5);   // master
      addInteriorLight(-3.6, 5.2, -1); // wardrobe
      addInteriorLight(3.6, 5.2, -1, 0xffe2b8); // bathroom
      addInteriorLight(0, 1.0, 6.5, 0x9ec9d4, 0.0, 8); // pool light
      addInteriorLight(-7, 1.4, 4, 0xffd09a, 0.0, 6); // garden uplight

      /* ====================== MATERIALS ====================== */
      const matStoneWarm = new THREE.MeshStandardMaterial({ color: 0xeadfca, roughness: 0.78, metalness: 0.02 });
      const matStoneCool = new THREE.MeshStandardMaterial({ color: 0xddd1b8, roughness: 0.85, metalness: 0.02 });
      const matDark      = new THREE.MeshStandardMaterial({ color: 0x1a1715, roughness: 0.65, metalness: 0.1 });
      const matWalnut    = new THREE.MeshStandardMaterial({ color: 0x6a4226, roughness: 0.55, metalness: 0.05 });
      const matMarble    = new THREE.MeshStandardMaterial({ color: 0xf5f1ea, roughness: 0.25, metalness: 0.05 });
      const matBronze    = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.35, metalness: 0.7 });
      const matBouclé    = new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.95, metalness: 0.0 });
      const matLinen     = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.95, metalness: 0.0 });
      const matGlass = new THREE.MeshPhysicalMaterial({
        color: 0x2a3a44, roughness: 0.05, metalness: 0.0,
        transmission: 0.75, transparent: true, opacity: 0.42,
        ior: 1.45, thickness: 0.4,
      });
      const matWaterDay = new THREE.MeshStandardMaterial({
        color: 0x6f9bb0, roughness: 0.12, metalness: 0.6, transparent: true, opacity: 0.86,
      });
      const matFoliage = new THREE.MeshStandardMaterial({ color: 0x2a3d24, roughness: 0.95 });
      const matFoliageDark = new THREE.MeshStandardMaterial({ color: 0x141a10, roughness: 1 });

      /* ====================== TERRAIN ====================== */
      const groundGeo = new THREE.PlaneGeometry(220, 220, 32, 32);
      // Slight noise to ground
      const gpos = groundGeo.attributes.position;
      for (let i = 0; i < gpos.count; i++) {
        const x = gpos.getX(i), y = gpos.getY(i);
        const d = Math.sqrt(x*x + y*y);
        if (d > 24) gpos.setZ(i, Math.sin(x*0.07)*0.4 + Math.cos(y*0.05)*0.4 + (d-24)*0.012);
      }
      groundGeo.computeVertexNormals();
      const ground = new THREE.Mesh(groundGeo,
        new THREE.MeshStandardMaterial({ color: 0xc7b395, roughness: 0.95, metalness: 0.0 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Sand path / driveway
      const driveGeo = new THREE.PlaneGeometry(7, 38);
      const drive = new THREE.Mesh(driveGeo,
        new THREE.MeshStandardMaterial({ color: 0xd9c9aa, roughness: 0.9 }));
      drive.rotation.x = -Math.PI/2; drive.position.set(0, 0.005, 22);
      drive.receiveShadow = true;
      scene.add(drive);

      // Distant mountain silhouettes (low poly cones)
      const mountainMat = new THREE.MeshStandardMaterial({ color: 0x8a8475, roughness: 1, flatShading: true });
      function mountain(x, z, r, h) {
        const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6, 1), mountainMat);
        m.position.set(x, h/2, z);
        scene.add(m);
      }
      mountain(-60, -70, 18, 14);
      mountain(-30, -85, 22, 18);
      mountain(10, -90, 26, 22);
      mountain(50, -80, 20, 16);
      mountain(80, -70, 16, 12);

      /* ====================== POOL ====================== */
      // Pool basin (recessed)
      const poolBasin = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 6.5),
        new THREE.MeshStandardMaterial({ color: 0x9f8a6c, roughness: 0.9 }));
      poolBasin.position.set(0, -0.4, 9);
      poolBasin.receiveShadow = true;
      scene.add(poolBasin);
      // Water surface
      const water = new THREE.Mesh(new THREE.PlaneGeometry(21.6, 6.1, 24, 8), matWaterDay);
      water.rotation.x = -Math.PI/2; water.position.set(0, 0.02, 9);
      scene.add(water);
      // animated normal-ish ripples via vertex displacement
      const waterPos = water.geometry.attributes.position;
      const waterBase = new Float32Array(waterPos.count);
      for (let i = 0; i < waterPos.count; i++) waterBase[i] = waterPos.getZ(i);

      // Pool deck
      const deck = new THREE.Mesh(new THREE.PlaneGeometry(34, 14),
        new THREE.MeshStandardMaterial({ color: 0xe5dac3, roughness: 0.9 }));
      deck.rotation.x = -Math.PI/2; deck.position.set(0, 0.008, 9);
      scene.add(deck);

      /* ====================== VILLA STRUCTURE ====================== */
      const villa = new THREE.Group();
      scene.add(villa);

      // Ground floor: open plan living/dining/kitchen, U-shape with walls on back+sides
      const gfFloor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 12), matStoneWarm);
      gfFloor.position.set(0, 0.15, -1);
      gfFloor.receiveShadow = true;
      villa.add(gfFloor);

      // Back wall (rear of house)
      const backWallGeo = new THREE.BoxGeometry(16.2, 3.4, 0.3);
      const backWall = new THREE.Mesh(backWallGeo, matStoneWarm);
      backWall.position.set(0, 1.85, -6.9);
      backWall.castShadow = backWall.receiveShadow = true;
      villa.add(backWall);

      // Side walls
      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.4, 12), matStoneWarm);
      sideL.position.set(-7.95, 1.85, -1); sideL.castShadow = true; villa.add(sideL);
      const sideR = sideL.clone(); sideR.position.x = 7.95; villa.add(sideR);

      // Interior partition wall (between living and kitchen/dining)
      const partition = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3, 5.5), matStoneCool);
      partition.position.set(0.6, 1.65, -3.6);
      villa.add(partition);

      // Glass front facade (south, facing pool)
      const glassFront = new THREE.Mesh(new THREE.BoxGeometry(15.4, 3.0, 0.12), matGlass);
      glassFront.position.set(0, 1.75, 4.9);
      villa.add(glassFront);
      // Mullions for glass facade
      for (let i = -5; i <= 5; i += 2.5) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.0, 0.16), matDark);
        m.position.set(i, 1.75, 4.96); villa.add(m);
      }
      const topMullion = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.07, 0.16), matDark);
      topMullion.position.set(0, 3.25, 4.96); villa.add(topMullion);
      const botMullion = topMullion.clone(); botMullion.position.y = 0.3; villa.add(botMullion);
      const midMullion = topMullion.clone(); midMullion.position.y = 1.75; villa.add(midMullion);

      // Pivot door (entrance) — bronze
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.08), matBronze);
      door.position.set(-6, 1.7, 4.96);
      door.castShadow = true;
      villa.add(door);

      // Cantilever first floor slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 14), matStoneWarm);
      slab.position.set(0, 3.55, -0.5);
      slab.castShadow = slab.receiveShadow = true;
      villa.add(slab);

      // Under-soffit warm strip
      const soffit = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.04, 13.6),
        new THREE.MeshStandardMaterial({ color: 0xffd7a3, emissive: 0xffb069, emissiveIntensity: 0.45, roughness: 0.6 }));
      soffit.position.set(0, 3.32, -0.5);
      villa.add(soffit);

      // First-floor walls
      const ff_back = new THREE.Mesh(new THREE.BoxGeometry(16.2, 2.8, 0.3), matStoneWarm);
      ff_back.position.set(0, 5.15, -6.9); ff_back.castShadow = true; villa.add(ff_back);
      const ff_sideL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 12), matStoneWarm);
      ff_sideL.position.set(-7.95, 5.15, -1); ff_sideL.castShadow = true; villa.add(ff_sideL);
      const ff_sideR = ff_sideL.clone(); ff_sideR.position.x = 7.95; villa.add(ff_sideR);

      // First-floor floor (interior reference)
      const ff_floor = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.1, 11.4), matWalnut);
      ff_floor.position.set(0, 3.82, -1);
      villa.add(ff_floor);

      // First-floor glass facade
      const ff_glass = new THREE.Mesh(new THREE.BoxGeometry(15.4, 2.6, 0.12), matGlass);
      ff_glass.position.set(0, 5.05, 4.9); villa.add(ff_glass);
      for (let i = -5; i <= 5; i += 2.5) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.16), matDark);
        m.position.set(i, 5.05, 4.96); villa.add(m);
      }

      // Roof slab (heavy overhang)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 16), matStoneCool);
      roof.position.set(0, 6.6, -0.5);
      roof.castShadow = roof.receiveShadow = true;
      villa.add(roof);
      const roofSoffit = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.04, 15.6),
        new THREE.MeshStandardMaterial({ color: 0xffd7a3, emissive: 0xffb069, emissiveIntensity: 0.35, roughness: 0.6 }));
      roofSoffit.position.set(0, 6.34, -0.5);
      villa.add(roofSoffit);

      // Columns under cantilever
      function column(x, z, h = 6.4) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.22), matDark);
        c.position.set(x, h/2 + 0.05, z); c.castShadow = true; villa.add(c);
      }
      column(-7.5, 5.4); column(7.5, 5.4); column(-7.5, -5.4); column(7.5, -5.4);
      column(0, 5.4);

      // Balcony rail (frameless glass) at upper level
      const railGlass = new THREE.Mesh(new THREE.BoxGeometry(19.6, 1.0, 0.06),
        new THREE.MeshPhysicalMaterial({ color: 0xa9c0d0, roughness: 0.05, transmission: 0.85, transparent: true, opacity: 0.5, ior: 1.45 }));
      railGlass.position.set(0, 4.25, 6.6); villa.add(railGlass);

      /* ====================== INTERIOR PROPS ====================== */
      // -- Living room: sofa + coffee table + rug --
      const sofa = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 1.6), matBouclé);
      sofa.position.set(-2.4, 0.65, 1.6); sofa.castShadow = true; villa.add(sofa);
      const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.6, 0.3), matBouclé);
      sofaBack.position.set(-2.4, 1.15, 0.95); villa.add(sofaBack);
      const coffee = new THREE.Mesh(new THREE.BoxGeometry(2, 0.32, 0.9), matWalnut);
      coffee.position.set(-2.4, 0.46, 3.0); villa.add(coffee);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.5),
        new THREE.MeshStandardMaterial({ color: 0xb8a584, roughness: 1 }));
      rug.rotation.x = -Math.PI/2; rug.position.set(-2.4, 0.31, 2); villa.add(rug);

      // -- Dining: long table + chairs --
      const dining = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 1.1), matWalnut);
      dining.position.set(-3.6, 0.96, -2.2); dining.castShadow = true; villa.add(dining);
      // table base
      const dBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.78, 0.18), matDark);
      dBase.position.set(-3.6, 0.49, -2.2); villa.add(dBase);
      // chairs (boxy)
      for (let i = 0; i < 4; i++) {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.42), matLinen);
        chair.position.set(-4.8 + i*0.8, 0.45, -1.55);
        villa.add(chair);
        const c2 = chair.clone(); c2.position.z = -2.85; villa.add(c2);
      }
      // Pendant lights over dining
      const pendantMat = new THREE.MeshStandardMaterial({ color: 0xffd7a3, emissive: 0xffb069, emissiveIntensity: 1.2, roughness: 0.4 });
      for (let i = -1; i <= 1; i++) {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2), matDark);
        cord.position.set(-3.6 + i*1.0, 2.4, -2.2); villa.add(cord);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), pendantMat);
        bulb.position.set(-3.6 + i*1.0, 1.8, -2.2); villa.add(bulb);
      }

      // -- Kitchen: island + range --
      const kIsland = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 1.0), matMarble);
      kIsland.position.set(3.6, 0.52, -2); villa.add(kIsland);
      const kCounter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 0.8), matMarble);
      kCounter.position.set(3.6, 0.52, -5.8); villa.add(kCounter);
      // Bar stools
      for (let i = -1; i <= 1; i++) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95), matDark);
        st.position.set(3.6 + i*1.0, 0.47, -1); villa.add(st);
      }

      // -- Master bed (upper level) --
      const bed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.55, 2.1), matLinen);
      bed.position.set(0, 4.18, 1.0); bed.castShadow = true; villa.add(bed);
      const head = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.18), matWalnut);
      head.position.set(0, 4.5, -0.1); villa.add(head);
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xf5edd9, roughness: 1 }));
      pillow.position.set(0, 4.52, 0.25); villa.add(pillow);

      // -- Wardrobe (upper, left bay) --
      const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.4, 0.35), matWalnut);
      wardrobe.position.set(-5.5, 5.05, -4.5); villa.add(wardrobe);
      // Vertical splits via dark inlays
      for (let i = -1.2; i <= 1.2; i += 0.6) {
        const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 0.36), matBronze);
        inlay.position.set(-5.5 + i, 5.05, -4.5); villa.add(inlay);
      }
      // central dressing island
      const dressing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 0.9), matWalnut);
      dressing.position.set(-5.0, 4.32, -3.4); villa.add(dressing);

      // -- Bathroom (upper right) --
      const tub = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 0.95), matMarble);
      tub.position.set(5.0, 4.22, -3.6); villa.add(tub);
      const basin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.7), matMarble);
      basin.position.set(5.0, 4.78, -5.4); villa.add(basin);
      const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x223038, roughness: 0.05, metalness: 0.9 }));
      mirror.position.set(5.0, 5.65, -6.7); villa.add(mirror);

      /* ====================== VEGETATION ====================== */
      function palm(x, z, scale = 1, seed = 0) {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 4.8, 8), matFoliageDark);
        trunk.position.y = 2.4; trunk.castShadow = true; g.add(trunk);
        for (let i = 0; i < 9; i++) {
          const frond = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.6, 4, 1, true), matFoliage);
          frond.position.y = 4.7;
          const a = (i / 9) * Math.PI * 2 + seed;
          const tilt = 0.55 + Math.sin(i + seed) * 0.18;
          frond.rotation.z = Math.cos(a) * tilt;
          frond.rotation.x = Math.sin(a) * tilt;
          frond.position.x = Math.cos(a) * 0.5;
          frond.position.z = Math.sin(a) * 0.5;
          frond.position.y += Math.cos(a) * 0.3;
          frond.castShadow = true;
          g.add(frond);
        }
        g.position.set(x, 0, z); g.scale.setScalar(scale);
        scene.add(g);
        return g;
      }
      const palms = [];
      palms.push(palm(-13, 10, 1.05, 0.0));
      palms.push(palm(-16, 4, 1.0, 0.5));
      palms.push(palm(13, 9, 1.1, 1.0));
      palms.push(palm(17, 3, 0.95, 1.4));
      palms.push(palm(-18, -8, 0.9, 2.1));
      palms.push(palm(18, -8, 1.0, 2.6));
      palms.push(palm(-10, 16, 1.2, 3.1));
      palms.push(palm(10, 16, 1.15, 3.6));
      if (!lowFi) {
        palms.push(palm(-22, 18, 0.85, 4.1));
        palms.push(palm(22, 18, 0.85, 4.6));
      }

      // Hedge boxes flanking driveway
      for (let i = 0; i < 6; i++) {
        const hedge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x3e4f33, roughness: 1 }));
        hedge.position.set(-4.6, 0.4, 14 + i*4); hedge.castShadow = true; scene.add(hedge);
        const h2 = hedge.clone(); h2.position.x = 4.6; scene.add(h2);
      }

      // Gate pillars at front of driveway
      const gateL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), matDark);
      gateL.position.set(-5, 1.6, 36); gateL.castShadow = true; scene.add(gateL);
      const gateR = gateL.clone(); gateR.position.x = 5; scene.add(gateR);
      const gateTop = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.14, 0.18), matDark);
      gateTop.position.set(0, 3.1, 36); scene.add(gateTop);

      /* ====================== PARTICLES & FIREFLIES ====================== */
      function makePoints(count, range, ySpan, yMin, color, size, opacity) {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          pos[i*3]   = (Math.random() - 0.5) * range;
          pos[i*3+1] = yMin + Math.random() * ySpan;
          pos[i*3+2] = (Math.random() - 0.5) * range;
        }
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false });
        const pts = new THREE.Points(g, m);
        scene.add(pts);
        return pts;
      }
      const motes = makePoints(lowFi ? 80 : 220, 50, 10, 1, 0xfff0d0, 0.06, 0.45);
      const fireflies = makePoints(lowFi ? 30 : 80, 40, 6, 0.5, 0xffd66e, 0.07, 0.0);
      fireflies.material.opacity = 0;

      /* ====================== CAMERA PATH ====================== */
      // 16 cinematic stops (one more than chapters to allow lookahead). Position + lookAt + FOV.
      const stops = [
        // 0: far aerial reveal (hero start)
        { p: [38, 18, 50],  l: [0, 4, 0],    fov: 38 },
        // 1: approach over driveway (hero end)
        { p: [0, 6, 28],    l: [0, 3.5, 0],  fov: 36 },
        // 2: at the gate
        { p: [0, 2.6, 38],  l: [0, 2.8, 0],  fov: 42 },
        // 3: driveway mid
        { p: [0, 2.2, 22],  l: [0, 2.4, 0],  fov: 44 },
        // 4: entrance pivot door
        { p: [-2, 1.7, 8.5],l: [-5.8, 1.7, 4.9], fov: 48 },
        // 5: living room — inside
        { p: [-2.2, 1.7, 4.2], l: [-2.4, 1.4, -2], fov: 52 },
        // 6: dining
        { p: [-1.5, 1.6, -0.2], l: [-3.6, 1.0, -2.5], fov: 50 },
        // 7: kitchen
        { p: [2.4, 1.6, 0.0], l: [3.6, 1.0, -2.5], fov: 50 },
        // 8: master bedroom
        { p: [-1, 4.7, 3.0], l: [0, 4.3, -0.2], fov: 50 },
        // 9: wardrobe
        { p: [-3.6, 4.7, -2.2], l: [-5.5, 4.7, -4.6], fov: 52 },
        // 10: bathroom
        { p: [3.4, 4.8, -2.4], l: [5.0, 4.6, -6.0], fov: 50 },
        // 11: balcony
        { p: [0, 4.8, 5.6], l: [0, 3.5, 12], fov: 46 },
        // 12: pool deck (low to water)
        { p: [-4, 1.0, 11.5], l: [4, 1.0, 9], fov: 44 },
        // 13: night scene from across pool
        { p: [0, 1.4, 18], l: [0, 3.0, 0], fov: 40 },
        // 14: final aerial overview
        { p: [-26, 22, 36], l: [0, 4, 0], fov: 30 },
        // 15: pad
        { p: [-26, 22, 36], l: [0, 4, 0], fov: 30 },
      ];

      // ====== SCROLL → CAMERA ======
      // External code sets `setProgress(p)` where p∈[0,1] across the WHOLE journey.
      // We map p to a stop index t = p * (stops.length - 2). Smooth interpolation + ease.
      const v = new THREE.Vector3();
      const look = new THREE.Vector3();
      const targetPos = new THREE.Vector3().fromArray(stops[0].p);
      const targetLook = new THREE.Vector3().fromArray(stops[0].l);
      let targetFov = stops[0].fov;
      let scrollProgress = 0;
      let mouseX = 0, mouseY = 0;
      let tMouseX = 0, tMouseY = 0;
      let shakeAmt = 0;

      function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }

      function sampleStops(p) {
        const total = stops.length - 1;
        const x = p * (total - 1);
        const i = Math.min(Math.floor(x), total - 2);
        const f = easeInOutCubic(x - i);
        const a = stops[i], b = stops[i + 1];
        targetPos.set(
          a.p[0] + (b.p[0]-a.p[0])*f,
          a.p[1] + (b.p[1]-a.p[1])*f,
          a.p[2] + (b.p[2]-a.p[2])*f,
        );
        targetLook.set(
          a.l[0] + (b.l[0]-a.l[0])*f,
          a.l[1] + (b.l[1]-a.l[1])*f,
          a.l[2] + (b.l[2]-a.l[2])*f,
        );
        targetFov = a.fov + (b.fov - a.fov) * f;
        // micro shake stronger during driveway and pool, less in calm rooms
        shakeAmt = (i === 2 || i === 3 || i === 12) ? 0.04 : 0.015;
      }

      function onMouseMove(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        tMouseX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
        tMouseY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      }
      window.addEventListener('mousemove', onMouseMove);

      /* ====================== TIME OF DAY ====================== */
      // phase ∈ [0..1]: morning → noon → golden → dusk → night
      function setDayPhase(phase) {
        phase = Math.max(0, Math.min(1, phase));

        // Sun position on an arc (east low → high → west low → below)
        const sunAngle = phase * Math.PI * 1.05 - 0.05; // 0 at horizon east
        const sx = Math.cos(sunAngle) * 60;
        const sy = Math.sin(sunAngle) * 50;
        sun.position.set(sx, Math.max(-5, sy), 18);
        skyUniforms.uSunDir.value.set(-Math.cos(sunAngle), Math.max(-0.2, Math.sin(sunAngle)), 0.3).normalize();

        // Color palettes for phases
        // 0.00 morning: cool blue
        // 0.25 noon: bright
        // 0.50 golden hour: warm orange
        // 0.75 dusk: violet
        // 1.00 night: deep blue
        const palettes = [
          { top: 0x5a82b5, mid: 0xe8d8b9, bot: 0xd9c19a, sunC: 0xffd7a8, hemiI: 0.55, sunI: 0.9,  fog: 0xc7c2b5, fogD: 0.012, exp: 1.0 },
          { top: 0x7aa9d8, mid: 0xeae3d2, bot: 0xd5c6a8, sunC: 0xfff1d0, hemiI: 0.6,  sunI: 1.4,  fog: 0xd5d0c2, fogD: 0.010, exp: 1.05 },
          { top: 0xb37553, mid: 0xe9b984, bot: 0xc88553, sunC: 0xffb060, hemiI: 0.45, sunI: 1.5,  fog: 0xc99878, fogD: 0.014, exp: 1.0 },
          { top: 0x5a4070, mid: 0xa86a72, bot: 0x6e4358, sunC: 0xff8055, hemiI: 0.28, sunI: 0.7,  fog: 0x7e5a6a, fogD: 0.018, exp: 0.95 },
          { top: 0x0a1428, mid: 0x14223e, bot: 0x0a1024, sunC: 0xb6c2ee, hemiI: 0.10, sunI: 0.18, fog: 0x0e1626, fogD: 0.022, exp: 0.85 },
        ];
        const seg = phase * (palettes.length - 1);
        const i = Math.min(Math.floor(seg), palettes.length - 2);
        const f = seg - i;
        const a = palettes[i], b = palettes[i+1];
        const cTop = new THREE.Color(a.top).lerp(new THREE.Color(b.top), f);
        const cMid = new THREE.Color(a.mid).lerp(new THREE.Color(b.mid), f);
        const cBot = new THREE.Color(a.bot).lerp(new THREE.Color(b.bot), f);
        const cSun = new THREE.Color(a.sunC).lerp(new THREE.Color(b.sunC), f);
        const cFog = new THREE.Color(a.fog).lerp(new THREE.Color(b.fog), f);
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

        // Interior lights ramp up after golden hour
        const nightStrength = Math.max(0, (phase - 0.45)) / 0.55;
        const baseIntensity = nightStrength * 1.6;
        interiorLights[0].intensity = baseIntensity * 1.1;
        interiorLights[1].intensity = baseIntensity * 1.0;
        interiorLights[2].intensity = baseIntensity * 1.0;
        interiorLights[3].intensity = baseIntensity * 1.1;
        interiorLights[4].intensity = baseIntensity * 0.9;
        interiorLights[5].intensity = baseIntensity * 1.2;
        interiorLights[6].intensity = nightStrength * 1.8; // pool
        interiorLights[7].intensity = nightStrength * 1.4; // garden

        // Soffit emissive ramp at night
        soffit.material.emissiveIntensity = 0.25 + nightStrength * 0.9;
        roofSoffit.material.emissiveIntensity = 0.2 + nightStrength * 0.7;

        // Pool reflectivity stronger at night
        matWaterDay.roughness = 0.12 - nightStrength * 0.08;
        matWaterDay.color.lerpColors(new THREE.Color(0x6f9bb0), new THREE.Color(0x1a2a3a), nightStrength);

        // Pendant emissive a touch brighter at night
        pendantMat.emissiveIntensity = 0.8 + nightStrength * 1.4;

        // Fireflies
        fireflies.material.opacity = nightStrength * 0.8;
        motes.material.opacity = 0.45 - nightStrength * 0.25;
      }
      setDayPhase(0.18);

      /* ====================== ANIMATE ====================== */
      const clock = new THREE.Clock();
      let frame;
      function animate() {
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const dt = clock.getDelta();

        // Smooth mouse inertia
        mouseX += (tMouseX - mouseX) * 0.05;
        mouseY += (tMouseY - mouseY) * 0.05;

        // Drive camera target
        sampleStops(scrollProgress);

        // Smooth camera follow (inertia)
        camera.position.lerp(
          v.copy(targetPos).add(new THREE.Vector3(mouseX * 0.7, -mouseY * 0.35, 0)),
          0.06
        );
        // Camera shake (perlin-y from sines)
        const shake = shakeAmt * (Math.sin(t*7.3)*0.5 + Math.sin(t*11.1)*0.3 + Math.cos(t*3.7)*0.2);
        camera.position.y += shake;

        look.lerp(targetLook, 0.08);
        camera.lookAt(look);

        // FOV ease
        camera.fov += (targetFov - camera.fov) * 0.06;
        camera.updateProjectionMatrix();

        // Water ripples
        for (let i = 0; i < waterPos.count; i++) {
          const x = waterPos.getX(i), y = waterPos.getY(i);
          const z = Math.sin(x*0.6 + t*1.2) * 0.025 + Math.cos(y*0.8 + t*1.6) * 0.025;
          waterPos.setZ(i, z);
        }
        waterPos.needsUpdate = true;

        // Drift palms slightly
        for (let i = 0; i < palms.length; i++) {
          palms[i].rotation.z = Math.sin(t*0.6 + i)*0.012;
        }

        // Particle drift
        const mp = motes.geometry.attributes.position;
        for (let i = 0; i < mp.count; i++) {
          mp.array[i*3+1] += Math.sin(t * 0.3 + i) * 0.0015;
          mp.array[i*3]   += Math.cos(t * 0.2 + i) * 0.0012;
        }
        mp.needsUpdate = true;

        // Fireflies bob
        const fp = fireflies.geometry.attributes.position;
        for (let i = 0; i < fp.count; i++) {
          fp.array[i*3+1] += Math.sin(t * 1.2 + i*1.7) * 0.008;
          fp.array[i*3]   += Math.cos(t * 0.9 + i*2.3) * 0.006;
        }
        fp.needsUpdate = true;

        // Interior light flicker
        interiorLights.forEach((l, i) => {
          if (l.intensity > 0) {
            l.intensity *= 1 + Math.sin(t * (2.1 + i*0.3)) * 0.012;
          }
        });

        renderer.render(scene, camera);
      }
      animate();

      /* ====================== RESIZE ====================== */
      function onResize() {
        const w = container.clientWidth, h = container.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener('resize', onResize);

      /* ====================== API ====================== */
      return {
        setProgress(p) { scrollProgress = Math.max(0, Math.min(1, p)); },
        setDayPhase,
        snapTo(idx) {
          const total = stops.length - 1;
          scrollProgress = Math.max(0, Math.min(1, idx / (total - 1)));
        },
        getNumStops() { return stops.length; },
        destroy() {
          cancelAnimationFrame(frame);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
          renderer.dispose();
          if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }
  };
  window.VitaraVilla = VillaScene;
})();
