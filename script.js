var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let universe = new Universe(1000);
let controller = new Controller();

var c = canvas.getContext('2d');
const fps = 30; // frames per second
const shipSize = 30;
let angle = 90;
let handling = 5;
let acceleration = 3;
let deceleration = .2;
let globalSpeedCap = 10;
var kdr = 1;
var accelRatio = 1;
var forward = false;
var maxBullets = 20;
var bulletSpeed = 20;
var maxEnemyBullets = 1;
var showBounding = false;
var starCount = 2000;
var explosionCount = 20;
var explosions = {

};

var playerHealth = 3;
var maxEnemies = 5;
var spawnedThisWave = 0;
var enemiesThisWave = 5;
var spawnCount = 0;
var waveKill = 0;
var killCount = 0;
var waveCount = 1;
var theScore = 0;
var explosionsTimer = 30;

var gameOverCondition = false;

setInterval(update, 1000/fps);

var ship = {
    x : canvas.width/2,
    y: canvas.height/2,
    r: shipSize/2,
    a: angle / 180 * Math.PI, // convert to radians
    angle: 90,
    accel: false,
    decel: false,
    handling,
    thrust: {
        x:0,
        y:0
    },
    speedCap: globalSpeedCap,
    fireGun: false,
    bullets: [],
    explosions: [],
    bodyLock: null,
    target: null,
}
var enemy = {
    ships: [],
}
var stars = [];

function update() {
    math.car(ship.thrust.x,ship.thrust.y,deceleration);
    // Background in screen-space
    background.draw(canvas, ship, stars, starCount, c);

    // World in world-space, camera locked to player
    const camX = (ship.x * zoomFactors[universe.zoomLevel]);
    const camY = (ship.y * zoomFactors[universe.zoomLevel]);
    c.save();
    c.translate(canvas.width / 2 - camX, canvas.height / 2 - camY);

    
    player.cycle(c, ship, shipSize, gameOverCondition, showBounding, ship.thrust.x, ship.thrust.y, ship.speedCap, acceleration, deceleration, angle, controller);
    combat.player.cycle(ship, bulletSpeed, maxBullets, gameOver, gameOverCondition, enemy, canvas, c, distanceBetween, playerExplosion, explosionCount);
    npc.cycle(ship, enemy, c, shipSize, showBounding, acceleration, gameOverCondition, canvas, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount);
    combat.npc.cycle(ship, enemy, canvas, gameOverCondition, bulletSpeed, randomTimer, playerExplosion, playerHealth, distanceBetween, c, explosion, killCount, waveKill, waveCount, theScore);
    uni.cycle(universe, c);
    
    c.restore();

    // HUD is DOM-based, leave in screen-space
    hud.draw(ship);
    minimap.draw(universe, ship, canvas);

    gameOver(playerHealth, gameOverCondition, theScore, maxEnemies);
}

$(document).ready(keyboardMovement(controller, ship, showBounding, gameOverCondition));

//   // helpers commonly used in dweets
//   const S = Math.sin, C = Math.cos;
//   const R = (r,g,b,a=1) => `rgba(${r|0},${g|0},${b|0},${a})`;

//   function frame(ms){
//     const t = ms/1000;

//     // optional: clear each frame (try commenting this out for trails)
//     x.clearRect(0,0,c.width,c.height);

//     // your snippet:
//     // for(i=0;i<2e3;c.fillRect(i?960+i*S(F=260*(t+9)/i+S(i*i)):0,i?500+.2*(2*i*C(F)+2e4/i):0,K=i++?S(i)*9:2e3,K))c.fillStyle=R(99*i,2*i,i,i?1:.4)

//     requestAnimationFrame(frame);
//   }
//   requestAnimationFrame(frame);