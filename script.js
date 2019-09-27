var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');
const fps = 30; // frames per second
const shipSize = 30;
let angle = 360;
let handling = 8;
let acceleration = 3;
let deceleration = .2;
let globalSpeedCap = 20;
var kdr = 1;
var leftTurn = false;
var accelRatio = 1;
var rightTurn = false;
var forward = false;
var stopMovement = false;
var maxBullets = 20;
var bulletSpeed = 20;
var maxEnemies = 5;
var showBounding = false;
setInterval(update, 1000/fps);

var ship = {
    x : canvas.width/2,
    y: canvas.height/2,
    r: shipSize/2,
    a: angle / 180 * Math.PI, // convert to radians
    accel: false,
    decel: false,
    thrust: {
        x:0,
        y:0
    },
    speedCap: globalSpeedCap,
    fireGun: false,
    bullets: [],
}
var enemy = {
    ships: [],
}
function update() {
    calculateAccelRatio(ship.thrust.x,ship.thrust.y,deceleration);
    spaceDraw();
    shipDraw();
    // thrusterDraw();
    shipRotation();
    thrustLimiter(ship.thrust.x,ship.thrust.y,ship.speedCap);
    shipAcceleration();
    shipDeceleration(ship.thrust.x,ship.thrust.y,deceleration,accelRatio);
    shipScreenWrap();
    bulletsShoot();
    bulletsDraw();
    bulletsMove();
    clearBullets();
    enemyCreate();
    enemyDraw();
    enemyAcceleration();
    clearEnemies();
}
function spaceDraw () {
    c.fillStyle = "black";
    c.fillRect (0, 0, canvas.width, canvas.height);
}
function shipDraw() {
    c.strokeStyle = "white",
    c.lineWidth = shipSize / 10;
    c.beginPath();
    c.moveTo ( //nose of ship
        ship.x + 4/3*ship.r * Math.cos(ship.a),
        ship.y - 4/3*ship.r * Math.sin(ship.a)
    );
    c.lineTo( //rear left
        ship.x - ship.r * (2/3*Math.cos(ship.a) + Math.sin(ship.a)),
        ship.y + ship.r * (2/3*Math.sin(ship.a) - Math.cos(ship.a))
    );
    c.lineTo( //rear right
        ship.x - ship.r * (2/3*Math.cos(ship.a) - Math.sin(ship.a)),
        ship.y + ship.r * (2/3*Math.sin(ship.a) + Math.cos(ship.a))
    );
    c.closePath();
    c.stroke();
    c.fillStyle="skyblue";
    c.fillRect(ship.x -1, ship.y-1, 2,2);

    if (showBounding) {
        c.strokeStyle = "lime";
        c.beginPath();
        c.arc(ship.x,ship.y,ship.r,0,Math.PI*2,false);
        c.stroke();
    }
}
function thrusterDraw() {
    // console.log("drawing thruster");
    c.strokeStyle = "orange",
    c.lineWidth = shipSize/10;
    c.beginPath();
    c.moveTo(
        (ship.x-2) - ship.r * (2/3 * Math.cos(ship.a) + 1 * Math.sin(ship.a)),
        ship.y + ship.r * (2/3 * Math.sin(ship.a) - 1 * Math.cos(ship.a))
    );
    c.lineTo(
        ship.x - ship.r * 5/3 * Math.cos(ship.a),
        (ship.y-7) + ship.r * 6/3 * Math.sin(ship.a)
    );
    c.lineTo(
        (ship.x-2) - ship.r * (2/3 * Math.cos(ship.a) - .01 * Math.sin(ship.a)),
        ship.y + ship.r * (3/6 * Math.sin(ship.a) + .01 * Math.cos(ship.a))
    )
    c.lineTo(
        ship.x - ship.r * 5/3 * Math.cos(ship.a),
        (ship.y+7) + ship.r * 6/3 * Math.sin(ship.a)
    );
    c.lineTo(
        (ship.x-2) - ship.r * (2/3 * Math.cos(ship.a) - 1 * Math.sin(ship.a)),
        ship.y + ship.r * (3/6 * Math.sin(ship.a) + 1 * Math.cos(ship.a))
    )
    c.closePath();
    c.stroke();
}
function shipRotation() {
    if ( leftTurn == true ) {
        if (angle == 360) {
            angle = 0
        }
        angle += handling;
        ship.a = angle / 180 * Math.PI; // convert to radians
    }
    if ( rightTurn == true ) {
        if (angle == 0) {
            angle = 360
        }
        angle -= handling;
        ship.a = angle / 180 * Math.PI;
    }
}
function shipAcceleration() {
    // console.log (ship.a,Math.sin(ship.a), Math.cos(ship.a))
    if (ship.accel) {
        thrusterDraw();
        if (ship.thrust.x < ship.speedCap && ship.thrust.x > -ship.speedCap){
            ship.thrust.x += acceleration * Math.cos(ship.a);
        }
        if (ship.thrust.y < ship.speedCap && ship.thrust.y > -ship.speedCap) {
            ship.thrust.y += -acceleration * Math.sin(ship.a);
        }
        // if ( )
        // console.log(ship.thrust.y);
    } 
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
    
}
function shipDeceleration(x,y,d,dR) {
    // console.log(dR);
    if (ship.decel) {
            ship.thrust.x -= d * ship.thrust.x;
            ship.thrust.y -= d * ship.thrust.y;
    }

    if ( ship.thrust.x < 1 && ship.thrust.x > -1 && ship.thrust.y < 1 &&
        ship.thrust.y > -1 ) {
        ship.thrust.x = 0;
        ship.thrust.y = 0;
    }
}
function thrustLimiter(x,y,s) {
    if (x >= s) { ship.thrust.x = s-.5};
    if (x <= -s) { ship.thrust.x = -s+.5};
    if (y >= s) { ship.thrust.y = s-.5};
    if (y <= -s) { ship.thrust.y = -s+.5};
}
function enemyCreate() {
    if (enemy.ships.length < maxEnemies) {
        enemy.ships.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: shipSize/3,
            a: angle / (Math.random()*180) * Math.PI, // convert to radians
            accel: true,
            decel: false,
            thrust: {
                x:0,
                y:0,
            },
            speedCap: globalSpeedCap*.7,
            fireGun: false,
            bullets: [],
        });
    }
}
function enemyDraw () {
    for (var i = 0; i < enemy.ships.length; i++) {
        c.strokeStyle = "grey",
        c.lineWidth = shipSize / 10;
        c.beginPath();
        c.moveTo ( //nose of ship
            enemy.ships[i].x + 4/3*enemy.ships[i].r * Math.cos(enemy.ships[i].a),
            enemy.ships[i].y - 4/3*enemy.ships[i].r * Math.sin(enemy.ships[i].a)
        );
        c.lineTo( //rear left
            enemy.ships[i].x - enemy.ships[i].r * (2/3*Math.cos(enemy.ships[i].a) + Math.sin(enemy.ships[i].a)),
            enemy.ships[i].y + enemy.ships[i].r * (2/3*Math.sin(enemy.ships[i].a) - Math.cos(enemy.ships[i].a))
        );
        c.lineTo( //rear right
            enemy.ships[i].x - enemy.ships[i].r * (2/3*Math.cos(enemy.ships[i].a) - Math.sin(enemy.ships[i].a)),
            enemy.ships[i].y + enemy.ships[i].r * (2/3*Math.sin(enemy.ships[i].a) + Math.cos(enemy.ships[i].a))
        );
        c.closePath();
        c.stroke();
        c.fillStyle="red";
        c.fillRect(enemy.ships[i].x -1, enemy.ships[i].y-1, 3,2);
        if (showBounding) {
            c.strokeStyle = "lime";
            c.beginPath();
            c.arc(enemy.ships[i].x,enemy.ships[i].y,enemy.ships[i].r,0,Math.PI*2,false);
            c.stroke();
        }
    }
}
function enemyAcceleration () {
    for (i = 0; i < enemy.ships.length; i++) {
        if (enemy.ships[i].thrust.x < enemy.ships[i].speedCap && enemy.ships[i].thrust.x > -enemy.ships[i].speedCap){
            enemy.ships[i].thrust.x += acceleration * Math.cos(enemy.ships[i].a);
        }
        if (enemy.ships[i].thrust.y < enemy.ships[i].speedCap && enemy.ships[i].thrust.y > -enemy.ships[i].speedCap) {
            enemy.ships[i].thrust.y += -acceleration * Math.sin(enemy.ships[i].a);
        }
        // if ( )
        // console.log(ship.thrust.y);
    enemy.ships[i].x += (enemy.ships[i].thrust.x*.5);
    enemy.ships[i].y += (enemy.ships[i].thrust.y*.5);
    } 
}
function clearEnemies() {
    for (var i = 0; i < enemy.ships.length; i++) {
        if (enemy.ships[i].x > canvas.width || enemy.ships[i].x < 0  || enemy.ships[i].y > canvas.height || enemy.ships[i].y < 0) {
            enemy.ships.splice(i,1);
        }
    }
}
function shipScreenWrap() {
    if (ship.x > window.innerWidth ) {
        ship.x = 1;
    }

    if (ship.y > window.innerHeight ) {
        ship.y = 1;
    }
    if (ship.x < 0 ) {
        ship.x = window.innerWidth;
    }

    if (ship.y < 0 ) {
        ship.y = window.innerHeight;
    }
}
function calculateAccelRatio (x,y,d) {
    if (x < 0) { x = -x };
    if (y < 0) { y = -y };
    if (x<y) {
        kdr = (d/x);
        accelRatio = kdr*y;
    } else if ( x > y ) {
        kdr = (d/y);
        accelRatio = kdr*x;
    }
}
function bulletsShoot() { 
    if (ship.fireGun && ship.bullets.length < maxBullets) {
        ship.bullets.push({
            x: ship.x + 4/3 + ship.r * Math.cos(ship.a),
            y: ship.y - 4/3 * ship.r * Math.sin(ship.a),
            xv: bulletSpeed * Math.cos(ship.a),
            yv: -bulletSpeed * Math.sin(ship.a)
    }); 
}
// console.log(ship.bullets);
    ship.fireGun = false;
}
function bulletsDraw () {
    for (var i = 0; i < ship.bullets.length; i++) {
        c.fillstyle = "purple";
        c.beginPath();
        c.arc(ship.bullets[i].x,ship.bullets[i].y, 5, 0, Math.PI * 2, false);
        c.fill();


    }
}
function bulletsMove() {
    for (var i = 0; i < ship.bullets.length; i++) {
        ship.bullets[i].x += ship.bullets[i].xv;
        ship.bullets[i].y += ship.bullets[i].yv;
        if (ship.bullets[i].x > canvas.width || ship.bullets[i].x < 0  || ship.bullets[i].y > canvas.height || ship.bullets[i].y < 0) {
            ship.bullets.splice[i];
        }
    }
    
}
function clearBullets() {
    for (var i = 0; i < ship.bullets.length; i++) {
        if (ship.bullets[i].x > canvas.width || ship.bullets[i].x < 0  || ship.bullets[i].y > canvas.height || ship.bullets[i].y < 0) {
            ship.bullets.splice(i,1);
        }
    }
}
//keyboard movement
function keyboardMovement()
{
	window.onkeydown = function(e)
	{
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:
			case 37:

            leftTurn = true;
            console.log('turning left');

			break;

			//key W or UP
			case 87:
			case 38:

            ship.accel = true;
            ship.decel = false;
            console.log('moving forward');
			break;

			//key D or RIGHT
			case 68:
			case 39:

			rightTurn= true;
            console.log('turning right');

			break;

			//key S or DOWN
			case 88:
			ship.decel = true;

			break;

			//key Space
			case 32:

			ship.fireGun = true;

            break;
            
            case 66: 

            showBounding = !showBounding;
		}

		e.preventDefault();
	};

	window.onkeyup = function(e)
	{
		switch(e.keyCode)
		{
			//key A or LEFT
			case 65:
			case 37:

			leftTurn = false;

			break;

			//key W or UP
			case 87:
			case 38:

            ship.accel = false;
            // acceleration = 0;

			break;

			//key D or RIGHT
			case 68:
			case 39:

			rightTurn = false;

			break;

			//key S or DOWN
			case 88:
			ship.decel = false;

			break;

			//key Space
			case 32:

			fireGun = false;

			break;
		}

		e.preventDefault();
	};
}

$(document).ready(keyboardMovement());




