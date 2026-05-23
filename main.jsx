/* ============================================================
   VITARA — Main app
   Single fixed WebGL villa canvas behind the entire journey.
   ScrollTrigger drives camera through 14 chapter stops.
   Day → golden → dusk → night phase progresses with scroll.
   ============================================================ */
const { useEffect: ue, useState: us, useRef: ur } = React;

function VillaCanvasHost({ villaApiRef, phaseRef }) {
  const hostRef = ur(null);

  ue(() => {
    if (!hostRef.current || !window.VitaraVilla) return;
    const api = window.VitaraVilla.init(hostRef.current);
    villaApiRef.current = api;

    let lastY = -1;
    function onScroll() {
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      const hero = document.getElementById('hero');
      const journey = document.getElementById('journey');
      const portfolio = document.getElementById('portfolio');
      if (!hero || !journey || !portfolio) return;

      // Map full hero+journey scroll → camera path 0..1
      const startY = 0;
      const endY = journey.offsetTop + journey.offsetHeight - window.innerHeight * 0.8;
      let p = (y - startY) / (endY - startY);
      p = Math.max(0, Math.min(1, p));
      api.setProgress(p);

      // Day-night phase: starts at 0.1 in hero, sweeps to 1.0 by end of journey
      const phaseStart = 0;
      const phaseEnd = endY;
      let phase = (y - phaseStart) / (phaseEnd - phaseStart);
      phase = Math.max(0, Math.min(1, phase));
      api.setDayPhase(phase);
      phaseRef.current = phase;

      // Fade canvas out as we enter portfolio (bone bg below covers it anyway,
      // but reduce GPU work after exit)
      const fadeStartY = portfolio.offsetTop - window.innerHeight * 0.5;
      const fadeEndY   = portfolio.offsetTop;
      let fade = (y - fadeStartY) / (fadeEndY - fadeStartY);
      fade = Math.max(0, Math.min(1, fade));
      hostRef.current.style.opacity = String(1 - fade);
      window.VitaraAudio?.setPhase(phase);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      api.destroy();
    };
  }, []);

  return <div id="villa-canvas" ref={hostRef}></div>;
}

function Hero() {
  return (
    <section id="hero" className="hero" data-screen-label="01 Hero">
      <div className="hero__year">@2026 · vitara residences · est. mmxiv</div>
      <div className="hero__type">Vitara</div>
      <div className="hero__stat">
        <div className="n">014</div>
        <div className="l">Residences composed · 2014—2026</div>
      </div>
      <div className="chips">
        <div className="chip"><span className="dot"></span>Studio open · Bengaluru</div>
        <div className="chip">2026 commissions · 3 of 9 remaining</div>
        <div className="chip">Journal № 47 · Now Reading</div>
      </div>
      <div className="hero__caption">
        <div className="eyebrow">Residence № 014 · Casa Travertine</div>
        <div className="h">A house begins as a long, patient conversation with the site.</div>
        <div className="p">Scroll to walk in. Vitara is a residential design studio composing private homes from site to switch — a single team, from first sketch to final scene.</div>
      </div>
      <div className="hero__scrollcue">
        <span>scroll to enter</span>
        <div className="line"></div>
        <span>14 chapters</span>
      </div>
    </section>
  );
}

function Journey({ setActiveIdx }) {
  const chapters = window.VITARA_DATA.chapters;
  const ref = ur(null);

  ue(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    const ctx = gsap.context(() => {
      // Parallax oversized roman type per chapter
      document.querySelectorAll('[data-parallax-type]').forEach((el) => {
        gsap.fromTo(el, { xPercent: 10 }, {
          xPercent: -30,
          ease: "none",
          scrollTrigger: { trigger: el.closest('.chapter'), start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      // Reveal chapter copy with subtle zoom + fade
      document.querySelectorAll('.chapter').forEach((el, i) => {
        const copy = el.querySelector('.chapter__copy');
        const idx = el.querySelector('.chapter__index');
        const shot = el.querySelector('.chapter__shot');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 75%", end: "top 30%", scrub: 0.4 }
        });
        if (copy) tl.fromTo(copy, { opacity: 0, y: 80, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', ease: "power3.out" }, 0);
        if (idx) tl.fromTo(idx, { opacity: 0, x: -20 }, { opacity: 1, x: 0 }, 0.05);
        if (shot) tl.fromTo(shot, { opacity: 0, x: 20 }, { opacity: 1, x: 0 }, 0.05);

        // Exit fade
        gsap.to([copy, idx, shot].filter(Boolean), {
          opacity: 0, y: -40, filter: 'blur(6px)',
          scrollTrigger: { trigger: el, start: "bottom 60%", end: "bottom top", scrub: 0.6 }
        });
      });

      // Active chapter detection
      document.querySelectorAll('.chapter').forEach((el, i) => {
        window.ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          onEnter:     () => setActiveIdx(i),
          onEnterBack: () => setActiveIdx(i),
        });
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div id="journey" className="journey" ref={ref}>
      {chapters.map((c, i) => (
        <window.VitaraChapters.Chapter key={c.id} data={c} i={i} total={chapters.length} />
      ))}
    </div>
  );
}

function App() {
  const { CustomCursor, Nav, ChromeMeta, HUD, ChapterCounter, Preloader } = window.VitaraShell;
  const { Intro, Marquee, Portfolio, About, Services, Contact, Footer } = window.VitaraSections;

  const villaApiRef = ur(null);
  const phaseRef = ur(0);
  const [activeIdx, setActiveIdx] = us(null);
  const [soundOn, setSoundOn] = us(false);

  // Lenis smooth scroll
  ue(() => {
    if (!window.Lenis) return;
    const lenis = new window.Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.085,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap?.ticker.lagSmoothing(0);
    }
    return () => lenis.destroy();
  }, []);

  // Audio toggle
  ue(() => {
    if (soundOn) {
      window.VitaraAudio?.start();
      window.VitaraAudio?.setPhase(phaseRef.current || 0);
    } else {
      window.VitaraAudio?.stop();
    }
  }, [soundOn]);

  const chapters = window.VITARA_DATA.chapters;
  const inJourney = activeIdx != null;
  const activeName = inJourney ? chapters[activeIdx].roman : "";

  return (
    <>
      <Preloader />
      <div className="grain"></div>
      <div className="vignette"></div>
      <div className="aberration"></div>
      <div className="scanline"></div>

      <CustomCursor />
      <VillaCanvasHost villaApiRef={villaApiRef} phaseRef={phaseRef} />
      <Nav />
      <ChromeMeta />
      <HUD phaseRef={phaseRef} soundOn={soundOn} setSoundOn={setSoundOn} />
      <ChapterCounter activeIdx={inJourney ? activeIdx : null} name={activeName} />

      <Hero />
      <Intro />
      <Marquee />
      <Journey setActiveIdx={setActiveIdx} />
      <Portfolio />
      <About />
      <Services />
      <Contact />
      <Footer />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
