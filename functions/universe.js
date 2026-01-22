//conversion rates:
// 1 gu = sol to proxima centauri distance, which is about 4.24 light years, or 22688 in-game units
// 1 gu = 22688 in-game units
// 1 au = earth to sun distance, which is about 93 million miles
// if 2.4ly = 1 gu (or 22688 IGU), and 1 au in lightyears is 0.00001581 ly, then 1au = 0.00001581 / 4.24 gu = 0.00000373 gu, or in IGU 1 au = 0.00000373 * 22688 = 0.0847 IGU
// 100 IGU in AU is 100 / 0.0847 = 1180.77 au
// meaning a ship is gravity locked to a star when within about 1180 au of it.
// 1180 AU is about 0.0187 light years, or about 1,170,000,000 miles
// that distance in the solar system is about 15 times the distance from the sun to pluto (which is about 39.5 au)
// in IGU, pluto would be 39.5 * 0.0847 = 3.34 IGU from the sun.
// 1 R☉ in IGU is 432690 miles / 93000000 miles = 0.00465 au * 0.0847 IGU = 0.000393955 IGU

const AU_MILES = 92955807;   // 1 AU in miles
const GU_TO_AU = (au) => au * 0.0847; // 1 gu = 0.142 au
const GU = 22688; // 1 gu = distance betwean sol and proxima centauri, but in game terms, it take 60 seconds to travel 1 gu - and that is 0 to 22688 in precisely 60 seconds at default speed.
const PX_SCALE = 10000;
const SUN_RADIUS_MILES = 432690; // Sun radius in miles
const SUN_RADIUS_AU = SUN_RADIUS_MILES / AU_MILES; // Sun radius in AU
const AU_TO_GALACTIC = (au) => au * 0.085; // 1 AU = 0.085 galactic units
const zoomFactors = [1, 1000, 10000, 10000, 20000]; // zoom levels
const GRAV_LOCK = 20;
const solarRadiiToIGU = (r) => r * SUN_RADIUS_AU * 0.0847; // convert solar radii to in-game units
const auToIGU = (au) => au * 0.0847; // convert AU to in-game units
const iguToAU = (igu) => igu / 0.0847; // convert in-game units to AU

const solToPCinLY = 4.24; // distance from sun to proxima centauri in light years
const solToPCinAU = 268332; // distance from sun to proxima centauri in AU
const solToPCinMI = 268332 * 92955807; // distance from sun to proxima centauri in miles
const oneLightYearInAU = solToPCinAU / solToPCinLY; // 1 light year in AU

//a function that takes any units in IGU and converts it to the largest whole UOM, either ly or au or miles
function iguToLargestUOM(igu) {
    const ly = igu / (solToPCinLY / GU);
    const au = iguToAU(igu);
    const miles = au * AU_MILES;

    if (ly >= 1) return Math.floor(ly) + " ly";
    if (au >= 1) return Math.floor(au) + " au";
    return Math.floor(miles) + " miles";
}

function starRadiusPx(star) {
    return AU_TO_GALACTIC(star.radius / AU_MILES);
}

function gravityLockPx_AU(star) {
    return (star.gravitylock * AU_MILES) / (PX_SCALE * 1000);
}

class Universe {
    constructor(starCount) {
        this.gravityConstant = 0.4;
        this.bodies = [];
        this.init = false;
        this.radius = 0;
        this.guUnit = GU;
        this.starCount = starCount;
        this.radiusLoosen = 1.35;
        this.bodycount = 0;
        this.zoomLevel = 0;
        this.densityExponent = 2.2;
        this.maxPlacementAttempts = 5000;
    }

    addBody(body) {
        this.bodies.push(body);
    }

    useBodyCount() {
        this.bodycount += 1;
        return this.bodycount;
    }

    genStars(starCount) {
        for (let i = 0; i < starCount; i++) {
            const star = generateStar();
            star.name = generateName('star');
            this.addBody(star);
        }
    }

    setRadius(r) {
        this.radius = r;
    }

    zoomIn() {
        this.zoomLevel = this.zoomLevel + 1;
    }

    zoomOut() {
        this.zoomLevel = this.zoomLevel - 1;
    }

    zoom(level) {
        this.zoomLevel = this.zoomLevel + level;
    }


    update(starCount = this.starCount) {

        if (!this.init) {
            this.genStars(starCount);
            this.init = true;
        }

        // Calculate gravitational forces between bodies
        // for (let i = 0; i < this.bodies.length; i++) {
        //     for (let j = i + 1; j < this.bodies.length; j++) {
        //         const bodyA = this.bodies[i];
        //         const bodyB = this.bodies[j];

        //         const dx = bodyB.x - bodyA.x;
        //         const dy = bodyB.y - bodyA.y;
        //         const distanceSq = dx * dx + dy * dy;
        //         const distance = Math.sqrt(distanceSq);

        //         if (distance === 0) continue; // Prevent division by zero

        //         const force = (this.gravityConstant * bodyA.mass * bodyB.mass) / distanceSq;
        //         const forceX = (force * dx) / distance;
        //         const forceY = (force * dy) / distance;

        //         bodyA.vx += forceX / bodyA.mass;
        //         bodyA.vy += forceY / bodyA.mass;
        //         bodyB.vx -= forceX / bodyB.mass;
        //         bodyB.vy -= forceY / bodyB.mass;
        //     }
        // }

        // Update positions based on velocities
        for (let body of this.bodies) {
            body.x += body.vx;
            body.y += body.vy;
        }
    }
}

function generateName(type) {
    // random generation of names based on type
    const starters = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'New ', 'Alpha ', 'Beta ', 'Omega ', 'Great ', 'The ']
    const prefixes = ['Zor', 'Xan', 'Vel', 'Kor', 'Lun', 'Sol', 'Aeg', 'Neb', 'Gal', 'Or'];
    const middles = ['', 'ta', 'ri', 'lo', 'ne', 'qu', 'za', 'fi', 'mu', 'xi', 've'];
    const suffixes = ['', 'on', 'ar', 'is', 'us', 'ea', 'ix', 'or', 'um', 'ax', 'en'];
    const tags = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ' Prime', ' Nova', ' I', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

    const planetPrefixes = ['Aqua', 'Terra', 'Ignis', 'Ventus', 'Lumen', 'Umbra', 'Stella', 'Nox', 'Vita', 'Mortis'];
    const planetMiddles = ['ria', 'lia', 'nia', 'tus', 'cus', 'mus', 'dus', 'rus', 'sus', 'lus'];
    const planetSuffixes = ['ia', 'ara', 'ora', 'una', 'es', 'is', 'os', 'um', 'ax', 'ex'];

    const names = {
        'star': { prefixes, middles, suffixes },
        'planet': { prefixes: planetPrefixes, middles: planetMiddles, suffixes: planetSuffixes },
    }
    const starter = starters[Math.floor(Math.random() * starters.length)];
    const prefix = names[type].prefixes[Math.floor(Math.random() * names[type].prefixes.length)];
    const middle = names[type].middles[Math.floor(Math.random() * names[type].middles.length)];
    const suffix = names[type].suffixes[Math.floor(Math.random() * names[type].suffixes.length)];
    const tag = tags[Math.floor(Math.random() * tags.length)];
    return starter + prefix + middle + suffix + tag;
}
// build a solar system starting with the star

function gen(n, u) {
    for (let i = 0; i < n; i++) {
        const star = generateStar();
        star.name = generateName('star');
        u.addBody(star);
    }
}

function isStarWithinGU(star, ship, gu = 10) {
    const GU_TO_UNITS = 22688;

    const dx = star.coords[0].x - ship.x;
    const dy = star.coords[0].y - ship.y;

    return (dx * dx + dy * dy) <= (gu * GU_TO_UNITS) ** 2;
}

function isShipInsideOortCloud(star, ship, oortRadiusPx) {
    const sx = star.coords[universe.zoomLevel].x;
    const sy = star.coords[universe.zoomLevel].y;
    const px = ship.x * zoomFactors[universe.zoomLevel];
    const py = ship.y * zoomFactors[universe.zoomLevel];

    const dx = px - sx;
    const dy = py - sy;

    const distToStar = Math.sqrt(dx * dx + dy * dy);
    const delta = distToStar - oortRadiusPx;

    return (dx * dx + dy * dy) <= (oortRadiusPx * oortRadiusPx);
}

function isShipInside1AU(star, ship) {
    const sx = star.coords[universe.zoomLevel].x;
    const sy = star.coords[universe.zoomLevel].y;
    const px = ship.x * zoomFactors[universe.zoomLevel];
    const py = ship.y * zoomFactors[universe.zoomLevel];

    const dx = px - sx;
    const dy = py - sy;

    const distToStar = Math.sqrt(dx * dx + dy * dy);
    const oneAUPx = auToIGU(1) * zoomFactors[universe.zoomLevel];

    return (dx * dx + dy * dy) <= (oneAUPx * oneAUPx);
}

function isShipInsidePlanetLock(planet, ship) {
    const sx = planet.coords[universe.zoomLevel].x;
    const sy = planet.coords[universe.zoomLevel].y;
    const px = ship.x * zoomFactors[universe.zoomLevel];
    const py = ship.y * zoomFactors[universe.zoomLevel];

    const dx = px - sx;
    const dy = py - sy;

    const distToPlanet = Math.sqrt(dx * dx + dy * dy);
    const planetLockPx = auToIGU(planet.gravityLock) * zoomFactors[universe.zoomLevel];

    return distToPlanet <= (planetLockPx * planetLockPx);
}


function drawBodies(bodies, c) {
    bodies.forEach(body => {

        if (
            // first check - is star within 0.05 gu
            !isStarWithinGU(body, ship, .05) || 
            // second check - don't show any children of any stars if no gravity lock
            body.type !== 'Star' && !ship.bodyLock ||
            // third check - if star is locked, only show it and its children
            body.type === 'Star' && ship.bodyLock && ship.bodyLock.id !== body.id ||
            // fourth check - if body is not a star and ship is locked, only show it if it's a child of the locked star
            body.type !== 'Star' && ship.bodyLock && ship.bodyLock.id !== body.starId
        ) { return; }

        if (isShipInsideOortCloud(body, ship, GRAV_LOCK) && !ship.bodyLock) {
            ship.bodyLock = body;
            ship.target = body;
            universe.zoom(1);
        }

        // if (isShipInside1AU(body, ship) && ship.bodyLock && ship.bodyLock.id === body.id && universe.zoomLevel === 1) {
        //     universe.zoom(1);
        // }

        setTimeout(() => {
            if (ship.bodyLock && ship.bodyLock.id === body.id && !isShipInsideOortCloud(body, ship, zoomFactors[universe.zoomLevel] * 20)) {
                ship.bodyLock = null;
                universe.zoomLevel = 0;
            }
        }, 5000);

        //settimeout for exiting 1au
        setTimeout(() => {
            if (ship.bodyLock && ship.bodyLock.id === body.id && !isShipInside1AU(body, ship)) {
                universe.zoomLevel = 1;
            }
        }, 5000);

        if (body.body === "Planet") {
            if (isShipInsidePlanetLock(body, ship)) {
                universe.zoomLevel = 3;
            }

            setTimeout(() => {
                if (ship.bodyLock && ship.bodyLock.id === body.id && !isShipInsidePlanetLock(body, ship)) {
                    universe.zoomLevel = 2;
                }
            }, 5000);
        }

        c.beginPath();
        const rPx = starRadiusPx(body);

        // star body
        c.beginPath();
        c.arc(body.coords[universe.zoomLevel].x, body.coords[universe.zoomLevel].y, Math.max(solarRadiiToIGU(body.radius) * zoomFactors[universe.zoomLevel], 10), 0, Math.PI * 2);
        c.fillStyle = 'yellow';
        if (body.body === 'Star') {
        } else if (body.body === 'Planet') {
            
            c.fillStyle = 'blue';
        } else if (body.body === 'Moon') {
            c.fillStyle = 'gray';
        } else {
            c.fillStyle = 'white';
        }
        c.fill();
        c.strokeStyle = "orange";

        // gravity lock ring (blue)
        const lockPx = gravityLockPx_AU(body);

        // console.log('drawing gravity lock for ', body.name, ' at ', body.gravityLock, ' px');
        const planetLockIGU = auToIGU(body.gravityLock);
        
        // draws a circle for the inner gravity lock
        if (lockPx > rPx) {
            c.beginPath();
            // console.log(lockPx)
            const z = zoomFactors[universe.zoomLevel];
            c.arc(body.coords[universe.zoomLevel].x, body.coords[universe.zoomLevel].y, GRAV_LOCK * z, 0, Math.PI * 2);
            c.strokeStyle = "rgba(0, 140, 255, 0.7)";
            c.lineWidth = 2;
            c.stroke();
        }

        if (body.body === 'Planet') {
            // console.log('drawing planet lock for ', body.name, ' at ', planetLockIGU, ' IGU');
            body.updateWorldPosition(1/fps);
            c.beginPath();
            const z = zoomFactors[universe.zoomLevel];
            c.arc(body.coords[universe.zoomLevel].x, body.coords[universe.zoomLevel].y, Math.max(planetLockIGU * z, 20), 0, Math.PI * 2);
            c.strokeStyle = "rgba(0, 255, 0, 0.7)";
            c.lineWidth = 2;
            c.stroke();

            // draw orbit path 1au from star
            c.beginPath();
            const orbitRadiusPx = auToIGU(1) * zoomFactors[universe.zoomLevel];
            c.arc(body.star.coords[universe.zoomLevel].x, body.star.coords[universe.zoomLevel].y, orbitRadiusPx, 0, Math.PI * 2);
            c.strokeStyle = "rgba(255, 255, 0, 0.3)";
            c.lineWidth = 1;
            c.stroke();

        }

        body.bodies && drawBodies(body.bodies, c);
    });
}

function drawUniverse(universe, c) {
    drawBodies(universe.bodies, c);
}

const uni = {
    draw: (u) => drawUniverse(u, c),
    update: (u) => u.update(),
    cycle: (u, c) => {
        uni.update(u);
        uni.draw(u, c);
    }
}
