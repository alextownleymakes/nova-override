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
let globalSpeedCap = 10;
var kdr = 1;
var leftTurn = false;
var accelRatio = 1;
var rightTurn = false;
var forward = false;
var stopMovement = false;
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
var enemiesThisWave = 5;
var spawnCount = 0;
var waveKill = 0;
var killCount = 0;
var waveCount = 1;
var theScore = 0;
var explosionsTimer = 30;
var explosionsTimerCount = 0;

var gameOverCondition = false;
var waveOver = true;


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
    explosions: [],
}
var enemy = {
    ships: [],

}
var stars = [];


////////////////////////////////
////////// GAMEPLAY!! //////////
////////////////////////////////
function update() {
    calculateAccelRatio(ship.thrust.x,ship.thrust.y,deceleration);
    spaceDraw();
    starsPlace();
    starsDraw();
    overlayRefresh();
    waveDisplay();
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
    enemyBulletsShoot();
    clearEnemies();
    killEnemy();
    waveIncrease();
    enemyBulletsDraw();
    enemyBulletsMove();
    clearEnemyBullets();
    damagePlayer();
    // playerExplosionRedraw();
    gameOver();
}

function randomTimer() {
    return (Math.random()*3000)+500;
}
function overlayRefresh() {
    document.getElementById('wave').innerHTML=(waveCount);
    document.getElementById('score').innerHTML=(theScore);
    document.getElementById('kills').innerHTML=(killCount);
}
////////////////////////////////
////////// BACKGROUND //////////
////////////////////////////////
function starsPlace() {
    for (i = 0; stars.length < starCount; i++) {
        stars.push ({
            x: Math.random()*canvas.width,
            y: Math.random()*canvas.height
        });
    }
}
function starsDraw() {
    for (i = 0; i < stars.length; i++) {
        c.strokeStyle = "white";
        c.lineWidth = "1";
        c.beginPath();

        c.arc(stars[i].x,stars[i].y,.3,0,Math.PI*2,false);
        c.stroke();
    }
}
function spaceDraw () {
    c.fillStyle = "black";
    c.fillRect (0, 0, canvas.width, canvas.height);
    

   
}


/////////////////////////////////
////////// PLAYER SHIP //////////
/////////////////////////////////
function shipDraw() {
    if (gameOverCondition == false) {
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
    else if (gameOverCondition == true) {

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
function distanceBetween (x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x2-x1, 2) * Math.pow(y2 - y1, 2));
}
function explosion(dis) {
    for(k=0; k < explosionCount; k++) {
        enemy.ships[j].explosions.push({
            x: dis.x,
            y: dis.y,
        });
        for(l=0; l < dis.explosions.length; l++){
            c.beginPath()
            c.strokeStyle = "red";
            c.fillStyle = "orange";
            c.arc((dis.x-20)+Math.random()*40,(dis.y-20)+Math.random()*40,dis.r,0,Math.PI*2,false);
            c.fill();
            c.stroke();
            c.closePath();
        }
    }
}
function playerExplosion() {
    console.log("big boom");
    for(i=0; i < explosionCount; i++){
        ship.explosions.push({
            x: ship.x,
            y: ship.y,
        });
        c.beginPath()
        c.strokeStyle = "red";
        c.fillStyle = "orange";
        c.arc((ship.x-20)+Math.random()*40,(ship.y-20)+Math.random()*40,ship.r,0,Math.PI*2,false);
        c.fill();
        c.stroke();
        c.closePath();
    }
    ship.explosions = [];
// enemy.ships.splice(j,1);  
}
// function playerExplosionRedraw() {
//     if (ship.explosions.length > 0) {
//         for (var i = 0; i < explosionsTimer; i++)
//             for (var i = 0; i < ship.explosions.length; i++) {
//                 setTimeout(function() {
//                 ship.explosions[i].x = ship.x;
//                 ship.explosions[i].y = ship.y;
//                 }, 100);
//         }
//         ship.explosions = [];
//     }
// }

////////////////////////////////
////////// ENEMY SHIP //////////
////////////////////////////////
function enemyCreate() {
    if (gameOverCondition == false) {
        while (enemy.ships.length < maxEnemies) {
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
                explosions: [],
            });
            spawnCount++;
        }
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
    enemy.ships[i].x += (enemy.ships[i].thrust.x*.2);
    enemy.ships[i].y += (enemy.ships[i].thrust.y*.2);
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


////////////////////////////////
////////// THE COMBAT //////////
////////////////////////////////
function bulletsShoot() {
    if (ship.fireGun && ship.bullets.length < maxBullets) {
        ship.bullets.push({
            x: ship.x + 4/3 + ship.r * Math.cos(ship.a),
            y: ship.y - 4/3 * ship.r * Math.sin(ship.a),
            xv: bulletSpeed * Math.cos(ship.a),
            yv: -bulletSpeed * Math.sin(ship.a),
            r: 2,
        }); 
    }
    // ship.fireGun = false;
}
function bulletsDraw () {
    for (var i = 0; i < ship.bullets.length; i++) {
        c.fillstyle = "purple";
        c.beginPath();
        c.arc(ship.bullets[i].x,ship.bullets[i].y, ship.bullets[i].r, 0, Math.PI * 2, false);
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
function killEnemy() {
    var explodey = false;
    var whichExplodey;
    for (i = 0; i < ship.bullets.length; i++) {
        for(j = 0; j < enemy.ships.length; j++) {
            if (distanceBetween(ship.bullets[i].x,ship.bullets[i].y,enemy.ships[j].x,enemy.ships[j].y) < ship.bullets[i].r+enemy.ships[j].r) {
                // enemy.ships.splice(j,1);
                // explosion(enemy.ships[j]);
                killCount++;
                waveKill++;
                whichExplodey = enemy.ships[j];
                explosion(whichExplodey);
                enemy.ships.splice(j,1);
                theScore+= (10*(waveCount/2))+5;
            }
        }
    }
}
function enemyBulletsShoot() { 
    if (gameOverCondition == false) {
        setTimeout(function(){ 
            for (i=0; i < enemy.ships.length; i++) {
                if (enemy.ships[i].bullets.length < maxEnemyBullets) {
                    enemy.ships[i].bullets.push({
                        x: enemy.ships[i].x + 4/3 + enemy.ships[i].r * Math.cos(enemy.ships[i].a),
                        y: enemy.ships[i].y - 4/3 * enemy.ships[i].r * Math.sin(enemy.ships[i].a),
                        xv: bulletSpeed * Math.cos(enemy.ships[i].a),
                        yv: -bulletSpeed * Math.sin(enemy.ships[i].a),
                        r: 2,
                    }); 
                    
                }
            }
        }, randomTimer());
    }
}

function enemyBulletsDraw () {

    for (i=0; i < enemy.ships.length; i++) {
        for (var j = 0; j < enemy.ships[i].bullets.length; j++) {
            c.fillstyle = "purple";
            c.beginPath();
            c.arc(enemy.ships[i].bullets[j].x,enemy.ships[i].bullets[j].y, enemy.ships[i].bullets[j].r, 0, Math.PI * 2, false);
            c.fill();
        }
    }
}
function enemyBulletsMove() {
    for (i=0; i < enemy.ships.length; i++) {
        for (var j = 0; j < enemy.ships[i].bullets.length; j++) {
            enemy.ships[i].bullets[j].x += enemy.ships[i].bullets[j].xv;
            enemy.ships[i].bullets[j].y += enemy.ships[i].bullets[j].yv;
            if (enemy.ships[i].bullets[j].x > canvas.width || enemy.ships[i].bullets[j].x < 0  || enemy.ships[i].bullets[j].y > canvas.height || enemy.ships[i].bullets[j].y < 0) {
                enemy.ships[i].bullets.splice[j];
            }
        }
    }
}
function damagePlayer() {
    for (k = 0; k < enemy.ships.length; k++) {
        for (i = 0; i < enemy.ships[k].bullets.length; i++) {
            if (distanceBetween(enemy.ships[k].bullets[i].x,enemy.ships[k].bullets[i].y,ship.x,ship.y) < enemy.ships[k].bullets[i].r+ship.r) {
                // enemy.ships.splice(j,1);
                // explosion(enemy.ships[j]);
                playerExplosion();
                console.log('that\'s a hit!');
                if (gameOverCondition == false) {
                document.getElementById(playerHealth).style.backgroundColor = "rgba(0,0,0,0)" ;
                playerHealth--;
                }
            }
        }
    }
   
}

function clearEnemyBullets() {
    for (var j=0; j < enemy.ships.length; j++) {
        for (var i = 0; i < enemy.ships[j].bullets.length; i++) {
            if (enemy.ships[j].bullets[i].x > canvas.width || enemy.ships[j].bullets[i].x < 0  || enemy.ships[j].bullets[i].y > canvas.height || enemy.ships[j].bullets[i].y < 0) {
                enemy.ships[j].bullets.splice(i,1);
            }
        }
    }
}

////////////////////////////////
////////// THE WAVES  //////////
////////////////////////////////

function waveIncrease() {
    if (waveKill == enemiesThisWave) {
        waveCount++;
        enemiesThisWave+=5;
        waveKill = 0;
        maxEnemies++;
        waveOver = true;
        // waveDisplay();
    }
}

function waveDisplay() {
    if (waveOver == true) {
        document.getElementById('wavedisplay').style.visibility = "visible";
        document.getElementById('whichwave').innerHTML = "WAVE " + waveCount;
        setTimeout(function(){
            document.getElementById('wavedisplay').style.visibility = "hidden"; 
            waveOver = false; }, 
            1000);
       
    }
}

////////////////////////////////
////////// THE WAVES  //////////
////////////////////////////////

function gameOver() {
    if (playerHealth <= 0) {
        gameOverCondition = true;
        document.getElementById('finalscore').innerHTML = theScore;
        document.getElementById('gameover').style.visibility = "visible";
        maxEnemies = 0;
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
            case 40:
			ship.decel = true;

			break;

			//key Space
			case 32:

			ship.fireGun = true;

            break;
            
            case 66: 

            showBounding = !showBounding;

            break;
            case 13: 
            if (gameOverCondition == true) {
                window.location.reload();
            }
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

			ship.fireGun = false;

			break;
		}

		e.preventDefault();
	};
}

$(document).ready(keyboardMovement());




