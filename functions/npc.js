// @ts-check

function enemyCreate(gameOverCondition, enemy, canvas, shipSize, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount) {
    
    if (gameOverCondition == false) {
        while (enemy.ships.length < maxEnemies && spawnedThisWave < enemiesThisWave) {
            console.log('Spawning enemy ship');
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
            spawnedThisWave++;
        }
    }
}
function enemyDraw (enemy, c, shipSize, showBounding) {
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
function enemyAcceleration (enemy, acceleration) {
    for (let i = 0; i < enemy.ships.length; i++) {
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


const npc = {
    create: enemyCreate,
    draw: enemyDraw,
    accel: enemyAcceleration,
    cycle: (enemy, c, shipSize, showBounding, acceleration, gameOverCondition, canvas, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount) => {
        npc.create(gameOverCondition, enemy, canvas, shipSize, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount);
        npc.draw(enemy, c, shipSize, showBounding);
        npc.accel(enemy, acceleration);
    },
};

