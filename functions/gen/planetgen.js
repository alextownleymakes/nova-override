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

function capInnerOrbits(aList, aMax, maxInner = 2, innerEdgeAU = 1.0) {
    const sorted = [...aList].sort((a, b) => a - b);

    const innerIdx = [];
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] < innerEdgeAU) innerIdx.push(i);
        else break;
    }

    // already fine
    if (innerIdx.length <= maxInner) return sorted;

    // Keep the smallest maxInner inside 1 AU
    const keep = sorted.slice(0, maxInner);
    const rest = sorted.slice(maxInner);

    // For the rest, resample anything that is < 1 AU into [1..aMax] log-uniform
    const out = [...keep];

    for (let i = 0; i < rest.length; i++) {
        let a = rest[i];
        if (a < innerEdgeAU) a = sampleLogUniform(innerEdgeAU, aMax);

        out.push(a);
    }

    out.sort((a, b) => a - b);

    // Enforce global spacing so we don't create collisions after pushes
    return enforceGlobalSpacing(out, 1.22, aMax);
}

function sampleLogUniform(lo, hi) {
    const logLo = Math.log10(lo);
    const logHi = Math.log10(hi);
    return Math.pow(10, logLo + Math.random() * (logHi - logLo));
}

function enforceGlobalSpacing(sorted, minRatio, aMax) {
    if (!sorted.length) return [];
    const out = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        let a = sorted[i];
        const prev = out[out.length - 1];
        if (a / prev < minRatio) a = prev * minRatio;
        if (a <= aMax) out.push(a);
    }
    return out;
}

function sampleSemimajorAxesAU(star, desiredCount) {
    const aMin = 0.15;
    const aMax = Math.max(0.5, star.gravitylock ?? 50);

    // If the system is small, just do one band
    if (aMax < 2.5) return spacedBand(aMin, aMax, desiredCount, 1.35, 1.9);

    // Define bands
    const innerMax = Math.min(0.8, aMax * 0.22);
    const midMax = Math.min(8.0, aMax * 0.65);

    const bands = [
        { lo: aMin, hi: innerMax, kind: "inner" },
        { lo: innerMax, hi: midMax, kind: "mid" },
        { lo: midMax, hi: aMax, kind: "outer" },
    ].filter(b => b.hi > b.lo * 1.05); // keep only meaningful bands

    // Allocate counts (guarantee some outer when possible)
    let nInner = Math.round(desiredCount * 0.45);
    let nMid = Math.round(desiredCount * 0.35);
    let nOuter = desiredCount - nInner - nMid;

    if (aMax >= 8) nOuter = Math.max(nOuter, 2);        // ✅ guarantee outer presence
    if (aMax >= 20) nOuter = Math.max(nOuter, 3);

    // Rebalance to total
    while (nInner + nMid + nOuter > desiredCount) {
        if (nInner > 1) nInner--;
        else if (nMid > 1) nMid--;
        else nOuter--;
    }
    while (nInner + nMid + nOuter < desiredCount) nMid++;

    const out = [];

    // Inner: tighter spacing
    if (bands.find(b => b.kind === "inner") && nInner > 0) {
        const b = bands.find(b => b.kind === "inner") || bands[0];
        out.push(...spacedBand(b.lo, b.hi, nInner, 1.25, 1.7));
    }

    // Mid: moderate spacing
    if (bands.find(b => b.kind === "mid") && nMid > 0) {
        const b = bands.find(b => b.kind === "mid") || bands[0];
        out.push(...spacedBand(b.lo, b.hi, nMid, 1.35, 2.0));
    }

    // Outer: wider spacing
    if (bands.find(b => b.kind === "outer") && nOuter > 0) {
        const b = bands.find(b => b.kind === "outer") || bands[bands.length - 1];
        out.push(...spacedBand(b.lo, b.hi, nOuter, 1.6, 2.6));
    }

    out.sort((a, b) => a - b);

    // Final global spacing pass so bands don't collide
    return enforceGlobalSpacing(out, 1.22, aMax);
}

// Generate N orbits in [lo, hi] with multiplicative spacing
function spacedBand(lo, hi, n, ratioMin, ratioMax) {
    if (n <= 0) return [];
    if (n === 1) return [sampleLogUniform(lo, hi)];

    // Start near the band low end (log-uniform), then grow by ratio
    let a = sampleLogUniform(lo, Math.min(hi, lo * 3));
    const out = [a];

    for (let i = 1; i < n; i++) {
        const ratio = ratioMin + Math.random() * (ratioMax - ratioMin);
        a = a * ratio;

        // If we overshoot band, place remaining points log-uniform in remaining space
        if (a >= hi) {
            const remaining = n - i;
            if (remaining <= 0) break;
            const tail = sampleLogUniformArray(out[out.length - 1] * 1.15, hi, remaining);
            out.push(...tail);
            break;
        }

        out.push(a);
    }

    // clamp into band and sort
    return out.map(x => Math.max(lo, Math.min(hi, x))).sort((a, b) => a - b);
}

function enforceGlobalSpacing(sorted, minRatio, aMax) {
    if (!sorted.length) return [];
    const out = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        let a = sorted[i];
        const prev = out[out.length - 1];
        if (a / prev < minRatio) a = prev * minRatio;
        if (a <= aMax) out.push(a);
    }
    return out;
}

function sampleLogUniform(lo, hi) {
    const logLo = Math.log10(lo);
    const logHi = Math.log10(hi);
    const u = Math.random();
    return Math.pow(10, logLo + u * (logHi - logLo));
}

function sampleLogUniformArray(lo, hi, n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(sampleLogUniform(lo, hi));
    arr.sort((a, b) => a - b);
    return arr;
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

function generatePlanetOrbitOffset(planetParams, index) {
    // aAU is already physically generated by planetgen
    const aAU = planetParams.aAU;

    // stable orbital phase per planet
    const theta = Math.random() * Math.PI * 2;

    // small inclination tilt (gives slight y-axis variance)
    const inc = (planetParams.incDeg || 0) * Math.PI / 180;

    // convert AU → IGU
    const rIGU = aAU * AU_TO_IGU;

    const x = (Math.cos(theta) * rIGU);
    const y = (Math.sin(theta) * rIGU * Math.cos(inc));

    return { x, y, theta };
}

function enforceRegionalSpacing(sorted, aMax) {
  if (!sorted.length) return [];

  const out = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    let a = sorted[i];
    const prev = out[out.length - 1];

    // tighter spacing inside 1 AU
    const minRatio = (prev < 1.0) ? 1.6 : 1.25;

    if (a / prev < minRatio) a = prev * minRatio;

    if (a <= aMax) out.push(a);
  }

  return out;
}

function enforceInnerAbsoluteSpacing(sorted, aMax, innerEdgeAU = 1.0, minDeltaAU = 0.3) {
  if (!sorted.length) return [];
  const out = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    let a = sorted[i];
    const prev = out[out.length - 1];

    // If we're still inside the inner zone, enforce absolute spacing
    if (prev < innerEdgeAU) {
      if (a - prev < minDeltaAU) a = prev + minDeltaAU;
    } else {
      // Outside 1 AU, use a gentler ratio rule
      const minRatio = 1.25;
      if (a / prev < minRatio) a = prev * minRatio;
    }

    if (a <= aMax) out.push(a);
  }

  return out;
}


// --- main export ---
function generatePlanetParamsForStar(star, opts = {}) {
    // Ensure chemistry exists
    const chem = star.chemistry ?? chemistrySim(star);

    // Decide number of planets from solids budget
    const solidsEM = solidsBudgetEarthMass(chem, star.mass);

    // Roughly, systems end up with 3–12 planets
    const baseCount = clamp(Math.floor(3 + Math.random() * 7 + log10(solidsEM + 1)), 3, 12);

    const aMax = Math.max(0.5, star.gravitylock ?? 50);

    let aList = sampleSemimajorAxesAU(star, baseCount);

    // ✅ cap inner planets
    aList = capInnerOrbits(aList, aMax, 2, 1.0);

    // ✅ sort before using/logging
    aList = enforceRegionalSpacing(aList, aMax);
    aList = enforceInnerAbsoluteSpacing(aList, aMax, 1.0, 0.3);

    aList.sort((a, b) => a - b);



    console.log("aList AFTER cap:", aList.filter(a => a < 1), aList);


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
