/* ============================================================
   VITARA — Villa Architecture & Interior Builders
   Pure geometry/material composition. No animation here.
   Called by villa-scene.js after materials are built.
   ============================================================ */
(function () {
  if (!window.THREE) return;
  const THREE = window.THREE;

  /* ---------- helpers ---------- */
  function box(w, h, d, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function plane(w, h, mat, x, y, z, rx = 0, parent) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 18), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  /* ============================================================
     ARCHITECTURE — main villa structure
     ============================================================ */
  function buildArchitecture(scene, M, registry) {
    const villa = new THREE.Group(); scene.add(villa);

    /* ---------- GROUND FLOOR ---------- */
    // floor slab (travertine, indoor area)
    box(16.4, 0.3, 12.4, M.matTravertineFloor, 0, 0.15, -1, villa);
    // step up into entrance
    box(2.8, 0.18, 1.4, M.matTravertineFloor, -6, 0.39, 5.7, villa);

    // BACK WALL — solid travertine, full height
    box(16.4, 3.4, 0.3, M.matTravertineWall, 0, 1.85, -6.9, villa);
    // exterior travertine cladding on back wall extends to upper floor
    box(16.4, 2.8, 0.18, M.matTravertineWall, 0, 5.15, -6.99, villa);

    // SIDE WALLS — travertine
    box(0.3, 3.4, 12, M.matTravertineWall, -7.95, 1.85, -1, villa);
    box(0.3, 3.4, 12, M.matTravertineWall, 7.95, 1.85, -1, villa);

    // INTERIOR PARTITIONS — plaster
    // between living and dining/kitchen (full)
    box(0.18, 2.8, 5.0, M.matPlaster, -1.0, 1.55, -4.1, villa);
    // half-wall between dining and kitchen
    box(0.18, 1.4, 3.0, M.matPlaster, 0.6, 0.85, -3.6, villa);

    // FOYER vestibule wall (creates threshold)
    box(2.6, 3.0, 0.18, M.matPlaster, -5.3, 1.65, 2.3, villa);

    /* ---------- GLASS FACADE (south) ---------- */
    // Massive glass front facing pool — split into panes for mullions
    function glassPane(w, h, x, y, z, parent) {
      const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), M.matGlass);
      g.position.set(x, y, z);
      parent.add(g);
      return g;
    }
    // ground floor: 5 panes of glass
    for (let i = -2; i <= 2; i++) {
      glassPane(2.95, 3.0, i * 3.05, 1.75, 4.92, villa);
    }
    // Mullions (bronze)
    for (let i = -2.5; i <= 2.5; i += 1) {
      const mu = box(0.08, 3.05, 0.18, M.matBronzeDark, i * 3.05, 1.75, 4.96, villa);
    }
    box(15.4, 0.10, 0.20, M.matBronzeDark, 0, 3.28, 4.96, villa);   // top rail
    box(15.4, 0.10, 0.20, M.matBronzeDark, 0, 0.30, 4.96, villa);   // bottom rail
    box(15.4, 0.06, 0.20, M.matBronzeDark, 0, 1.75, 4.96, villa);   // mid divider

    // Pivot entrance door (massive bronze) — offset from glass
    box(1.8, 3.2, 0.10, M.matBronze, -6.0, 1.7, 4.95, villa);
    // door handle
    box(0.04, 0.5, 0.08, M.matBronze, -6.45, 1.7, 5.01, villa);
    box(0.04, 0.5, 0.08, M.matBronze, -5.55, 1.7, 5.01, villa);

    /* ---------- CANTILEVER + UPPER LEVEL ---------- */
    // Massive cantilever slab — wraps front by 2.5m beyond ground floor
    box(20.4, 0.42, 14.2, M.matTravertineWall, 0, 3.55, -0.5, villa);
    // soffit (emissive warm strip)
    const soffit = box(19.8, 0.05, 13.6, M.matEmberWarm.clone(), 0, 3.32, -0.5, villa);
    soffit.material.emissiveIntensity = 0.35;
    registry.soffits = registry.soffits || [];
    registry.soffits.push(soffit);

    // First floor walls
    box(16.4, 2.8, 0.3, M.matTravertineWall, 0, 5.15, -6.9, villa);
    box(0.3, 2.8, 12, M.matTravertineWall, -7.95, 5.15, -1, villa);
    box(0.3, 2.8, 12, M.matTravertineWall, 7.95, 5.15, -1, villa);

    // First-floor interior floor (walnut)
    box(15.4, 0.1, 11.6, M.matWalnutFloor, 0, 3.82, -1, villa);

    // Upper-floor partitions: wardrobe wall, bathroom wall, study wall
    box(0.16, 2.6, 4.4, M.matPlaster, -3.2, 5.15, -3.2, villa); // wardrobe partition
    box(0.16, 2.6, 4.4, M.matPlaster, 3.2, 5.15, -3.2, villa);  // bathroom partition
    box(6.0, 2.6, 0.16, M.matPlaster, -5.0, 5.15, -1.8, villa); // master back

    // First-floor glass facade (matching ground)
    for (let i = -2; i <= 2; i++) {
      glassPane(2.95, 2.6, i * 3.05, 5.05, 4.92, villa);
    }
    for (let i = -2.5; i <= 2.5; i += 1) {
      box(0.08, 2.6, 0.18, M.matBronzeDark, i * 3.05, 5.05, 4.96, villa);
    }
    box(15.4, 0.10, 0.20, M.matBronzeDark, 0, 6.35, 4.96, villa);

    /* ---------- ROOF ---------- */
    box(22.4, 0.55, 16.4, M.matConcrete, 0, 6.65, -0.5, villa);
    const roofSoffit = box(22.0, 0.04, 16.0, M.matEmberWarm.clone(), 0, 6.36, -0.5, villa);
    roofSoffit.material.emissiveIntensity = 0.28;
    registry.soffits.push(roofSoffit);

    /* ---------- COLUMNS — slender black steel ---------- */
    function column(x, z, h = 6.5) {
      box(0.18, h, 0.18, M.matBlack, x, h/2 + 0.05, z, villa);
    }
    column(-7.8, 5.6); column(0, 5.6); column(7.8, 5.6);
    column(-7.8, -5.6); column(7.8, -5.6);

    /* ---------- BALCONY ---------- */
    // upper balcony deck (extends past slab)
    box(20.4, 0.12, 1.8, M.matIpe, 0, 3.78, 6.0, villa);
    // frameless glass balustrade
    const railMat = new THREE.MeshPhysicalMaterial({
      color: 0xb6cad6, roughness: 0.04, transmission: 0.85, transparent: true, opacity: 0.45,
      ior: 1.45, envMapIntensity: 1.5,
    });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(20.4, 1.05, 0.05), railMat);
    rail.position.set(0, 4.32, 6.85);
    villa.add(rail);

    /* ---------- HORIZONTAL FINS (façade detail) ---------- */
    // Bronze fins on west face (architectural rhythm)
    for (let i = 0; i < 8; i++) {
      const fin = box(0.04, 0.18, 11.6, M.matBronzeDark, -7.96 - 0.1, 1 + i*0.34, -1, villa);
    }

    /* ---------- ENTRANCE CANOPY ---------- */
    box(7, 0.18, 3.4, M.matBlack, -4, 3.0, 6.3, villa);

    /* ---------- GATE HOUSE / FENCE PILLARS ---------- */
    // Main gate pillars (heavy travertine pylons)
    box(1.0, 3.5, 1.0, M.matTravertineWall, -5.6, 1.75, 36, villa);
    box(1.0, 3.5, 1.0, M.matTravertineWall, 5.6, 1.75, 36, villa);
    // bronze plate on gate pillars
    box(0.06, 0.8, 0.6, M.matBronze, -5.05, 2.0, 36, villa);
    // gate beam
    box(10.8, 0.18, 0.22, M.matBlack, 0, 3.4, 36, villa);
    // gate slats (rhythm)
    for (let i = -4.4; i <= 4.4; i += 0.55) {
      box(0.06, 2.6, 0.16, M.matBronzeDark, i, 1.6, 36, villa);
    }
    // perimeter wall extending from gate pillars
    box(14, 1.6, 0.4, M.matTravertineWall, -13, 0.8, 36, villa);
    box(14, 1.6, 0.4, M.matTravertineWall, 13, 0.8, 36, villa);

    /* ---------- ENTRY STAIR + LANDSCAPE WALLS ---------- */
    // low entry landing wall
    box(20, 0.6, 0.4, M.matTravertineWall, 0, 0.3, 6.0, villa);

    // raised planter wall along front
    box(0.4, 0.9, 8, M.matTravertineWall, -10.4, 0.45, 4, villa);
    box(0.4, 0.9, 8, M.matTravertineWall, 10.4, 0.45, 4, villa);

    /* ---------- COURTYARD ---------- */
    // small courtyard cut on west side of villa (visible from living)
    // — simulated by a sunken planter
    box(3.0, 0.05, 3.0, M.matSand, -11.5, 0.06, 0, villa);
    // courtyard tree placeholder (slim trunk + sphere foliage)
    cyl(0.06, 0.1, 5.6, M.matTrunk, -11.5, 2.8, 0, villa);
    const treeCrown = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 14, 10),
      M.matFoliage
    );
    treeCrown.position.set(-11.5, 6.0, 0);
    treeCrown.castShadow = true;
    villa.add(treeCrown);
    // courtyard pebbles surrounding
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const r = 1.4 + Math.random()*0.5;
      const pb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random()*0.1, 6, 5),
        new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 1 })
      );
      pb.position.set(-11.5 + Math.cos(ang)*r, 0.1, Math.sin(ang)*r);
      villa.add(pb);
    }

    return villa;
  }

  /* ============================================================
     INTERIORS — per-room furniture
     ============================================================ */
  function buildInteriors(scene, M, registry) {
    const interiors = new THREE.Group(); scene.add(interiors);

    /* ===== LIVING ROOM ===== */
    // Large sectional sofa (L-shape)
    box(4.8, 0.7, 1.8, M.matBoucle, -2.6, 0.65, 1.4, interiors);     // main seat
    box(4.8, 0.55, 0.35, M.matBoucle, -2.6, 1.13, 0.7, interiors);   // back
    box(1.6, 0.7, 2.0, M.matBoucle, -4.8, 0.65, 2.1, interiors);     // L return
    box(0.35, 0.55, 2.0, M.matBoucle, -5.4, 1.13, 2.1, interiors);   // L back

    // throw cushions
    for (let i = 0; i < 3; i++) {
      const cu = box(0.55, 0.18, 0.5, M.matLinen, -3.4 + i*0.9, 1.05, 1.3, interiors);
      cu.rotation.y = (Math.random() - 0.5) * 0.2;
    }
    // Coffee table — walnut
    box(2.4, 0.05, 1.1, M.matWalnut, -2.4, 0.5, 3.1, interiors);
    box(0.1, 0.42, 1.0, M.matBlack, -3.4, 0.27, 3.1, interiors);  // legs
    box(0.1, 0.42, 1.0, M.matBlack, -1.4, 0.27, 3.1, interiors);
    // decorative bowl on table
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 18, 12, 0, Math.PI*2, 0, Math.PI/2),
      M.matMarble
    );
    bowl.position.set(-2.0, 0.55, 3.0);
    bowl.scale.set(1, 0.5, 1);
    interiors.add(bowl);
    // book stack
    for (let i = 0; i < 4; i++) {
      const colors = [0xa07050, 0xc4b89a, 0x5a4a36, 0xe8dcc0];
      box(0.5, 0.04, 0.34, M.matBookSpine(colors[i]), -3.0, 0.535 + i*0.045, 3.2, interiors);
    }

    // Area rug
    plane(5.5, 4.0, M.matRug, -2.6, 0.31, 2.0, -Math.PI/2, interiors);

    // Sculptural floor lamp (corner)
    cyl(0.04, 0.04, 2.0, M.matBronzeDark, -6.6, 1.0, 4.2, interiors);
    cyl(0.18, 0.22, 0.4, M.matLinen, -6.6, 2.15, 4.2, interiors);
    const lampGlow = new THREE.PointLight(0xffaa66, 0.0, 5, 2);
    lampGlow.position.set(-6.6, 2.2, 4.2);
    interiors.add(lampGlow);
    registry.interiorLights.push({ light: lampGlow, base: 1.6, type: 'lamp' });

    // Side console / shelving on rear wall
    box(2.6, 1.0, 0.36, M.matWalnut, -4.6, 0.55, -6.5, interiors);
    // books on console
    for (let i = 0; i < 7; i++) {
      const tones = [0x8a6a4a, 0xa08560, 0xb89a78, 0x4a3424, 0xc4b89a];
      box(0.08 + Math.random()*0.04, 0.42, 0.22,
        M.matBookSpine(tones[i % tones.length]),
        -5.6 + i*0.16, 1.26, -6.55, interiors);
    }
    // Sculptural vase
    cyl(0.12, 0.2, 0.55, M.matMarble, -3.6, 1.33, -6.55, interiors);

    // Wall art (rear wall, abstract)
    box(2.0, 1.4, 0.04, M.matBlack, -4.6, 2.6, -6.74, interiors);
    box(1.85, 1.25, 0.02,
      new THREE.MeshStandardMaterial({ color: 0xb89a78, roughness: 0.6 }),
      -4.6, 2.6, -6.72, interiors);

    /* ===== DINING ===== */
    // Long monolithic walnut table
    box(3.8, 0.16, 1.2, M.matWalnut, -3.6, 0.96, -2.4, interiors);
    box(2.6, 0.78, 0.18, M.matBlack, -3.6, 0.49, -2.4, interiors);
    // tablescape: candelabra + bowl
    for (let i = -1; i <= 1; i++) {
      cyl(0.04, 0.06, 0.4, M.matBronze, -3.6 + i*0.6, 1.24, -2.4, interiors);
      cyl(0.05, 0.05, 0.08, M.matEmberWarm.clone(), -3.6 + i*0.6, 1.48, -2.4, interiors);
    }
    box(0.7, 0.06, 0.3, M.matLinen, -3.6, 1.05, -2.4, interiors); // runner

    // Chairs (sculpted)
    function diningChair(x, z, rot = 0) {
      const g = new THREE.Group();
      box(0.45, 0.08, 0.45, M.matLinen, 0, 0.5, 0, g);  // seat
      box(0.45, 0.85, 0.06, M.matLinen, 0, 0.93, -0.22, g); // back
      box(0.04, 0.5, 0.04, M.matBlack, -0.2, 0.25, -0.2, g);
      box(0.04, 0.5, 0.04, M.matBlack,  0.2, 0.25, -0.2, g);
      box(0.04, 0.5, 0.04, M.matBlack, -0.2, 0.25,  0.2, g);
      box(0.04, 0.5, 0.04, M.matBlack,  0.2, 0.25,  0.2, g);
      g.position.set(x, 0, z); g.rotation.y = rot;
      interiors.add(g);
    }
    for (let i = 0; i < 4; i++) {
      diningChair(-4.95 + i*0.9, -1.65, 0);
      diningChair(-4.95 + i*0.9, -3.15, Math.PI);
    }
    // Pendant cluster — three brass globes
    const pendantMat = M.matEmberWarm.clone();
    pendantMat.emissiveIntensity = 0.85;
    registry.pendantMat = pendantMat;
    for (let i = -1; i <= 1; i++) {
      cyl(0.005, 0.005, 1.4, M.matBronzeDark, -3.6 + i*1.0, 2.4, -2.4, interiors);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), pendantMat);
      bulb.position.set(-3.6 + i*1.0, 1.8, -2.4);
      interiors.add(bulb);
    }

    /* ===== KITCHEN ===== */
    // Marble island
    box(3.8, 1.05, 1.1, M.matMarbleSlab, 3.6, 0.52, -1.8, interiors);
    // Waterfall edges (vertical marble)
    box(0.12, 1.05, 1.1, M.matMarbleSlab, 5.45, 0.52, -1.8, interiors);
    box(0.12, 1.05, 1.1, M.matMarbleSlab, 1.75, 0.52, -1.8, interiors);
    // back counter
    box(4.6, 1.05, 0.85, M.matMarbleSlab, 3.6, 0.52, -5.9, interiors);
    // upper cabinets (walnut)
    box(4.6, 1.0, 0.4, M.matWalnut, 3.6, 2.6, -6.6, interiors);
    // range hood (recessed black panel)
    box(1.4, 0.6, 0.5, M.matBlack, 3.6, 2.4, -6.5, interiors);
    // tap (chrome)
    cyl(0.018, 0.018, 0.4, M.matChrome, 3.6, 1.25, -5.9, interiors);
    cyl(0.02, 0.02, 0.25, M.matChrome, 3.6, 1.4, -5.7, interiors);
    // Bar stools (sculpted)
    for (let i = -1; i <= 1; i++) {
      cyl(0.18, 0.22, 0.04, M.matLeather, 3.6 + i*1.0, 0.85, -0.85, interiors);
      cyl(0.04, 0.04, 0.85, M.matBronzeDark, 3.6 + i*1.0, 0.42, -0.85, interiors);
      // footrest
      const fr = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.012, 6, 18),
        M.matBronzeDark);
      fr.rotation.x = Math.PI/2;
      fr.position.set(3.6 + i*1.0, 0.18, -0.85);
      interiors.add(fr);
    }
    // pendant over island
    cyl(0.005, 0.005, 1.0, M.matBronzeDark, 3.6, 2.4, -1.8, interiors);
    const islandBulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), pendantMat);
    islandBulb.position.set(3.6, 1.9, -1.8); interiors.add(islandBulb);

    /* ===== MASTER BEDROOM (upper) ===== */
    // bed base
    box(3.6, 0.4, 2.2, M.matWalnut, 0, 4.10, 1.0, interiors);
    // mattress + duvet
    box(3.4, 0.32, 2.0, M.matLinen, 0, 4.42, 1.0, interiors);
    // headboard
    box(3.8, 1.4, 0.18, M.matBoucle, 0, 4.6, -0.18, interiors);
    // pillows
    box(1.4, 0.18, 0.55,
      new THREE.MeshStandardMaterial({ color: 0xf5edd9, roughness: 1 }),
      -0.8, 4.65, 0.3, interiors);
    box(1.4, 0.18, 0.55,
      new THREE.MeshStandardMaterial({ color: 0xf5edd9, roughness: 1 }),
      0.8, 4.65, 0.3, interiors);
    // throw blanket (folded at foot)
    box(2.6, 0.05, 0.6,
      new THREE.MeshStandardMaterial({ color: 0x8a6e52, roughness: 0.95 }),
      0, 4.62, 1.95, interiors);

    // bedside tables
    box(0.7, 0.5, 0.5, M.matWalnut, -2.4, 4.05, 0.4, interiors);
    box(0.7, 0.5, 0.5, M.matWalnut,  2.4, 4.05, 0.4, interiors);
    // bedside lamps
    cyl(0.04, 0.04, 0.5, M.matBronze, -2.4, 4.55, 0.4, interiors);
    cyl(0.04, 0.04, 0.5, M.matBronze,  2.4, 4.55, 0.4, interiors);
    cyl(0.12, 0.15, 0.18, M.matLinen, -2.4, 4.85, 0.4, interiors);
    cyl(0.12, 0.15, 0.18, M.matLinen,  2.4, 4.85, 0.4, interiors);
    const bedLampL = new THREE.PointLight(0xffaa66, 0.0, 4, 2);
    bedLampL.position.set(-2.4, 4.9, 0.4);
    const bedLampR = new THREE.PointLight(0xffaa66, 0.0, 4, 2);
    bedLampR.position.set(2.4, 4.9, 0.4);
    interiors.add(bedLampL, bedLampR);
    registry.interiorLights.push({ light: bedLampL, base: 1.4, type: 'lamp' });
    registry.interiorLights.push({ light: bedLampR, base: 1.4, type: 'lamp' });

    // long bench at foot of bed
    box(3.0, 0.45, 0.55, M.matLeather, 0, 4.07, 2.5, interiors);

    // Bedroom drapery
    function drape(x) {
      const c = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 2.4, 8, 1),
        new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 1, side: THREE.DoubleSide })
      );
      // displace for folds
      const pos = c.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, Math.sin(pos.getX(i) * 6) * 0.05);
      }
      c.position.set(x, 5.0, 4.6);
      interiors.add(c);
    }
    for (let i = -3; i <= 3; i++) drape(i * 1.2);

    /* ===== WARDROBE (upper west) ===== */
    // floor-to-ceiling walnut joinery
    box(3.4, 2.4, 0.4, M.matWalnut, -5.5, 5.0, -4.5, interiors);
    // vertical dividers (bronze inlays)
    for (let i = -1.4; i <= 1.4; i += 0.7) {
      box(0.04, 2.2, 0.42, M.matBronze, -5.5 + i, 5.0, -4.5, interiors);
    }
    // horizontal shelves (visible through openings)
    for (let y = -0.8; y <= 0.8; y += 0.5) {
      box(3.3, 0.04, 0.4, M.matWalnut, -5.5, 5.0 + y, -4.49, interiors);
    }
    // visible items in shelves
    for (let s = 0; s < 8; s++) {
      const tones = [0xa08770, 0x5a4434, 0xc8b89a, 0xe8dcc0];
      box(0.18, 0.4, 0.18,
        M.matBookSpine(tones[s % 4]),
        -6.4 + s*0.25, 5.3, -4.4, interiors);
    }
    // dressing island
    box(1.6, 0.85, 0.9, M.matWalnut, -5.0, 4.32, -3.2, interiors);
    box(1.6, 0.06, 0.9, M.matMarbleSlab, -5.0, 4.78, -3.2, interiors);
    // mirror on wall
    box(0.04, 1.6, 0.8, M.matMirror, -7.85, 5.2, -3.2, interiors);
    // ceiling LED rail
    const wRail = box(3.4, 0.04, 0.04, M.matEmberWarm.clone(), -5.5, 6.3, -3.5, interiors);
    wRail.material.emissiveIntensity = 0.6;
    registry.soffits.push(wRail);

    /* ===== BATHROOM (upper east) ===== */
    // travertine wet wall
    box(4.6, 2.6, 0.18, M.matTravertineWall, 5.5, 5.15, -6.78, interiors);
    // monolithic tub (carved travertine)
    box(2.0, 0.65, 1.0, M.matTravertineFloor, 5.0, 4.22, -3.4, interiors);
    // tub interior void (illusion via dark inset)
    box(1.7, 0.05, 0.7, new THREE.MeshStandardMaterial({ color: 0x4a5660, roughness: 0.2 }),
        5.0, 4.5, -3.4, interiors);
    // basin counter (marble slab)
    box(2.6, 0.18, 0.7, M.matMarbleSlab, 5.0, 4.78, -5.4, interiors);
    // basin cabinet
    box(2.6, 0.6, 0.7, M.matWalnut, 5.0, 4.18, -5.4, interiors);
    // tap
    cyl(0.018, 0.018, 0.25, M.matChrome, 5.0, 5.0, -5.6, interiors);
    cyl(0.018, 0.018, 0.18, M.matChrome, 5.0, 5.1, -5.45, interiors);
    // mirror
    box(0.03, 1.4, 1.6, M.matMirror, 5.0, 5.7, -6.6, interiors);
    // sconces on either side
    cyl(0.05, 0.05, 0.3, M.matBronzeDark, 4.0, 5.7, -6.6, interiors);
    cyl(0.05, 0.05, 0.3, M.matBronzeDark, 6.0, 5.7, -6.6, interiors);

    /* ===== STUDY (upper, north-east corner) ===== */
    // built-in walnut bookshelf running across back
    box(5.0, 2.2, 0.36, M.matWalnut, 5.0, 5.0, -1.5, interiors);
    // horizontal shelves visible
    for (let y = -0.9; y <= 0.9; y += 0.4) {
      box(4.9, 0.04, 0.34, M.matWalnut, 5.0, 5.0 + y, -1.55, interiors);
      // books on this shelf
      const shelfBooks = 16;
      for (let b = 0; b < shelfBooks; b++) {
        const tones = [0x4a3424, 0x8a6a4a, 0xc4b89a, 0xa07050, 0x2a2018, 0xb89a78];
        const w = 0.12 + Math.random()*0.06;
        box(w, 0.32, 0.22,
          M.matBookSpine(tones[(((y*10+b)|0) % tones.length + tones.length) % tones.length]),
          5.0 - 2.3 + b*0.29 + (Math.random()-0.5)*0.02,
          5.0 + y + 0.18, -1.50, interiors);
      }
    }
    // study desk (walnut + leather)
    box(2.0, 0.04, 1.0, M.matWalnut, 5.2, 4.05, 0.6, interiors);
    box(0.04, 0.78, 1.0, M.matBlack, 4.3, 3.66, 0.6, interiors);
    box(0.04, 0.78, 1.0, M.matBlack, 6.1, 3.66, 0.6, interiors);
    box(2.0, 0.04, 0.5, M.matLeather, 5.2, 4.08, 0.4, interiors);
    // desk lamp (articulated)
    cyl(0.04, 0.05, 0.05, M.matBronzeDark, 5.8, 4.10, 0.3, interiors); // base
    box(0.03, 0.3, 0.03, M.matBronzeDark, 5.8, 4.25, 0.3, interiors);  // post
    box(0.18, 0.05, 0.10, M.matBronzeDark, 5.8, 4.40, 0.4, interiors); // shade
    // study chair
    box(0.55, 0.06, 0.55, M.matLeather, 5.2, 3.5, 1.0, interiors);
    box(0.55, 0.7, 0.06, M.matLeather, 5.2, 3.9, 1.25, interiors);
    box(0.04, 0.5, 0.04, M.matBlack, 4.95, 3.25, 0.8, interiors);
    box(0.04, 0.5, 0.04, M.matBlack, 5.45, 3.25, 0.8, interiors);

    /* ===== HOME THEATRE (basement-feel, deep interior left back) ===== */
    // create a small alcove screen (visible from journey camera at theatre stop)
    // theatre is set behind the back wall — visible only at the theatre chapter
    // To keep it realistic, we'll render it in a separate offset position:
    // We'll place it OUTSIDE the villa box, accessed via camera path going around back
    const theatre = new THREE.Group();
    theatre.position.set(0, 0, -16);  // behind villa
    scene.add(theatre);
    // dark room
    box(8, 3.2, 6, new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.9 }),
        0, 1.6, 0, theatre);
    // big screen (emissive)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x88a3c0, emissive: 0x4a6688, emissiveIntensity: 1.6, roughness: 0.4,
    });
    box(5.6, 2.4, 0.08, screenMat, 0, 1.7, -2.95, theatre);
    registry.theatreScreen = screenMat;
    // theatre lounge seating (modular)
    box(5.6, 0.6, 1.4, M.matLeather, 0, 0.5, 1.8, theatre);
    box(5.6, 0.6, 0.4, M.matLeather, 0, 0.85, 2.45, theatre);
    box(5.6, 0.6, 1.4, M.matLeather, 0, 0.5, 0.0, theatre);
    box(5.6, 0.6, 0.4, M.matLeather, 0, 0.85, 0.65, theatre);
    // acoustic panels on walls
    for (let i = -1; i <= 1; i++) {
      box(0.05, 1.6, 1.2,
        new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95 }),
        -3.96, 1.6, i * 1.4, theatre);
      box(0.05, 1.6, 1.2,
        new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95 }),
        3.96, 1.6, i * 1.4, theatre);
    }
    // soft uplighting (emissive strips at floor)
    const theatreStrip = box(7.6, 0.04, 0.08, M.matEmberWarm.clone(), 0, 0.04, -2.7, theatre);
    theatreStrip.material.emissiveIntensity = 0.8;
    registry.soffits.push(theatreStrip);
    // theatre point light (low key, blueish from screen)
    const theatreLight = new THREE.PointLight(0x88aacc, 0.6, 14, 2);
    theatreLight.position.set(0, 2, 0); theatre.add(theatreLight);

    return interiors;
  }

  /* ============================================================
     LANDSCAPE — vegetation, gate area
     ============================================================ */
  function buildLandscape(scene, M, lowFi) {
    const land = new THREE.Group(); scene.add(land);

    // PALM — slim trunk + fronds
    function palm(x, z, scale = 1, seed = 0) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.13, 5.2, 8),
        M.matTrunk
      );
      trunk.position.y = 2.6; trunk.castShadow = true;
      // segment rings
      for (let s = 0; s < 8; s++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.11, 0.014, 4, 12),
          M.matFoliageDark
        );
        ring.rotation.x = Math.PI/2;
        ring.position.y = 0.4 + s*0.55;
        g.add(ring);
      }
      g.add(trunk);
      const fronds = 10;
      for (let i = 0; i < fronds; i++) {
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 2.8, 4, 1, true),
          M.matFoliage
        );
        frond.position.y = 5.1;
        const a = (i / fronds) * Math.PI * 2 + seed;
        const tilt = 0.6 + Math.sin(i + seed) * 0.15;
        frond.rotation.z = Math.cos(a) * tilt;
        frond.rotation.x = Math.sin(a) * tilt;
        frond.position.x = Math.cos(a) * 0.5;
        frond.position.z = Math.sin(a) * 0.5;
        frond.position.y += Math.cos(a) * 0.3;
        frond.castShadow = true;
        g.add(frond);
      }
      // coconuts
      for (let i = 0; i < 3; i++) {
        const co = new THREE.Mesh(
          new THREE.SphereGeometry(0.10, 8, 6),
          M.matFoliageDark
        );
        const a = i * 2.2 + seed;
        co.position.set(Math.cos(a)*0.18, 4.95, Math.sin(a)*0.18);
        g.add(co);
      }
      g.position.set(x, 0, z); g.scale.setScalar(scale);
      land.add(g);
      return g;
    }

    const palms = [];
    palms.push(palm(-14, 10, 1.05, 0.0));
    palms.push(palm(-17, 4, 1.0, 0.5));
    palms.push(palm(14, 10, 1.1, 1.0));
    palms.push(palm(18, 3, 0.95, 1.4));
    palms.push(palm(-19, -10, 0.9, 2.1));
    palms.push(palm(19, -10, 1.0, 2.6));
    palms.push(palm(-11, 17, 1.2, 3.1));
    palms.push(palm(11, 17, 1.15, 3.6));
    palms.push(palm(-12, 30, 1.0, 4.2));
    palms.push(palm(12, 30, 1.05, 4.7));
    if (!lowFi) {
      palms.push(palm(-23, 18, 0.85, 5.1));
      palms.push(palm(23, 18, 0.85, 5.6));
      palms.push(palm(-7, 32, 0.95, 6.0));
      palms.push(palm(7, 32, 0.95, 6.4));
    }

    // OLIVE-like hedge boxes along driveway
    for (let i = 0; i < 7; i++) {
      const hedge = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.9, 1.4),
        M.matFoliage
      );
      hedge.position.set(-4.6, 0.45, 14 + i*3.5);
      hedge.castShadow = true; land.add(hedge);
      const h2 = hedge.clone(); h2.position.x = 4.6; land.add(h2);
    }

    // Bushes / shrubs around villa
    for (let i = 0; i < 18; i++) {
      const radius = 9 + Math.random()*8;
      const ang = Math.random() * Math.PI * 2;
      const x = Math.cos(ang) * radius, z = Math.sin(ang) * radius;
      // skip in front (pool area)
      if (z > 4 && Math.abs(x) < 9) continue;
      const r = 0.5 + Math.random()*0.7;
      const sh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 7, 5),
        Math.random() < 0.5 ? M.matFoliage : M.matFoliageDark
      );
      sh.position.set(x, r * 0.7, z);
      sh.castShadow = true; land.add(sh);
    }

    // Cypresses (slim columnar)
    for (let i = 0; i < 5; i++) {
      const cy = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 4.5, 8),
        M.matFoliageDark
      );
      cy.position.set(-12 + i*6, 2.25, -10);
      land.add(cy);
    }

    return { palms, group: land };
  }

  window.VitaraBuild = {
    buildArchitecture, buildInteriors, buildLandscape,
  };
})();
