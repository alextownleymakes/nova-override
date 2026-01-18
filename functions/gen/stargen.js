const SOLAR = {
  Teff: 5772,          // K
  L: 1,                // L☉
  R: 1,                // R☉
  age: 4.57e9,         // yr
};

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function log10(x) { return Math.log(x) / Math.LN10; }

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
  if (T >= 7500)  return "A";
  if (T >= 6000)  return "F";
  if (T >= 5200)  return "G";
  if (T >= 3700)  return "K";
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

// --- Classes ---


class Star extends Body {
  constructor(x, y, initialMass, metallicityZ, ageYears) {
    super(x, y, initialMass);

    // fundamental inputs
    this.initialMass = initialMass;   // M☉
    this.metallicity = metallicityZ;  // Z
    this.age = ageYears;              // years

    // derived
    this.phase = "protostar";
    this.currentMass = initialMass;

    this.luminosity = 0;   // L☉
    this.temperature = 0;  // K
    this.spectralType = "";

    this.habitableZone = { inner: 0, outer: 0 }; // AU
    this.snowLine = 0; // AU

    this.body = "Star";

    this.x = Math.random() * 1000;
    this.y = Math.random() * 1000;

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

    // environment for planets
    this.habitableZone = habitableZoneAU(this.luminosity);
    this.snowLine = snowLineAU(this.luminosity);
  }
}

function generateStar() {
    const star = new Star(0, 0, sampleInitialMassMilkyWay({ mMax: 50 }), sampleMetallicityZ(), sampleAgeYears());
    // Additional star property calculations can be added here
    return star;
}

