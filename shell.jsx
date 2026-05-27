/* ============================================================
   VITARA — Shell: cursor, grain/vignette overlays, nav, meta,
                    HUD (time-of-day + sound), preloader,
                    chapter counter
   ============================================================ */
const { useEffect, useState, useRef } = React;

/* ---------- Custom cursor ---------- */
function CustomCursor() {
  useEffect(() => {
    if (window.matchMedia('(max-width: 860px)').matches) return;
    const dot = document.getElementById('cursor');
    const label = document.getElementById('cursor-label');
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    function onMove(e) { tx = e.clientX; ty = e.clientY; }
    function loop() {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      if (dot)   dot.style.transform   = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      if (label) label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    window.addEventListener('mousemove', onMove);
    loop();
    function onOver(e) {
      const t = e.target.closest('[data-cursor]'); if (!t) return;
      dot?.classList.add('cursor--lg');
      const txt = t.getAttribute('data-cursor');
      if (txt && label) { label.textContent = txt; label.classList.add('is-on'); }
    }
    function onOut(e) {
      const t = e.target.closest('[data-cursor]'); if (!t) return;
      dot?.classList.remove('cursor--lg');
      label?.classList.remove('is-on');
    }
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);
  return null;
}

/* ---------- Navigation ---------- */
function Nav() {
  const [active, setActive] = useState('Index');
  const [isLight, setLight] = useState(false);
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY + 48;
      const ids = ['hero','intro','journey','portfolio','about','services','contact'];
      const map = { hero:'Index', intro:'Studio', journey:'Residence', portfolio:'Work', about:'Studio', services:'Services', contact:'Contact' };
      let current = 'Index';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const t = el.offsetTop;
        if (y >= t && y < t + el.offsetHeight) { current = map[id]; break; }
      }
      setActive(current);
      // Light bg over intro/portfolio/services
      const lightIds = ['intro','portfolio','services'];
      const inLight = lightIds.some(id => {
        const el = document.getElementById(id); if (!el) return false;
        return y >= el.offsetTop && y < el.offsetTop + el.offsetHeight;
      });
      setLight(inLight);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = ['Index', 'Residence', 'Work', 'Studio', 'Services', 'Contact'];
  const hrefs = { Index:'#hero', Residence:'#journey', Work:'#portfolio', Studio:'#about', Services:'#services', Contact:'#contact' };
  return (
    <nav className={"nav " + (isLight ? "is-light" : "")}>
      <div className="nav__brand">Vitara<sup>™</sup></div>
      <div className="nav__links">
        {items.map(i => (
          <a key={i} href={hrefs[i]} className={"nav__link " + (active === i ? "is-active" : "")} data-cursor="">{i}</a>
        ))}
      </div>
      <a className="nav__cta" href="#contact" data-cursor="Begin">Begin a Residence →</a>
    </nav>
  );
}

/* ---------- Chrome meta + progress bar ---------- */
function ChromeMeta() {
  const barRef = useRef(null);
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, window.scrollY / h));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <>
      <div className="meta-tl">
        <div>Vitara<span> // est. 2014</span></div>
        <div>Bengaluru · Lisbon · Dubai</div>
      </div>
      <div className="meta-tr">
        <div><span>idx //</span> 014 residences</div>
        <div><span>built //</span> 2014 — 2026</div>
      </div>
      <div className="rail rail--l">vitara<span>//</span>residences<span>//</span>composed</div>
      <div className="rail rail--r">@2026<span>//</span>private commissions<span>//</span>introduction only</div>
      <div className="meta-b">
        <div>© Vitara <span>· All rooms reserved</span></div>
        <div className="progress">
          <span>journey //</span>
          <div className="progress__bar"><i ref={barRef}></i></div>
          <span>17 chapters</span>
        </div>
        <div>scroll<span> // to walk in</span></div>
      </div>
    </>
  );
}

/* ---------- HUD: time-of-day + sound toggle ---------- */
function HUD({ phaseRef, soundOn, setSoundOn }) {
  const [phaseLabel, setPhaseLabel] = useState("Morning · 11:42");
  useEffect(() => {
    let raf;
    function tick() {
      const p = phaseRef.current ?? 0;
      let label;
      if (p < 0.2) label = "Morning · 11:42";
      else if (p < 0.4) label = "Noon · 13:24";
      else if (p < 0.6) label = "Golden Hour · 17:38";
      else if (p < 0.8) label = "Dusk · 19:14";
      else label = "Night · 21:32";
      setPhaseLabel(label);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef]);
  return (
    <div className="hud">
      <div className="pill"><span className="dot"></span>{phaseLabel}</div>
      <div className={"pill " + (soundOn ? "is-on" : "")} onClick={() => setSoundOn(s => !s)} data-cursor={soundOn ? "Mute" : "Ambient"}>
        {soundOn
          ? <span className="eq"><i/><i/><i/></span>
          : <span style={{width: 12, height: 1, background: 'currentColor', display: 'inline-block', marginRight: 2 }}></span>}
        {soundOn ? "Ambient · On" : "Ambient · Off"}
      </div>
    </div>
  );
}

/* ---------- Floating chapter counter (lower-left, fixed) ---------- */
function ChapterCounter({ activeIdx, name }) {
  const total = (window.VITARA_DATA?.chapters?.length) || 17;
  return (
    <div className="chapter-counter" id="chapter-counter" style={{ opacity: activeIdx == null ? 0 : 1, transition: "opacity .6s" }}>
      <div className="lg">
        {String(Math.max(0, activeIdx || 0) + 1).padStart(2, "0")}
        <span className="sm">/ {String(total).padStart(2,"0")}</span>
      </div>
      <div className="name">{name}</div>
    </div>
  );
}

/* ---------- Preloader ---------- */
function Preloader() {
  useEffect(() => {
    const el = document.getElementById('preloader');
    if (!el) return;
    const t = setTimeout(() => el.classList.add('is-out'), 1800);
    return () => clearTimeout(t);
  }, []);
  return null;
}

window.VitaraShell = { CustomCursor, Nav, ChromeMeta, HUD, ChapterCounter, Preloader };
