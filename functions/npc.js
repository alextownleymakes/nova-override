// @ts-check

function enemyCreate(ship, gameOverCondition, enemy, canvas, shipSize, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount) {
    if (gameOverCondition == false) {
        while (enemy.ships.length < maxEnemies && spawnedThisWave < enemiesThisWave) {
            // Spawn in WORLD space around the player (not screen coords)
            // so new enemies appear near-ish to you even after you fly far.
            const spawnRadiusX = canvas.width * 1.25;
            const spawnRadiusY = canvas.height * 1.25;
            enemy.ships.push({
                x: ship.x + (Math.random() - 0.5) * spawnRadiusX,
                y: ship.y + (Math.random() - 0.5) * spawnRadiusY,
                r: shipSize / 3,
                a: angle / (Math.random() * 180) * Math.PI, // convert to radians
                accel: true,
                decel: false,
                thrust: {
                    x: 0,
                    y: 0,
                },
                speedCap: globalSpeedCap * .7,
                fireGun: false,
                bullets: [],
                explosions: [],
            });
            spawnCount++;
            spawnedThisWave++;
        }
    }
}
function enemyDraw(enemy, c, shipSize, showBounding) {
    for (var i = 0; i < enemy.ships.length; i++) {
        c.strokeStyle = "grey",
            c.lineWidth = shipSize / 10;
        c.beginPath();
        c.moveTo( //nose of ship
            enemy.ships[i].x + 4 / 3 * enemy.ships[i].r * Math.cos(enemy.ships[i].a),
            enemy.ships[i].y - 4 / 3 * enemy.ships[i].r * Math.sin(enemy.ships[i].a)
        );
        c.lineTo( //rear left
            enemy.ships[i].x - enemy.ships[i].r * (2 / 3 * Math.cos(enemy.ships[i].a) + Math.sin(enemy.ships[i].a)),
            enemy.ships[i].y + enemy.ships[i].r * (2 / 3 * Math.sin(enemy.ships[i].a) - Math.cos(enemy.ships[i].a))
        );
        c.lineTo( //rear right
            enemy.ships[i].x - enemy.ships[i].r * (2 / 3 * Math.cos(enemy.ships[i].a) - Math.sin(enemy.ships[i].a)),
            enemy.ships[i].y + enemy.ships[i].r * (2 / 3 * Math.sin(enemy.ships[i].a) + Math.cos(enemy.ships[i].a))
        );
        c.closePath();
        c.stroke();
        c.fillStyle = "red";
        c.fillRect(enemy.ships[i].x - 1, enemy.ships[i].y - 1, 3, 2);
        if (showBounding) {
            c.strokeStyle = "lime";
            c.beginPath();
            c.arc(enemy.ships[i].x, enemy.ships[i].y, enemy.ships[i].r, 0, Math.PI * 2, false);
            c.stroke();
        }
    }
}

function enemyAcceleration(enemy, acceleration) {
  for (let i = 0; i < enemy.ships.length; i++) {
    const s = enemy.ships[i];

    const dx =  (acceleration * .05) * Math.cos(s.a);
    const dy = -(acceleration * .05) * Math.sin(s.a);

    s.thrust.x += dx;
    s.thrust.y += dy;

    const mag = Math.hypot(s.thrust.x, s.thrust.y);
    if (mag > s.speedCap) {
      const scale = s.speedCap / mag;
      s.thrust.x *= scale;
      s.thrust.y *= scale;
    }

    s.x += s.thrust.x;
    s.y += s.thrust.y;
  }
}
function wrapPi(rad) {
  // normalize to [-PI, PI]
  return Math.atan2(Math.sin(rad), Math.cos(rad));
}

function enemyTargeting(ship, enemy) {
  const handlingSpeed = 0.07;
  const deadzone = 0.2;

  for (let i = 0; i < enemy.ships.length; i++) {
    const e = enemy.ships[i];

    const dx = (ship.x * zoomFactors[universe.zoomLevel]) - e.x;
    const dy = (ship.y * zoomFactors[universe.zoomLevel]) - e.y;

    const angleToShip = Math.atan2(-dy, dx);
    const angleDiff = wrapPi(angleToShip - e.a); 

    if (Math.abs(angleDiff) > deadzone) {
      e.a += Math.sign(angleDiff) * handlingSpeed;
      e.a = wrapPi(e.a); 
    }
  }
}



const npc = {
    create: enemyCreate,
    draw: enemyDraw,
    accel: enemyAcceleration,
    targeting: enemyTargeting,
    cycle: (ship, enemy, c, shipSize, showBounding, acceleration, gameOverCondition, canvas, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount) => {
        npc.create(ship, gameOverCondition, enemy, canvas, shipSize, maxEnemies, enemiesThisWave, spawnedThisWave, angle, globalSpeedCap, spawnCount);
        npc.draw(enemy, c, shipSize, showBounding);
        npc.accel(enemy, acceleration);
        npc.targeting(ship, enemy);
    },
};

