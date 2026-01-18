
const AU_MILES = 92955807;   // 1 AU in miles
const GU_TO_AU = (au) => au * 0.0847; // 1 gu = 0.142 au
const GU = 22688; // 1 gu = distance betwean sol and proxima centauri, but in game terms, it take 60 seconds to travel 1 gu - and that is 0 to 22688 in precisely 60 seconds at default speed.
const PX_SCALE = 10000;
const SUN_RADIUS_MILES = 432690; // Sun radius in miles
const SUN_RADIUS_AU = SUN_RADIUS_MILES / AU_MILES; // Sun radius in AU
const AU_TO_GALACTIC = (au) => au * 0.085; // 1 AU = 0.085 galactic units
const zoomFactors = [1, 11800];
const GRAV_LOCK = 100;

function starRadiusPx(star) {
    return AU_TO_GALACTIC(star.radius / AU_MILES);
}

function gravityLockPx_AU(star) {
    // console.log(star.gravitylock)
    return (star.gravitylock * AU_MILES) / (PX_SCALE * 1000);
}

class Universe {
    constructor(starCount) {
        console.log(starCount)
        this.gravityConstant = 0.4;
        this.bodies = [];
        this.init = false;
        this.radius = 0;
        this.guUnit = GU;
        this.starCount = starCount;
        this.radiusLoosen = 1.35;
        this.bodycount = 0;
        this.zoomLevel = 0;
    }

    addBody(body) {
        this.bodies.push(body);
    }

    useBodyCount() {
        this.bodycount += 1;
        return this.bodycount;
    }

    genStars(starCount) {
        console.log('stargen', starCount)
        for (let i = 0; i < starCount; i++) {
            const star = generateStar();
            star.name = generateName('star');
            this.addBody(star);
        }
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

class Body {
    constructor(x, y, mass) {
        this.body = "Body";
        this.name = "Unnamed";
        this.x = x;
        this.y = y;
        this.mass = mass;      // current mass in M☉ for now
        this.radius = 0;       // R☉
        this.chemicalComposition = {};
        this.vx = 0; this.vy = 0;
    }
}

function generateName(type) {
    // random generation of names based on type
    const starters = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'New ', 'Alpha ', 'Beta ', 'Omega ', 'Great ', 'The ']
    const prefixes = ['Zor', 'Xan', 'Vel', 'Kor', 'Lun', 'Sol', 'Aeg', 'Neb', 'Gal', 'Or'];
    const middles = ['', 'ta', 'ri', 'lo', 'ne', 'qu', 'za', 'fi', 'mu', 'xi', 've'];
    const suffixes = ['', 'on', 'ar', 'is', 'us', 'ea', 'ix', 'or', 'um', 'ax', 'en'];
    const tags = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ' Prime', ' Nova', ' I', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];

    const starter = starters[Math.floor(Math.random() * starters.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
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

    const dx = star.x - ship.x;
    const dy = star.y - ship.y;

    return (dx * dx + dy * dy) <= (gu * GU_TO_UNITS) ** 2;
}

function isShipInsideOortCloud(star, ship, oortRadiusPx) {
    console.log('Checking Oort cloud for star:', star.name, oortRadiusPx);
    const sx = star.x * zoomFactors[universe.zoomLevel];
    const sy = star.y * zoomFactors[universe.zoomLevel];
    const px = ship.x * zoomFactors[universe.zoomLevel];
    const py = ship.y * zoomFactors[universe.zoomLevel];

    const dx = px - sx;
    const dy = py - sy;

    const distToStar = Math.sqrt(dx * dx + dy * dy);
    const delta = distToStar - oortRadiusPx;

    console.log(
        `Oort Δ for ${star.name}:`,
        delta.toFixed(2),
        `(ship→star=${distToStar.toFixed(2)}, radius=${oortRadiusPx})`
    );

    return (dx * dx + dy * dy) <= (oortRadiusPx * oortRadiusPx);
}

function drawUniverse(universe, c) {
    universe.bodies.forEach(body => {

        if (ship.bodyLock && ship.bodyLock.id !== body.id) {
            return;
        }

        if (isShipInsideOortCloud(body, ship, GRAV_LOCK * zoomFactors[universe.zoomLevel]) && !ship.bodyLock) {
            ship.bodyLock = body;
            console.log('locked to body:', body);
            universe.zoomLevel = 1;
            ship.x = ship.x * zoomFactors[universe.zoomLevel];
            ship.y = ship.y * zoomFactors[universe.zoomLevel];
        }

        // setTimeout(() => {
        //     if (ship.bodyLock && ship.bodyLock.id === body.id && !isShipInsideOortCloud(body, ship, GRAV_LOCK * zoomFactors[universe.zoomLevel])) {
        //         ship.bodyLock = null;
        //         ship.x = ship.x / zoomFactors[universe.zoomLevel];
        //         ship.y = ship.y / zoomFactors[universe.zoomLevel];
        //         universe.zoomLevel = 0;
        //         console.log('unlocked from body:', body);
        //     }
        // }, 5000);

        if (!isStarWithinGU(body, ship, .2)) { return; }
        c.beginPath();
        // console.log(`Drawing body: ${body.name} of type ${body.body} at (${body.x}, ${body.y}) with radius ${body.radius}`);
        const rPx = starRadiusPx(body);

        // star body
        c.beginPath();
        c.arc(body.x * zoomFactors[universe.zoomLevel], body.y * zoomFactors[universe.zoomLevel], 10 * zoomFactors[universe.zoomLevel], 0, Math.PI * 2);
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

        if (lockPx > rPx) {
            c.beginPath();
            // console.log(lockPx)
            c.arc(body.x * zoomFactors[universe.zoomLevel], body.y * zoomFactors[universe.zoomLevel], GRAV_LOCK * zoomFactors[universe.zoomLevel], 0, Math.PI * 2);
            c.strokeStyle = "rgba(0, 140, 255, 0.7)";
            c.lineWidth = 2;
            c.stroke();
        }

        // c.fill();
    });
}

const uni = {
    draw: (u) => drawUniverse(u, c),
    update: (u) => u.update(),
    cycle: (u, c) => {
        uni.update(u);
        uni.draw(u, c);
    }
}
