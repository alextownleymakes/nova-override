var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let controller = new Controller();

var c = canvas.getContext('2d');
const fps = 30; // frames per second
const shipSize = 30;
let angle = 90;
let handling = 8;
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
    handling: handling,
    thrust: {
        x:0,
        y:0
    },
    speedCap: globalSpeedCap,
    fireGun: false,
    bullets: [],
    explosions: [],
}
var enemy = {
    ships: [],
}
var stars = [];

function update() {
    math.car(ship.thrust.x,ship.thrust.y,deceleration);
    background.draw(canvas, stars, starCount, c);
    hud.draw(waveCount, theScore, killCount);
    player.cycle(c, ship, shipSize, gameOverCondition, showBounding, ship.thrust.x, ship.thrust.y, ship.speedCap, acceleration, deceleration, angle, controller);
    combat.player.cycle(ship, bulletSpeed, maxBullets, gameOver, gameOverCondition, enemy, canvas, c);
    npc.cycle(enemy, c, shipSize, showBounding, acceleration, gameOverCondition, canvas, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount);
    combat.npc.cycle(ship, enemy, canvas, gameOverCondition, bulletSpeed, randomTimer, playerExplosion, playerHealth, distanceBetween, c, explosion, killCount, waveKill, waveCount, theScore);
    gameOver(playerHealth, gameOverCondition, theScore, maxEnemies);
}

$(document).ready(keyboardMovement(controller, ship, showBounding, gameOverCondition));
