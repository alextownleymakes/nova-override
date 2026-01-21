// functions/bodies/planet.js
// Planet extends Body and supports layered coords like your Star.

class Planet extends Body {
  constructor(star, params, universe, zoomFactors) {
    // We'll set x/y after we compute orbit position
    super(0, 0, params.massEarth);

    this.body = "Planet";
    this.id = params.id;
    this.starId = params.starId;
    this.star = star;

    // orbit
    this.aAU = params.aAU;
    this.e = params.e ?? 0;
    this.incDeg = params.incDeg ?? 0;
    this.theta = Math.random() * TAU; // mean anomaly-ish seed

    // physical
    this.type = params.type;
    this.massEarth = params.massEarth;
    this.radiusEarth = params.radiusEarth;
    this.density_gcc = params.density_gcc;

    // composition
    this.coreFrac = params.coreFrac;
    this.waterFrac = params.waterFrac;
    this.atmosphereFrac = params.atmosphereFrac;

    // metadata
    this.formedInZone = params.formedInZone;
    this.migrated = params.migrated;
    this.chemistry = params.chemistry;

    // layered coords
    this.coords = [];

    // helpers from your universe
    this._universe = universe;
    this._zoomFactors = zoomFactors;

    // initialize position (circular for now)
    this.updateWorldPosition(0);
  }

  auToUnits(au) {
    // If you already have a canonical AU->units, plug it here.
    // Fallback: derive from GU scale where Sol<->Proxima ≈ 268,000 AU.
    const GU_TO_UNITS = Number(this._universe?.guUnit ?? 22688);
    const AU_PER_GU = 268000; // your prior scale assumption
    const AU_TO_UNITS = Number(this._universe?.auUnit ?? (GU_TO_UNITS / AU_PER_GU));
    return au * AU_TO_UNITS;
  }

  orbitalPeriodSeconds() {
    // Kepler-ish: P^2 ∝ a^3 / M  (in years if a in AU, M in solar masses)
    // We'll convert years -> seconds with a game constant.
    const M = Math.max(0.1, Number(this.star?.mass ?? 1));
    const a = Math.max(0.01, this.aAU);
    const P_years = Math.sqrt((a * a * a) / M);

    // Choose a time scale for gameplay (tune this):
    const SECONDS_PER_YEAR_GAME = Number(this._universe?.secondsPerYear ?? 30);
    return P_years * SECONDS_PER_YEAR_GAME;
  }

  updateWorldPosition(dtSeconds) {
    const P = this.orbitalPeriodSeconds();
    const w = (P > 0) ? (TAU / P) : 0;

    this.theta = (this.theta + w * dtSeconds) % TAU;

    const rAU = this.aAU; // circular (you can add e later)
    const rUnits = this.auToUnits(rAU);

    // Star world position at current zoom band 0 is typically your "true" coords.
    // Use star.coords[0] if that's your base layer; otherwise star.x/y.
    const sx = (this.star?.coords?.[0]?.x ?? this.star?.x ?? 0);
    const sy = (this.star?.coords?.[0]?.y ?? this.star?.y ?? 0);

    const x = sx + Math.cos(this.theta) * rUnits;
    const y = sy + Math.sin(this.theta) * rUnits;

    this.setxy({ x, y });
  }

  setxy({ x, y }) {
    this.x = x;
    this.y = y;

    const layers = this._zoomFactors.length;
    for (let i = 0; i < layers; i++) {
      const z = this._zoomFactors[i];
      this.coords[i] = { x: x * z, y: y * z };
    }
  }
}
