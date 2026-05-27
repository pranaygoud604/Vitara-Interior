/* ============================================================
   VITARA — Ambient Audio (WebAudio synth, no external files)
   Wind (filtered noise) + birdsong pulses + water shimmer.
   Faded by time-of-day phase.
   ============================================================ */
window.VitaraAudio = (function () {
  let ctx, master, windFilter, windGain, waterGain, nightGain, birdGain, insectGain;
  let started = false;
  let insectTimer = null;

  function start() {
    if (started) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);

      // ---- Wind: pink-ish noise → bandpass ----
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf; noise.loop = true;

      windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass'; windFilter.frequency.value = 380; windFilter.Q.value = 0.6;
      windGain = ctx.createGain(); windGain.gain.value = 0.55;
      noise.connect(windFilter).connect(windGain).connect(master);
      noise.start();

      // Slow LFO on windFilter freq for breathing
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(windFilter.frequency);
      lfo.start();

      // ---- Water shimmer: high band pulses ----
      const waterNoise = ctx.createBufferSource();
      waterNoise.buffer = noiseBuf; waterNoise.loop = true;
      const waterFilter = ctx.createBiquadFilter();
      waterFilter.type = 'highpass'; waterFilter.frequency.value = 2200;
      waterGain = ctx.createGain(); waterGain.gain.value = 0.0;
      waterNoise.connect(waterFilter).connect(waterGain).connect(master);
      waterNoise.start();

      // ---- Night ambience: low drone ----
      const drone = ctx.createOscillator();
      drone.type = 'sine'; drone.frequency.value = 55;
      const drone2 = ctx.createOscillator();
      drone2.type = 'sine'; drone2.frequency.value = 82.5;
      nightGain = ctx.createGain(); nightGain.gain.value = 0.0;
      drone.connect(nightGain); drone2.connect(nightGain); nightGain.connect(master);
      drone.start(); drone2.start();

      // ---- Night insects (cricket trill) ----
      insectGain = ctx.createGain(); insectGain.gain.value = 0.0; insectGain.connect(master);
      function cricket() {
        if (!ctx) return;
        const now = ctx.currentTime;
        // Tight cluster of fast 4–6kHz blips
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 4200 + Math.random()*800;
        const tremolo = ctx.createOscillator();
        tremolo.frequency.value = 24 + Math.random() * 14;
        const tremGain = ctx.createGain(); tremGain.gain.value = 0.12;
        tremolo.connect(tremGain).connect(g.gain);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.04, now + 0.05);
        g.gain.linearRampToValueAtTime(0.001, now + 0.4 + Math.random()*0.3);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 4800; bp.Q.value = 18;
        o.connect(bp).connect(g).connect(insectGain);
        o.start(now); tremolo.start(now);
        o.stop(now + 0.7); tremolo.stop(now + 0.7);
        insectTimer = setTimeout(cricket, 600 + Math.random() * 1400);
      }
      cricket();

      // ---- Birdsong pulses (subtle) ----
      birdGain = ctx.createGain(); birdGain.gain.value = 0.0; birdGain.connect(master);
      function chirp() {
        if (!ctx) return;
        const now = ctx.currentTime;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(1800 + Math.random()*1400, now);
        o.frequency.exponentialRampToValueAtTime(2200 + Math.random()*1800, now + 0.08);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        o.connect(g).connect(birdGain);
        o.start(now); o.stop(now + 0.2);
        setTimeout(chirp, 1200 + Math.random() * 4500);
      }
      chirp();

      // fade master up
      master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.6);
      started = true;
    } catch (e) { console.warn('audio init failed', e); }
  }

  function stop() {
    if (!ctx || !master) return;
    try {
      master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
      setTimeout(() => { ctx?.close(); ctx = null; started = false; if (insectTimer) clearTimeout(insectTimer); }, 800);
    } catch (e) {}
  }

  function setPhase(p) {
    if (!ctx) return;
    p = Math.max(0, Math.min(1, p));
    // Wind eases off at night (less wind, more drone)
    if (windGain)  windGain.gain.value  = 0.55 * (1 - p * 0.5);
    if (waterGain) waterGain.gain.value = Math.min(1, Math.max(0, (p - 0.3))) * 0.06;
    if (nightGain) nightGain.gain.value = Math.max(0, p - 0.55) * 0.05;
    if (birdGain)  birdGain.gain.value  = (1 - p) * 0.35;
    if (insectGain) insectGain.gain.value = Math.max(0, p - 0.6) * 1.0;
  }

  return { start, stop, setPhase, isStarted: () => started };
})();
