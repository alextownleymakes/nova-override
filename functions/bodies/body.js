class Body {
    constructor(x, y, mass) {
        this.body = "Body";
        this.name = "Unnamed";
        this.coords = [{ x: x, y: y }];
        this.mass = mass;      // current mass in M☉ for now
        this.radius = 0;       // R☉
        this.chemicalComposition = {};
        this.vx = 0; this.vy = 0;
        this.bodies = [];
    }
}