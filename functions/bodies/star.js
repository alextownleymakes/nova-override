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
      // console.log('GL: ', pp.gravityLock)
      const planet = new Planet(this, pp, universe, zoomFactors);
      const orbit = generatePlanetOrbitOffset(pp);
      planet.orbit = orbit;
      planet.name = generateName("planet");
      const baseX = this.coords[0].x + orbit.x;
      const baseY = this.coords[0].y + orbit.y;

      planet.setxy({ x: baseX, y: baseY });
      this.bodies.push(planet);
      universe.bodies.push(planet); // if you want planets globally
    }
  }
}