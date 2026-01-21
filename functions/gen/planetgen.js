// @ts-check

// functions/gen/planetgen.js
// Generates planet parameters for a given star using star.chemistry (from chemistrySim).
// Output: array of planet params objects -> feed into new Planet(star, params)


// --- tiny utils ---


function randn() {
  return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(TAU * Math.random());
}

// --- mass/radius helpers (game-friendly, not a full EOS) ---
function rockyRadiusRE(mEarth) {
  // Rough mass-radius scaling for rocky planets
  // R ~ M^0.27 (works okay 0.1–10 M⊕)
  return Math.pow(Math.max(0.05, mEarth), 0.27);
}

function subNeptuneRadiusRE(mEarth) {
  // Puffy: add an envelope effect
  // Simple heuristic: 1.8–4 R⊕ for ~2–20 M⊕
  const base = 1.6 * Math.pow(Math.max(0.5, mEarth), 0.22);
  return clamp(base + randn() * 0.3, 1.6, 5.0);
}

function gasGiantRadiusRJ(mJup) {
  // Giants are ~1 RJ across a wide mass range; slight inflation for hot giants
  return clamp(0.9 + 0.15 * randn(), 0.7, 1.3);
}

function densityFromType(type, massEarth, radiusEarth, waterFrac, coreFrac) {
  // crude densities in g/cc, adjusted by water/envelope
  // This is intentionally simplified for gameplay.
  let base;
  if (type === "rocky") base = 5.2;
  else if (type === "iron_rich") base = 6.8;
  else if (type === "water_world") base = 2.8;
  else if (type === "ice") base = 1.8;
  else if (type === "dwarfGas") base = 3.0;
  else if (type === "ice_giant") base = 1.6;
  else if (type === "gas_giant") base = 1.2;
  else base = 3.0;

  // water lowers density, core raises it
  base *= (1 - 0.5 * clamp(waterFrac, 0, 0.9));
  base *= (1 + 0.35 * clamp(coreFrac - 0.3, -0.2, 0.5));

  // small random natural scatter
  base *= 1 + randn() * 0.07;

  return clamp(base, 0.5, 12.0);
}

// --- disk chemistry / formation heuristics ---
function solidsBudgetEarthMass(starChem, starMassSolar) {
  // Convert disk dust mass (in M☉) to Earth masses:
  // 1 M☉ ~ 332,946 M⊕
  const M_SUN_TO_EARTH = 332946;
  const dust = Math.max(0, starChem.disk?.dustMass ?? 0);
  const solids = dust * M_SUN_TO_EARTH;

  // Efficiency factor: not all solids become planets
  // Higher-mass disks / higher metallicity -> slightly higher efficiency
  const eff = clamp(0.10 + 0.06 * randn() + 0.05 * Math.log10(Math.max(1e-6, dust) / 1e-4), 0.05, 0.35);

  return Math.max(0.5, solids * eff);
}

function sampleSemimajorAxesAU(star, count) {
  // Generate log-spaced-ish orbits with jitter, biased to more inner planets
  // Then enforce minimum separation.
  const aMin = 0.03; // ~hot orbit lower bound
  const aMax = Math.max(0.5, star.gravitylock ?? 50); // your max stable orbit AU
  const logMin = log10(aMin);
  const logMax = log10(aMax);

  const raw = [];
  for (let i = 0; i < count * 6; i++) {
    // bias toward inner region: square u
    const u = Math.pow(Math.random(), 1.7);
    const a = pow10(lerp(logMin, logMax, u));
    raw.push(a);
  }
  raw.sort((a, b) => a - b);

  // enforce spacing: simple multiplicative ratio
  const out = [];
  const minRatio = 1.25; // tune for packed/loose systems
  for (let i = 0; i < raw.length && out.length < count; i++) {
    const a = raw[i];
    if (!out.length) {
      out.push(a);
      continue;
    }
    if (a / out[out.length - 1] >= minRatio) out.push(a);
  }

  // if we failed to fill, expand ratio tolerance
  while (out.length < count) {
    const last = out[out.length - 1] ?? aMin;
    const a = last * rand(1.18, 1.6);
    if (a <= aMax) out.push(a);
    else break;
  }

  return out;
}

function classifyByZone(aAU, chem) {
  const { silicateLineAU, snowLineAU, carbonLineAU, goldilocksAU } = chem.zones;

  const insideSilicate = aAU < silicateLineAU;
  const insideSnow = aAU < snowLineAU;
  const beyondSnow = aAU >= snowLineAU && aAU < carbonLineAU;
  const far = aAU >= carbonLineAU;

  const inHZ = goldilocksAU ? (aAU >= goldilocksAU.inner && aAU <= goldilocksAU.outer) : false;

  return { insideSilicate, insideSnow, beyondSnow, far, inHZ };
}

function sampleCoreAndWaterFractions(zone, ratios) {
  // core fraction mainly from Fe/Mg tendency
  const feMg = clamp(ratios.Fe_Mg ?? 0.9, 0.5, 1.4);
  let coreFrac = clamp(0.28 + 0.18 * (feMg - 0.9) + randn() * 0.05, 0.15, 0.65);

  // water/volatile depends primarily on formation beyond snow line
  let waterFrac = 0.0;
  if (zone.beyondSnow) waterFrac = clamp(0.2 + 0.25 * Math.random() + randn() * 0.08, 0.05, 0.75);
  if (zone.far) waterFrac = clamp(0.4 + 0.35 * Math.random() + randn() * 0.1, 0.15, 0.9);
  if (zone.insideSnow) waterFrac = clamp(0.01 + 0.04 * Math.random() + randn() * 0.02, 0.0, 0.15);

  // carbon-rich disks shift rock/ice boundaries slightly (simple effect)
  const cO = clamp(ratios.C_O ?? 0.55, 0.3, 1.2);
  if (cO > 0.8 && zone.insideSnow) {
    // more reduced chemistry -> slightly lower water retention inside snow line
    waterFrac *= 0.7;
    coreFrac = clamp(coreFrac + 0.03, 0.15, 0.7);
  }

  return { coreFrac, waterFrac };
}

function decidePlanetType(mEarth, zone, ratios) {
  const cO = clamp(ratios.C_O ?? 0.55, 0.3, 1.2);

  // basic mass thresholds
  if (mEarth < 0.15) return "rocky"; // tiny rock
  if (mEarth < 2.0) {
    if (zone.insideSilicate) return "iron_rich";
    if (zone.inHZ && zone.insideSnow) return "rocky";
    if (!zone.insideSnow) return "ice";
    return (cO > 0.85 && zone.insideSnow) ? "rocky" : "rocky";
  }

  // super-earth / sub-neptune band
  if (mEarth < 10) {
    if (zone.insideSnow) return "dwarfGas";      // Venus-ish / mini-Neptune-ish
    return "water_world";                        // often volatile-rich if formed beyond snow line
  }

  // ice giant / gas giant candidates
  if (mEarth < 40) return "ice_giant";
  return "gas_giant";
}

function applyMigration(aAU, type, chem, star) {
  // Very simplified migration model:
  // - gas/ice giants tend to migrate inward; chance increases with disk gas mass
  // - super-earths can drift inward slightly
  const gasMass = chem.disk?.gasMass ?? 0;
  const gasNorm = clamp(gasMass / (0.05 * star.mass), 0, 2); // normalize around 5% M*
  const pStrong = clamp(0.15 + 0.25 * gasNorm + randn() * 0.05, 0, 0.8);

  let aFinal = aAU;

  if (type === "gas_giant" || type === "ice_giant") {
    if (Math.random() < pStrong) {
      // migrate toward inner disk by factor 2–30x
      const factor = rand(2, 30);
      aFinal = Math.max(0.03, aAU / factor);
    } else {
      // mild drift
      aFinal = Math.max(0.05, aAU / rand(1.1, 2.5));
    }
  } else if (type === "dwarfGas" || type === "water_world") {
    if (Math.random() < 0.35 * gasNorm) aFinal = Math.max(0.05, aAU / rand(1.1, 3.0));
  }

  return aFinal;
}

// --- main export ---
function generatePlanetParamsForStar(star, opts = {}) {
  // Ensure chemistry exists
  const chem = star.chemistry ?? chemistrySim(star);

  // Decide number of planets from solids budget
  const solidsEM = solidsBudgetEarthMass(chem, star.mass);

  // Roughly, systems end up with 3–12 planets
  const baseCount = clamp(Math.floor(3 + Math.random() * 7 + log10(solidsEM + 1)), 3, 12);

  // sample semimajor axes
  const aList = sampleSemimajorAxesAU(star, baseCount);

  // allocate masses from solids budget with a decreasing distribution
  let remaining = solidsEM;

  const params = [];
  for (let i = 0; i < aList.length; i++) {
    const aAU0 = aList[i];
    const zone = classifyByZone(aAU0, chem);

    // sample planet mass
    // inner planets tend smaller; beyond snow line can grow bigger cores
    const zoneBoost = zone.insideSnow ? 1.0 : (zone.beyondSnow ? 2.2 : 1.6);
    const massGuess = clamp(pow10(rand(-0.7, 1.3)) * zoneBoost, 0.05, 700); // ~0.2–20 typical, with tail

    const mEarth = clamp(Math.min(massGuess, remaining * rand(0.08, 0.28)), 0.05, remaining);
    remaining = Math.max(0, remaining - mEarth);
    if (mEarth <= 0.04) break;

    const { coreFrac, waterFrac } = sampleCoreAndWaterFractions(zone, chem.elementRatios);
    const type0 = decidePlanetType(mEarth, zone, chem.elementRatios);
    const aFinal = applyMigration(aAU0, type0, chem, star);

    // if migrated inside snow line, reduce water fraction (lost volatiles / different accretion)
    let waterFinal = waterFrac;
    if (aFinal < chem.zones.snowLineAU) waterFinal *= 0.35;

    // radius + density
    let radiusEarth = 1;
    let radiusJup = null;

    if (type0 === "gas_giant") {
      const mJ = mEarth / 317.8;
      radiusJup = gasGiantRadiusRJ(mJ);
      radiusEarth = radiusJup * 11.21;
    } else if (type0 === "ice_giant") {
      radiusEarth = clamp(subNeptuneRadiusRE(mEarth), 2.2, 6.0);
    } else if (type0 === "dwarfGas" || type0 === "water_world") {
      radiusEarth = clamp(subNeptuneRadiusRE(mEarth), 1.6, 5.0);
    } else {
      radiusEarth = clamp(rockyRadiusRE(mEarth), 0.3, 2.3);
    }

    const density = densityFromType(type0, mEarth, radiusEarth, waterFinal, coreFrac);

    // atmosphere fraction heuristic
    let atmFrac = 0.0;
    if (type0 === "dwarfGas") atmFrac = clamp(0.01 + 0.04 * Math.random(), 0.0, 0.08);
    if (type0 === "ice_giant") atmFrac = clamp(0.08 + 0.10 * Math.random(), 0.05, 0.25);
    if (type0 === "gas_giant") atmFrac = clamp(0.70 + 0.20 * Math.random(), 0.6, 0.95);

    params.push({
      id: `${star.id}-p${i + 1}`,
      starId: star.id,

      // orbit / placement
      aAU: aFinal,
      aAU_initial: aAU0,
      e: clamp(Math.abs(randn()) * 0.08, 0, 0.35),
      incDeg: clamp(Math.abs(randn()) * 1.5, 0, 8),

      // bulk properties
      type: type0,
      massEarth: mEarth,
      radiusEarth,
      radiusJup,
      density_gcc: density,

      // composition-ish
      coreFrac,
      waterFrac: clamp(waterFinal, 0, 0.95),
      atmosphereFrac: atmFrac,

      // formation metadata (useful later)
      formedInZone: zone,
      migrated: aFinal !== aAU0,
      chemistry: {
        C_O: chem.elementRatios.C_O,
        Mg_Si: chem.elementRatios.Mg_Si,
        Fe_Mg: chem.elementRatios.Fe_Mg
      }
    });

    if (remaining < solidsEM * 0.08) break;
  }

  return params;
}
