/* ============================================================
   VITARA — Content & data (v3)
   17 chapters aligned to the 19-stop cinematic camera spline:
   Approach → Gate → Driveway → Entrance → Foyer → Living →
   Dining → Kitchen → Courtyard → Bedroom → Wardrobe →
   Bathroom → Balcony → Study → Theatre → Pool → Night
   (Aerial reveal opens; Aerial ending closes — both bookended
    by hero / post-journey scroll.)
   ============================================================ */
const VITARA_DATA = {
  brand: { name: "Vitara", tagline: "Residences Composed", year: "MMXXVI", based: "Bengaluru · Lisbon · Dubai" },

  chapters: [
    {
      id: "approach", index: "I", roman: "Approach", eyebrow: "Approach · 11:42 · Morning",
      type: "Exterior", lat: "12.97° N", lon: "77.59° E",
      title: "An arrival framed in travertine and shadow.",
      text: "The site is read before the home is. A long, low cantilever; reflective water resets the eye. Every approach is a slow exhalation.",
      specs: [{ l: "Plot",     v: "1.4 ac" }, { l: "Façade", v: "Travertine" }, { l: "Cantilever", v: "9.2m" }],
    },
    {
      id: "gate", index: "II", roman: "Gate", eyebrow: "Threshold · 11:48",
      type: "Gate", lat: "12.97° N", lon: "77.59° E",
      title: "A quiet act of permission.",
      text: "Two travertine pylons, slatted bronze, a single horizontal beam — the gate is the first sentence the house writes. Beyond it, paving begins.",
      specs: [{ l: "Pylons", v: "Travertine" }, { l: "Span", v: "10.6m" }, { l: "Access", v: "Biometric" }],
    },
    {
      id: "driveway", index: "III", roman: "Driveway", eyebrow: "Driveway · 11:54",
      type: "Driveway", lat: "Crushed Travertine", lon: "32m linear",
      title: "Forty paces of intention.",
      text: "Crushed travertine underfoot, hedge boxes left and right, the home held in perspective. Slow the pace; quiet the conversation.",
      specs: [{ l: "Length", v: "32m" }, { l: "Surface", v: "Travertine" }, { l: "Hedge", v: "Boxwood" }],
    },
    {
      id: "entrance", index: "IV", roman: "Entrance", eyebrow: "Threshold · 12:08",
      type: "Entrance", lat: "Pivot Door", lon: "Bronze · 4.8m",
      title: "A pause before the interior begins.",
      text: "A 4.8m pivot door, brushed bronze, opens onto a double-height vestibule. The first material met by hand decides the temperature of the rest of the home.",
      specs: [{ l: "Door", v: "4.8m" }, { l: "Pull", v: "Cast bronze" }, { l: "Soffit", v: "Backlit" }],
    },
    {
      id: "foyer", index: "V", roman: "Foyer", eyebrow: "Foyer · 12:14",
      type: "Foyer", lat: "Double-height", lon: "South Aspect",
      title: "The house holds you for a moment.",
      text: "A travertine threshold, a long oblique view through to the pool, a hand-blown alabaster pendant. The pause is intentional; nothing rushes here.",
      specs: [{ l: "Volume", v: "Double" }, { l: "Pendant", v: "Alabaster" }, { l: "Floor", v: "Travertine" }],
    },
    {
      id: "living", index: "VI", roman: "Living", eyebrow: "Living · 13:08 · Noon",
      type: "Living", lat: "Salon I", lon: "16.4m × 9.2m",
      title: "Spaces designed around emotion.",
      text: "The living plan unfolds in three depths: hearth, gathering, and view. Bouclé and saddle leather; walnut underfoot. The glass dissolves at noon.",
      specs: [{ l: "Ceiling", v: "3.8m" }, { l: "Glass", v: "Frameless" }, { l: "Floor", v: "Smoked Walnut" }],
    },
    {
      id: "dining", index: "VII", roman: "Dining", eyebrow: "Dining · 14:22",
      type: "Dining", lat: "Salon II", lon: "Seats 12",
      title: "A table is a quiet ceremony.",
      text: "A monolithic walnut table seats twelve under hand-blown amber pendants. The wine room is visible, never noisy.",
      specs: [{ l: "Table", v: "4.2m" }, { l: "Seats", v: "12" }, { l: "Cellar", v: "320 bot." }],
    },
    {
      id: "kitchen", index: "VIII", roman: "Kitchen", eyebrow: "Kitchen · 15:11",
      type: "Kitchen", lat: "Galley I", lon: "Chef's Range",
      title: "An instrument, played daily.",
      text: "Calacatta islands flank a chef's range; secondary kitchen pulls out of view on a steel sliding wall. Storage is engineered; sound is dampened.",
      specs: [{ l: "Stone", v: "Calacatta" }, { l: "Hood", v: "Recessed" }, { l: "Second", v: "Concealed" }],
    },
    {
      id: "courtyard", index: "IX", roman: "Courtyard", eyebrow: "Courtyard · 15:48",
      type: "Courtyard", lat: "West Cut", lon: "Open to sky",
      title: "A garden, held by the architecture.",
      text: "A single Khejri tree, a bed of river pebbles, a wash of soft afternoon light. The courtyard is the house's quietest room — the one without a roof.",
      specs: [{ l: "Tree", v: "Khejri" }, { l: "Ground", v: "Pebble" }, { l: "Wall", v: "Travertine" }],
    },
    {
      id: "bedroom", index: "X", roman: "Bedroom", eyebrow: "Master · 16:48 · Golden",
      type: "Bedroom", lat: "Level 02", lon: "South Aspect",
      title: "A room that ends the day softly.",
      text: "Plaster walls in raw umber, linen drapery floor to ceiling, brass picture lights. The bed faces east; the wardrobe runs the length of the south wall.",
      specs: [{ l: "Walls", v: "Tadelakt" }, { l: "Drape", v: "Belgian linen" }, { l: "Lighting", v: "Dim-to-warm" }],
    },
    {
      id: "wardrobe", index: "XI", roman: "Wardrobe", eyebrow: "Wardrobe · 17:02",
      type: "Wardrobe", lat: "West Wing", lon: "11.6m run",
      title: "The dressing room as a private library.",
      text: "Walnut joinery to 3.4m, integrated LED rails, a central island of leather and brass. Every drawer pulls without a handle; humidity is held at 48%.",
      specs: [{ l: "Runs", v: "11.6m" }, { l: "Wood", v: "Walnut" }, { l: "Humidity", v: "48%" }],
    },
    {
      id: "bathroom", index: "XII", roman: "Bathroom", eyebrow: "Bathroom · 17:36",
      type: "Bathroom", lat: "East Wing", lon: "Travertine",
      title: "Stone, water, and a long horizon.",
      text: "A travertine monolith holds the basin; the tub is carved from a single block. Rain, mist, and steam are programmed as moods, not modes.",
      specs: [{ l: "Tub", v: "Monolithic" }, { l: "Stone", v: "Travertine" }, { l: "Steam", v: "Programmed" }],
    },
    {
      id: "balcony", index: "XIII", roman: "Balcony", eyebrow: "Balcony · 18:14 · Dusk",
      type: "Balcony", lat: "Level 02", lon: "South Cantilever",
      title: "An edge between the home and the world.",
      text: "A 14m cantilever wraps the upper level. Glass balustrade vanishes from inside the room. Outdoor speakers tuned for soft conversation.",
      specs: [{ l: "Length", v: "14.0m" }, { l: "Rail", v: "Frameless" }, { l: "Floor", v: "IPE wood" }],
    },
    {
      id: "study", index: "XIV", roman: "Study", eyebrow: "Study · 18:48",
      type: "Study", lat: "East Mezzanine", lon: "Quiet aspect",
      title: "A small, certain place for thought.",
      text: "A wall of walnut shelving, an English-leather desk, a single brass task lamp. The window holds the cypress avenue; the door, when closed, closes the day.",
      specs: [{ l: "Shelves", v: "Walnut" }, { l: "Desk", v: "Leather" }, { l: "Books", v: "Owner's" }],
    },
    {
      id: "theatre", index: "XV", roman: "Theatre", eyebrow: "Home Theatre · 20:10",
      type: "Theatre", lat: "Lower Suite", lon: "5.6m screen",
      title: "A dark room for one bright image.",
      text: "A 5.6m projected screen; acoustic walnut panelling; modular leather seating for nine. Atmos overhead, isolated from the rest of the home.",
      specs: [{ l: "Screen", v: "5.6m" }, { l: "Audio", v: "Atmos 7.1.4" }, { l: "Seats", v: "9" }],
    },
    {
      id: "pool", index: "XVI", roman: "Pool", eyebrow: "Pool · 20:32",
      type: "Pool", lat: "South Terrace", lon: "22m × 6m",
      title: "Still water, holding the architecture.",
      text: "A 22m mirror pool runs the full elevation of the south façade. A negative edge releases to the lower terrace. Heated; saline; almost silent.",
      specs: [{ l: "Length", v: "22m" }, { l: "Edge", v: "Negative" }, { l: "Treatment", v: "Saline" }],
    },
    {
      id: "night", index: "XVII", roman: "Night", eyebrow: "Night · 21:14 · Lumen",
      type: "Night", lat: "Façade", lon: "1800K Low",
      title: "The home, scored for the dark.",
      text: "Six lighting scenes, each programmed to circadian rhythm. Façade lighting reads the architecture without illuminating it. Dim-to-warm to 1800K at midnight.",
      specs: [{ l: "Scenes", v: "6" }, { l: "Low", v: "1800K" }, { l: "Driver", v: "DALI" }],
    },
  ],

  projects: [
    { idx: "01", title: "Casa Travertine", sub: ["Villa", "Bengaluru", "9,400 sqft"], tag: "Built", tone: "tone-noon", plate: "facade", size: "lg" },
    { idx: "02", title: "House of Three Courtyards", sub: ["Residence", "Goa", "12,200 sqft"], tag: "2026", tone: "tone-amber", plate: "couch", size: "md" },
    { idx: "03", title: "Cantilever Above the Bay", sub: ["Villa", "Lisbon", "8,150 sqft"], tag: "Built", tone: "tone-mist", plate: "facade", size: "full" },
    { idx: "04", title: "Penthouse Marble & Moss", sub: ["Penthouse", "Mumbai", "6,700 sqft"], tag: "Built", tone: "tone-emerald", plate: "couch", size: "sq" },
    { idx: "05", title: "Desert House", sub: ["Villa", "Dubai", "14,800 sqft"], tag: "On site", tone: "tone-clay", plate: "facade", size: "sq" },
  ],

  services: [
    { n: "01", name: "Residential Interiors", desc: "Total interior architecture for primary residences — concept to handover, including custom joinery, finishes, lighting and FF&E.", expand: "Begin" },
    { n: "02", name: "Exterior Architecture",  desc: "Façade composition, massing studies, and site planning for new villas and ground-up residences.", expand: "Begin" },
    { n: "03", name: "Villa Design",           desc: "End-to-end villa design with on-site project leadership and material sourcing across Europe and Asia.", expand: "Begin" },
    { n: "04", name: "Heritage Renovation",    desc: "Sympathetic interventions for historic homes; structural, environmental, and material conservation.", expand: "Begin" },
    { n: "05", name: "Landscape & Garden",     desc: "Native planting strategies, reflection ponds, pool design, and outdoor living rooms.", expand: "Begin" },
    { n: "06", name: "Turnkey Execution",      desc: "Project management, procurement, and a single point of contact through occupancy. One key, one date.", expand: "Begin" },
    { n: "07", name: "Smart Home Integration", desc: "Lighting (DALI/Lutron), climate, acoustics, security, and AV — coordinated as a single quiet system.", expand: "Begin" },
  ],
};
window.VITARA_DATA = VITARA_DATA;
