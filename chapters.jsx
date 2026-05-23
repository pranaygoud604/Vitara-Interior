/* ============================================================
   VITARA — Chapter (transparent overlay; canvas behind)
   ============================================================ */
function Chapter({ data, i, total }) {
  return (
    <section
      className={"chapter chapter--" + data.id}
      data-screen-label={String(i + 1).padStart(2, "0") + " " + data.type}
      data-chapter-index={i}
    >
      <div className="chapter__roman" data-parallax-type>{data.roman}</div>

      <div className="chapter__index">
        <span>{data.index}</span>
        <span>{data.eyebrow}</span>
      </div>

      <div className="chapter__shot">
        <div className="row"><span>plate</span> {data.index}</div>
        <div className="row"><span>lat</span> {data.lat}</div>
        <div className="row"><span>lon</span> {data.lon}</div>
        <div className="row"><span>35mm</span> ƒ2.0</div>
      </div>

      <div className="chapter__copy">
        <div className="chapter__eyebrow"><span className="dot"></span><span>Chapter {data.index} / {total} · {data.eyebrow}</span></div>
        <h3 className="chapter__title">{data.title}</h3>
        <p className="chapter__text">{data.text}</p>
        <div className="chapter__specs">
          {data.specs.map((s, j) => (
            <div key={j} className="spec">
              <div className="l">{s.l}</div>
              <div className="v">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.VitaraChapters = { Chapter };
