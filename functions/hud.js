// @ts-check

function overlayRefresh(ship) {
    const coords = document.getElementById('coords');
    const dist = document.getElementById('distance');
    const countdown = document.getElementById('countdown');
    const targetName = document.getElementById('target-name');
    const targetCoords = document.getElementById('target-coords');
    const targetDist = document.getElementById('target-distance');
    const targetType = document.getElementById('target-type');
    const targetPlanets = document.getElementById('target-planets');

    const target = ship.target;

    if (target) {
        targetName && (targetName.innerHTML = target.name);
        targetCoords && (targetCoords.innerHTML = target.coords[0].x.toFixed(0) + ', ' + target.coords[0].y.toFixed(0));
        const dx = target.coords[0].x - ship.x;
        const dy = target.coords[0].y - ship.y;
        const distance = iguToLargestUOM(Math.sqrt(dx * dx + dy * dy));
        targetDist && (targetDist.innerHTML = distance);
        targetType && (targetType.innerHTML = target.type);
        const planets = target.bodies.map(p => p.name);
        targetPlanets && (targetPlanets.innerHTML = planets.join(', '));
    } else {
        targetName && (targetName.innerHTML = 'N/A');
        targetCoords && (targetCoords.innerHTML = 'N/A');
        targetDist && (targetDist.innerHTML = 'N/A');
        targetType && (targetType.innerHTML = 'N/A');
    }

    coords && (coords.innerHTML = ship.x.toFixed(0) + ', ' + ship.y.toFixed(0));
    dist && (dist.innerHTML = ship.bodyLock ? ship.bodyLock.name : 'N/A');

    //a timer that counts to 60 and returns the current ship coords at that exact moment as a string
    let timer = 60;
    setInterval(() => {
        timer--;
        if (timer < 0) {
            timer = 60;
        }
        countdown && (countdown.innerHTML = timer.toString());
    }, 1000);

    //score increments by 1 every second

}

const hud = {
    draw: overlayRefresh,
};