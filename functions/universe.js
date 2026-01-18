class Universe {
    constructor() {
        this.gravityConstant = 0.4;
        this.bodies = [];
        this.init = false;
    }

    addBody(body) {
        this.bodies.push(body);
    }

    genStars(n) {
        for (let i = 0; i < n; i++) {
            const star = generateStar();
            star.name = generateName('star');
            this.addBody(star);
        }
    }

    update() {

        if (!this.init) {
            this.genStars(5);
            this.init = true;
        }

        console.log(this.bodies);

        // Calculate gravitational forces between bodies
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyA = this.bodies[i];
                const bodyB = this.bodies[j];

                const dx = bodyB.x - bodyA.x;
                const dy = bodyB.y - bodyA.y;
                const distanceSq = dx * dx + dy * dy;
                const distance = Math.sqrt(distanceSq);

                if (distance === 0) continue; // Prevent division by zero

                const force = (this.gravityConstant * bodyA.mass * bodyB.mass) / distanceSq;
                const forceX = (force * dx) / distance;
                const forceY = (force * dy) / distance;

                bodyA.vx += forceX / bodyA.mass;
                bodyA.vy += forceY / bodyA.mass;
                bodyB.vx -= forceX / bodyB.mass;
                bodyB.vy -= forceY / bodyB.mass;
            }
        }

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

class Planet extends Body {
    constructor(x, y, mass) {
        super(x, y, mass);
        this.orbitalRadius = 0;
        this.orbitalPeriod = 0;
        this.atmosphereComposition = {};
        this.body = 'Planet';
    }
}

class Moon extends Body {
    constructor(x, y, mass) {
        super(x, y, mass);
        this.orbitalRadius = 0;
        this.orbitalPeriod = 0;
        this.body = 'Moon';
    }
}

function generateName(type) {
    // random generation of names based on type
    const prefixes = ['Zor', 'Xan', 'Vel', 'Kor', 'Lun', 'Sol', 'Aeg', 'Neb', 'Gal', 'Or'];
    const suffixes = ['on', 'ar', 'is', 'us', 'ea', 'ix', 'or', 'um', 'ax', 'en'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return prefix + suffix;
}
// build a solar system starting with the star

function gen(n, u) {
    for (let i = 0; i < n; i++) {
        const star = generateStar();
        star.name = generateName('star');
        u.addBody(star);
    }
}

function drawUniverse(universe, c) {
    universe.bodies.forEach(body => {
        c.beginPath();
        c.arc(body.x, body.y, Math.max(2, body.radius / 1000), 0, Math.PI * 2);
        if (body.body === 'Star') {
            c.fillStyle = 'yellow';
        } else if (body.body === 'Planet') {
            c.fillStyle = 'blue';
        } else if (body.body === 'Moon') {
            c.fillStyle = 'gray';
        } else {
            c.fillStyle = 'white';
        }
        c.fill();
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
