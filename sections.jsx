/* ============================================================
   VITARA — Sections: Intro, Marquee, Portfolio (tilt),
                       About, Services, Contact, Footer
   ============================================================ */
function Intro() {
  return (
    <section id="intro" className="intro" data-screen-label="Intro">
      <div className="intro__eyebrow">Studio Note · A residence is a long act of attention</div>
      <h2 className="intro__h">
        We design <em>private homes</em><br/>
        as <span className="roman">complete</span> <em>instruments</em> —<br/>
        from <em>site</em> to <em>switch.</em>
      </h2>
      <div className="intro__row">
        <p>Vitara is a residential design studio working at the intersection of architecture, interiors, landscape and light. We accept a small number of private commissions each year and remain on site through the final scene.</p>
        <div className="col-meta">Since 2014<span className="n">014</span>Completed residences across India, Europe and the Gulf.</div>
        <div className="col-meta">Average lead time<span className="n">22<span style={{fontSize:'.4em', verticalAlign:'super', letterSpacing:'.18em'}}>mo</span></span>From first sketch to handover, with one principal.</div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = ["Interiors", "Exteriors", "Villas", "Landscapes", "Renovation", "Turnkey", "Smart Homes", "Private Commissions"];
  const line = <span>{words.map((w, i) => <span key={i}>{w}</span>)}</span>;
  return (
    <div className="marquee">
      <div className="marquee__track">{line}{line}{line}</div>
    </div>
  );
}

/* ---------- 3D-tilt portfolio card ---------- */
function ProjCard({ p }) {
  const ref = React.useRef(null);
  function onMove(e) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * 8;
    const ry = (x - 0.5) * 10;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    el.style.setProperty('--mx', (x * 100) + '%');
    el.style.setProperty('--my', (y * 100) + '%');
  }
  function onLeave() {
    const el = ref.current; if (!el) return;
    el.style.transform = "rotateX(0deg) rotateY(0deg)";
  }
  return (
    <a ref={ref} className={"proj proj--" + p.size} data-cursor="Enter" href={"#proj-" + p.idx}
       onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className={"proj__plate " + p.tone}>
        <div className="plate-room">
          <div className="arch">
            <div className="mullion m1"></div>
            <div className="mullion m2"></div>
            <div className="mullion-h"></div>
          </div>
          <div className={"silhouette " + p.plate}></div>
        </div>
      </div>
      <div className="proj__shine"></div>
      <div className="proj__overlay"></div>
      <div className="proj__index">№ {p.idx} / {p.tag}</div>
      <div className="proj__tag">{p.tag}</div>
      <div className="proj__meta">
        <div>
          <div className="title">{p.title}</div>
          <div className="sub">{p.sub.map((s, j) => <span key={j}>{s}</span>)}</div>
        </div>
        <div className="arr">↗</div>
      </div>
    </a>
  );
}
function Portfolio() {
  const projs = window.VITARA_DATA.projects;
  return (
    <section id="portfolio" className="portfolio" data-screen-label="Portfolio">
      <div className="section__head">
        <div>
          <div className="eyebrow">Selected Work · 014 residences</div>
          <h2 className="h">Houses we<br/><em>still visit.</em></h2>
        </div>
        <div className="meta">Index 01 — 05<strong>{projs.length}/14</strong>shown of total</div>
      </div>
      <div className="proj-grid">
        {projs.map((p, i) => <ProjCard key={i} p={p} />)}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="about" data-screen-label="Studio">
      <h2 className="about__quote">
        <em>“</em>A home should be the<br/>most quiet, the most certain<br/>thing a person owns.<em>”</em>
        <span className="small">— Mira Sundaram, Founding Principal · Bengaluru, 2014</span>
      </h2>
      <div className="about__row">
        <div className="about__portrait">
          <div className="stripe-bg"></div>
          <div className="silhouette"></div>
          <div className="label"><span>Portrait // M. Sundaram</span><span>2026</span></div>
        </div>
        <div className="about__story">
          <p>Vitara began with a single commission — a private residence above the Arabian Sea, completed across thirty-one months of slow refinement. The studio has since worked on a deliberately small number of homes each year, never more than nine.</p>
          <p>We are architects, interior designers, landscape architects, lighting designers, joiners and project leaders, working from three small studios. Every Vitara project is staffed by a principal-led team of seven — the same team, from first sketch to final scene.</p>
          <p>We do not publish more than we build. We accept a short list of new commissions each year, by introduction.</p>
          <div className="about__stats">
            <div className="s"><div className="n">12y</div><div className="l">In practice</div></div>
            <div className="s"><div className="n">3</div><div className="l">Studios</div></div>
            <div className="s"><div className="n">9 / yr</div><div className="l">Commissions</div></div>
            <div className="s"><div className="n">7</div><div className="l">Per project</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = window.VITARA_DATA.services;
  return (
    <section id="services" className="services" data-screen-label="Services">
      <div className="section__head">
        <div>
          <div className="eyebrow">Practice · Seven disciplines, one team</div>
          <h2 className="h"><em>A complete</em><br/>residence,<br/><em>handed over.</em></h2>
        </div>
        <div className="meta">Disciplines<strong>07</strong>coordinated under one principal</div>
      </div>
      <div>
        {items.map((s, i) => (
          <div key={i} className="svc" data-cursor="Open">
            <div className="n">{s.n}</div>
            <div className="name">{s.name}</div>
            <div className="desc">{s.desc}</div>
            <div className="arr">→</div>
            <div className="svc__expand">{s.expand} →</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  const [type, setType] = React.useState("Villa");
  const [budget, setBudget] = React.useState("$1.5–3M");
  const [timeline, setTimeline] = React.useState("18–24 mo");

  const types = ["Villa", "Penthouse", "Apartment", "Renovation", "Landscape", "Smart Home"];
  const budgets = ["< $500k", "$500k–1.5M", "$1.5–3M", "$3–6M", "$6M+"];
  const timelines = ["< 12 mo", "12–18 mo", "18–24 mo", "24–36 mo", "Open"];

  return (
    <section id="contact" className="contact" data-screen-label="Contact">
      <h2 className="contact__h">Begin a residence.<br/><em>A consultation,<br/>by introduction.</em></h2>
      <div className="contact__grid">
        <form className="contact__form" onSubmit={e => { e.preventDefault(); alert("Thank you — we'll be in touch within 48 hours.");}}>
          <div className="field"><label>Your name</label><input placeholder="Mira Sundaram"/></div>
          <div className="field"><label>Email</label><input type="email" placeholder="you@residence.com"/></div>

          <div className="field field--full">
            <label>Project type</label>
            <div className="chips-row">
              {types.map(t => (
                <div key={t} className={"c " + (t === type ? "is-on" : "")} onClick={() => setType(t)} data-cursor="">{t}</div>
              ))}
            </div>
          </div>

          <div className="field"><label>Plot size</label><input placeholder="0.8 acres / 6,400 sqft"/></div>
          <div className="field"><label>Location</label><input placeholder="Bengaluru, Lisbon, Dubai…"/></div>

          <div className="field field--full">
            <label>Budget</label>
            <div className="chips-row">
              {budgets.map(b => (
                <div key={b} className={"c " + (b === budget ? "is-on" : "")} onClick={() => setBudget(b)} data-cursor="">{b}</div>
              ))}
            </div>
          </div>

          <div className="field field--full">
            <label>Timeline</label>
            <div className="chips-row">
              {timelines.map(t => (
                <div key={t} className={"c " + (t === timeline ? "is-on" : "")} onClick={() => setTimeline(t)} data-cursor="">{t}</div>
              ))}
            </div>
          </div>

          <div className="field field--full">
            <label>Notes</label>
            <textarea placeholder="A few lines about the home you imagine — site, aspirations, references."></textarea>
          </div>

          <div className="contact__submit">
            <div className="note">We respond personally within 48 hours. We accept 9 new residences each year.</div>
            <button className="contact__btn" type="submit" data-cursor="Send">Submit enquiry <span className="arr">↗</span></button>
          </div>
        </form>

        <aside className="contact__side">
          <div className="block"><div className="l">Studio · Bengaluru</div><div className="v"><a>14, Lavelle Mews</a><a>Karnataka, 560001</a></div></div>
          <div className="block"><div className="l">Studio · Lisbon</div><div className="v"><a>R. das Janelas Verdes 4</a></div></div>
          <div className="block"><div className="l">Studio · Dubai</div><div className="v"><a>City Walk · Building 7</a></div></div>
          <div className="block">
            <div className="l">Direct</div>
            <div className="v">
              <a href="mailto:residences@vitara.studio" data-cursor="Email">residences@vitara.studio</a>
              <a data-cursor="Call">+91 80 4912 0014</a>
            </div>
          </div>
          <div className="block">
            <div className="l">Channels</div>
            <div className="channels">
              <a data-cursor="">WhatsApp</a>
              <a data-cursor="">Telegram</a>
              <a data-cursor="">Instagram</a>
              <a data-cursor="">Journal</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" data-screen-label="Footer">
      <div className="footer__type">Vitara</div>
      <div className="footer__row">
        <div>Vitara Residential Studio · MMXXVI</div>
        <div className="legal"><span>Privacy</span><span>Press</span><span>Journal</span><span>Careers</span></div>
        <div>Composed in Bengaluru · Lisbon · Dubai</div>
      </div>
    </footer>
  );
}

window.VitaraSections = { Intro, Marquee, Portfolio, About, Services, Contact, Footer };
