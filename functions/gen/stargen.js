// @ts-check

const SOLAR = {
  Teff: 5772,          // K
  L: 1,                // L☉
  R: 1,                // R☉
  age: 4.57e9,         // yr
  C_O: 0.55,
  Mg_Si: 1.05,
  Fe_Mg: 0.9
};

// --- Samplers (simple defaults) ---

// Kroupa IMF sampler (Milky Way–like by number)
// dN/dM ∝ M^-alpha
// alpha = 1.3 for 0.08–0.5 Msun, alpha = 2.3 for 0.5–mMax Msun

function sampleInitialMassMilkyWay({ mMin = 0.08, mBreak = 0.5, mMax = 50 } = {}) {
  const a1 = 1.3;
  const a2 = 2.3;

  // Integral of M^-a from lo..hi (a != 1)
  const integral = (lo, hi, a) => (Math.pow(hi, 1 - a) - Math.pow(lo, 1 - a)) / (1 - a);

  const w1 = integral(mMin, mBreak, a1);
  const w2 = integral(mBreak, mMax, a2);
  const u = Math.random() * (w1 + w2);

  if (u < w1) {
    // Invert CDF in segment 1
    const base = Math.pow(mMin, 1 - a1) + u * (1 - a1);
    return Math.pow(base, 1 / (1 - a1));
  } else {
    // Invert CDF in segment 2
    const x = u - w1;
    const base = Math.pow(mBreak, 1 - a2) + x * (1 - a2);
    return Math.pow(base, 1 / (1 - a2));
  }
}

function sampleMetallicityZ() {
  // Sample Z (mass fraction of "metals") roughly around solar (~0.014),
  // log-normal spread; clamp to plausible range.
  const solarZ = 0.014;
  // Box-Muller
  const u1 = Math.random(), u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // N(0,1)
  const dex = 0.3 * z; // ~0.3 dex spread
  const Z = solarZ * Math.pow(10, dex);
  return clamp(Z, 1e-5, 0.05);
}

function sampleAgeYears() {
  // Age in years (0 to 13.8 Gyr) uniform for now
  return Math.random() * 13.8e9;
}

// --- Stellar approximations (good enough for gameplay + coherence) ---
function mainSequenceLifetimeYears(M) {
  // Rough scaling: ~10 Gyr * M^-2.5 (valid-ish for ~0.5-10 M☉)
  return 1e10 * Math.pow(M, -2.5);
}

function remnantType(Minit) {
  if (Minit < 8) return "white_dwarf";
  if (Minit < 20) return "neutron_star";
  return "black_hole";
}

function whiteDwarfMass(Minit) {
  // crude initial-final mass relation
  return clamp(0.45 + 0.1 * (Minit - 1), 0.17, 1.35);
}

function neutronStarMass() {
  // typical NS mass distribution is narrow; keep simple
  return 1.4;
}

function blackHoleMass(Minit) {
  // highly uncertain; placeholder: fraction of initial mass
  return clamp(0.1 * Minit + 3, 3, 30);
}

function msLuminosity(M) {
  // piecewise-ish mass-luminosity relation, L in L☉
  if (M < 0.43) return 0.23 * Math.pow(M, 2.3);
  if (M < 2.0) return Math.pow(M, 4.0);
  if (M < 20) return 1.5 * Math.pow(M, 3.5);
  return 32000 * M; // very rough
}

function msRadius(M) {
  // R in R☉ (rough)
  if (M < 1) return Math.pow(M, 0.8);
  return Math.pow(M, 0.57);
}

function msTeffFromLR(L, R) {
  // Stefan-Boltzmann: L ~ R^2 T^4 => T ~ (L/R^2)^(1/4)
  return SOLAR.Teff * Math.pow(L / (R * R), 0.25);
}

function spectralTypeFromTeff(T) {
  if (T >= 30000) return "O";
  if (T >= 10000) return "B";
  if (T >= 7500) return "A";
  if (T >= 6000) return "F";
  if (T >= 5200) return "G";
  if (T >= 3700) return "K";
  return "M";
}

function habitableZoneAU(L) {
  // quick conservative-ish: inner/outer scales with sqrt(L)
  const s = Math.sqrt(L);
  return { inner: 0.95 * s, outer: 1.67 * s };
}

function snowLineAU(L) {
  // common rule of thumb: ~2.7 AU * sqrt(L)
  return 2.7 * Math.sqrt(L);
}

function initialCompositionFromZ(Z) {
  // Simple: X + Y + Z = 1, with Y increasing mildly with Z
  // Y = Yp + dY/dZ * Z; take Yp ~0.248, dY/dZ ~ 1.4
  const Yp = 0.248;
  const Y = clamp(Yp + 1.4 * Z, 0.24, 0.40);
  const X = clamp(1 - Y - Z, 0.55, 0.76);
  return { H: X, He: Y, metals: Z };
}

// Returns max stable planetary orbit radius in AU
// 50 AU for a 1-solar-mass star
function maxPlanetOrbitAU(star) {
  const M = Math.max(0.1, Number(star.mass) || 1);
  const result = 50 * Math.cbrt(M);
  console.log('max planet orbit AU', result);
  return result;
}


// --- Classes ---


class Star extends Body {
  constructor(x, y, initialMass, metallicityZ, ageYears) {
    super(x, y, initialMass);

    this.id = universe.useBodyCount();
    // fundamental inputs
    this.initialMass = initialMass;   // M☉
    this.metallicity = metallicityZ;  // Z
    this.age = ageYears;              // years
    this.gravitylock = 0;

    // derived
    this.phase = "protostar";
    this.currentMass = initialMass;

    this.luminosity = 0;   // L☉
    this.temperature = 0;  // K
    this.spectralType = "";

    this.habitableZone = { inner: 0, outer: 0 }; // AU
    this.snowLine = 0; // AU

    this.type = "Star";

    this.x = Math.random() * 10000;
    this.y = Math.random() * 10000;

    this.setxy = ({ x, y }) => {
      const layers = zoomFactors.length;
      for (let i = 0; i < layers; i++) {
        const z = zoomFactors[i];
        this.coords[i] = { x: x * z, y: y * z };
      }
    };

    this.updateDerived();
  }

  updateDerived() {
    const M = this.initialMass;
    const Z = this.metallicity;

    const tMS = mainSequenceLifetimeYears(M);

    if (this.age < 1e6) {
      this.phase = "protostar";
      this.currentMass = M; // ignore accretion for now
      // crude protostar placeholders
      this.luminosity = msLuminosity(M) * 0.3;
      this.radius = msRadius(M) * 2.0;

      // radius distance is measured in R☉
      // wait no that  makes no sense because R☉ is not not a measurement of distance
      // au is a distance, miles is a distance, lightyears is a distance but not R☉
      // so to find out how many miles it is, we multiply R☉ by the number of miles in R☉
      // which is 695700 miles
      // so if we have a radius of 2 R☉, that is 2 * 695700 = 1,391,400 miles
      // which is 1,391,400 / 5280 = 263.56 AU
      // 1 R☉ in 

      this.temperature = msTeffFromLR(this.luminosity, this.radius);
    } else if (this.age <= tMS) {
      this.phase = "main_sequence";
      this.currentMass = M; // fusion mass-loss negligible here
      this.luminosity = msLuminosity(M) * (1 + 0.4 * (this.age / tMS)); // brightens with age
      this.radius = msRadius(M) * (1 + 0.15 * (this.age / tMS));
      this.temperature = msTeffFromLR(this.luminosity, this.radius);
    } else {
      // remnant (skipping giant branches for simplicity)
      const type = remnantType(M);
      this.phase = type;

      if (type === "white_dwarf") {
        this.currentMass = whiteDwarfMass(M);
        this.luminosity = 0.001;  // varies with cooling; placeholder
        this.radius = 0.012;      // ~Earth size in R☉
        this.temperature = 8000;  // placeholder cooling value
      } else if (type === "neutron_star") {
        this.currentMass = neutronStarMass();
        this.luminosity = 1e-5;
        this.radius = 2e-5;       // ~10 km in R☉
        this.temperature = 1e6;   // surface can be ~10^5-10^6 K early; placeholder
      } else {
        this.currentMass = blackHoleMass(M);
        this.luminosity = 0;      // unless accreting; ignore for now
        this.radius = 0;          // you can store Schwarzschild radius separately
        this.temperature = 0;
      }

    }

    this.mass = this.currentMass;
    this.spectralType = spectralTypeFromTeff(this.temperature);
    this.chemicalComposition = initialCompositionFromZ(Z);
    this.gravitylock = maxPlanetOrbitAU(this);

    // environment for planets
    this.habitableZone = habitableZoneAU(this.luminosity);
    this.snowLine = snowLineAU(this.luminosity);
    this.chemistry = chemistrySim(this);
    this.planetParams = generatePlanetParamsForStar(this);
    const newCoords = determineStarCoords(this);
    // console.log('star coords', newCoords);
    this.setxy(newCoords);

    this.bodies = this.bodies || [];
    for (const pp of this.planetParams) {
      console.log('aAU: ', pp.aAU)
      const planet = new Planet(this, pp, universe, zoomFactors);
      const orbit = generatePlanetOrbitOffset(pp);
      planet.orbit = orbit;
      const baseX = this.coords[0].x + orbit.x;
      const baseY = this.coords[0].y + orbit.y;

      planet.setxy({ x: baseX, y: baseY });
      this.bodies.push(planet);
      universe.bodies.push(planet); // if you want planets globally
    }
  }
}

function generateStar() {
  const star = new Star(0, 0, sampleInitialMassMilkyWay({ mMax: 50 }), sampleMetallicityZ(), sampleAgeYears());
  // Additional star property calculations can be added here
  return star;
}

// determineStarCoords(star, universe) -> {x, y} in WORLD UNITS
// - Defines 1 GU as the Sun<->Proxima distance in your game scale (default: 22688 units)
// - On first run, computes & sets universe.radius (in GU) based on universe.starCount
// - Places stars inside a CIRCLE centered at (0,0), denser toward the center
// - Enforces a minimum separation based on radius-from-center -> expected GU spacing,
//   with a 25% tolerance (min = 0.75 * expected)
//
// Assumptions about `universe`:
// - universe.starCount (preferred) OR universe.stars.length OR universe.bodies.length
// - existing stars live in universe.stars or universe.bodies and have {x,y} in world units
// - optional: universe.setradius(r) setter; otherwise universe.radius is set directly
//
// Assumptions about stars:
// - your star instance has setxy({x,y}) and will store x/y in world units

function determineStarCoords(star) {
  // console.log(universe);
  const GU_TO_UNITS = Number(universe.guUnit ?? 22688); // your 60s travel distance

  // --- helpers ---
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // piecewise log interpolation through:
  // 1% -> 0.1 GU, 50% -> 1 GU, 100% -> 10 GU
  function expectedSpacingGU(frac) {
    const f = clamp(frac, 0.01, 1.0);
    if (f <= 0.5) {
      const t = (f - 0.01) / (0.5 - 0.01);
      const logy = lerp(Math.log10(0.1), Math.log10(1.0), t);
      return Math.pow(10, logy);
    } else {
      const t = (f - 0.5) / (1.0 - 0.5);
      const logy = lerp(Math.log10(1.0), Math.log10(10.0), t);
      return Math.pow(10, logy);
    }
  }

  // biased toward center; bigger exponent = more central density
  function sampleRadiusGU(R) {
    const exponent = Number(universe.densityExponent ?? 2.2);
    return R * Math.pow(Math.random(), exponent);
  }

  // get existing star list
  const pool =
    (Array.isArray(universe.bodies) && universe.bodies) ||
    [];

  // --- Step 1: ensure universe.radius (in GU) exists ---
  if (!universe.radius) {
    const N =
      Number(universe.starCount) ||
      pool.length ||
      0;
    // Projected density heuristic:
    // If density is ~1 star / GU^2, then R ≈ sqrt(N / pi).
    // Multiply by a loosen factor so large N isn't impossibly packed.
    const loosen = Number(universe.radiusLoosen ?? 1.35);
    let R = Math.sqrt(Math.max(1, N) / Math.PI) * loosen;

    // Guarantee enough room for the outer spacing idea (10 GU-ish outer region)
    console.log('universe radius (GU)', R);
    R = Math.max(12, R);
    if (typeof universe.setRadius === "function") universe.setRadius(R);
    else universe.radius = R;
  }

  const radiusGU = Number(universe.radius);

  // --- Steps 2–5: sample coords until they satisfy min-distance rule ---
  const MAX_ATTEMPTS = Number(universe.maxPlacementAttempts);
  const tolerance = 0.25; // ±25% => min is 75%
  const baseMinFactor = 1 - tolerance; // 0.75

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Step 2: random point in circle, dense toward center
    const rGU = sampleRadiusGU(radiusGU);
    const theta = Math.random() * Math.PI * 2;

    const xGU = rGU * Math.cos(theta);
    const yGU = rGU * Math.sin(theta);

    // Step 3: compute expected spacing from center distance, then min allowed
    const frac = rGU / radiusGU;
    let expectedGU = expectedSpacingGU(frac);

    // optional: add some randomness within your ±25% tolerance band
    // (keeps it from feeling grid-like)
    const jitter = 1 + (Math.random() * 2 - 1) * tolerance; // [0.75..1.25]
    expectedGU *= jitter;

    let minDistGU = expectedGU * baseMinFactor; // the "LOWEST tolerance limit"

    // If galaxy is extremely dense, you can allow graceful relaxation after many fails
    if (attempt > 1500) minDistGU *= 0.95;
    if (attempt > 3000) minDistGU *= 0.90;

    // Step 3: check for violations vs existing stars
    let ok = true;
    for (let i = 0; i < pool.length; i++) {
      const b = pool[i];
      if (!b) continue;

      // optional: only check stars if your universe includes other body types
      if (b.type && b.type !== "Star") {
        // if you don't label bodies, comment this block out
      }

      const bx = Number(b.x);
      const by = Number(b.y);
      if (!Number.isFinite(bx) || !Number.isFinite(by)) continue;

      const bxGU = bx / GU_TO_UNITS;
      const byGU = by / GU_TO_UNITS;

      const dx = bxGU - xGU;
      const dy = byGU - yGU;
      const d2 = dx * dx + dy * dy;

      if (d2 < minDistGU * minDistGU) {
        ok = false;
        break;
      }
    }

    // Step 5: return if passes
    if (ok) {
      return { x: xGU * GU_TO_UNITS, y: yGU * GU_TO_UNITS };
    }
  }

  // Fallback: if it's too dense to satisfy constraints, return something anyway.
  // (Better than infinite loop.)
  const fallbackTheta = Math.random() * Math.PI * 2;
  const fallbackRGU = sampleRadiusGU(radiusGU);
  return {
    x: fallbackRGU * Math.cos(fallbackTheta) * GU_TO_UNITS,
    y: fallbackRGU * Math.sin(fallbackTheta) * GU_TO_UNITS
  };
}
