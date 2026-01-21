// @ts-check


function sampleElementRatios(Z) {
    // metallicity offset
    const dex = Math.log10(Z / 0.014);

    // α-enhancement at low Z → Mg, Si higher
    const alphaBoost = clamp(-dex * 0.3, -0.3, 0.4);

    // sample distributions
    const C_O = clamp(0.55 + randn() * 0.1 - 0.05 * dex, 0.3, 1.2);
    const Mg_Si = clamp(1.05 + randn() * 0.25 + alphaBoost, 0.7, 1.8);
    const Fe_Mg = clamp(0.9 + randn() * 0.2 + 0.3 * dex, 0.5, 1.4);

    return { C_O, Mg_Si, Fe_Mg };
}

function randn() {
    return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

function chemistrySim(star) {
    const Z = star.metallicity;
    const L = star.luminosity;

    const goldilocks = habitableZoneAU(L);

    // Disk mass
    const diskGas = star.mass * (0.01 + Math.random() * 0.09);
    const diskDust = diskGas * (Z / 0.014);

    // Element ratios
    const ratios = sampleElementRatios(Z);

    // Thermal zones
    const silicate = 0.1 * Math.sqrt(L);
    const snow = 2.7 * Math.sqrt(L);
    const carbon = 10 * Math.sqrt(L);

    // Solid inventory
    const refractoryFraction = 1 / (1 + ratios.C_O);
    const iceFraction = snow > 0 ? 0.5 : 0;

    return {
        elementRatios: ratios,
        disk: {
            gasMass: diskGas,
            dustMass: diskDust
        },
        zones: {
            silicateLineAU: silicate,
            snowLineAU: snow,
            carbonLineAU: carbon,
            goldilocksAU: goldilocks,
        },
        solidFractions: {
            rock: refractoryFraction,
            ice: iceFraction,
            metal: ratios.Fe_Mg / (1 + ratios.Fe_Mg)
        }
    };
}
