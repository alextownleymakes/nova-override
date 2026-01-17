// @ts-check

function bulletsShoot(ship, bulletSpeed, maxBullets) {
    if (ship.fireGun && ship.bullets.length < maxBullets) {
        ship.bullets.push({
            x: ship.x + 4 / 3 + ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: bulletSpeed * Math.cos(ship.a),
            yv: -bulletSpeed * Math.sin(ship.a),
            r: 2,
        });
    }
    // ship.fireGun = false;
}

function bulletsDraw(ship, c) {
    for (var i = 0; i < ship.bullets.length; i++) {
        c.fillstyle = "purple";
        c.beginPath();
        c.arc(ship.bullets[i].x, ship.bullets[i].y, ship.bullets[i].r, 0, Math.PI * 2, false);
        c.fill();
    }
}

function bulletsMove(ship, canvas) {
    for (var i = 0; i < ship.bullets.length; i++) {
        ship.bullets[i].x += ship.bullets[i].xv;
        ship.bullets[i].y += ship.bullets[i].yv;
        if (ship.bullets[i].x > canvas.width || ship.bullets[i].x < 0 || ship.bullets[i].y > canvas.height || ship.bullets[i].y < 0) {
            ship.bullets.splice[i];
        }
    }
}

function clearBullets(ship, canvas) {
    for (var i = 0; i < ship.bullets.length; i++) {
        if (ship.bullets[i].x > canvas.width || ship.bullets[i].x < 0 || ship.bullets[i].y > canvas.height || ship.bullets[i].y < 0) {
            ship.bullets.splice(i, 1);
        }
    }
}

function killEnemy(ship, enemy, distanceBetween, explosion, killCount, waveKill, waveCount, theScore) {
    var explodey = false;
    var whichExplodey;
    for (let i = 0; i < ship.bullets.length; i++) {
        for (let j = 0; j < enemy.ships.length; j++) {
            if (distanceBetween(ship.bullets[i].x, ship.bullets[i].y, enemy.ships[j].x, enemy.ships[j].y) < ship.bullets[i].r + enemy.ships[j].r) {
                // enemy.ships.splice(j,1);
                // explosion(enemy.ships[j]);
                killCount++;
                waveKill++;
                whichExplodey = enemy.ships[j];
                explosion(whichExplodey);
                enemy.ships.splice(j, 1);
                theScore += (100 * (waveCount / 2)) + 50;
            }
        }
    }
}

function enemyBulletsShoot(gameOverCondition, enemy, maxEnemyBullets, bulletSpeed, randomTimer) {
    if (gameOverCondition == false) {
        setTimeout(function () {
            for (let i = 0; i < enemy.ships.length; i++) {
                if (enemy.ships[i].bullets.length < maxEnemyBullets) {
                    enemy.ships[i].bullets.push({
                        x: enemy.ships[i].x + 4 / 3 + enemy.ships[i].r * Math.cos(enemy.ships[i].a),
                        y: enemy.ships[i].y - 4 / 3 * enemy.ships[i].r * Math.sin(enemy.ships[i].a),
                        xv: bulletSpeed * Math.cos(enemy.ships[i].a),
                        yv: -bulletSpeed * Math.sin(enemy.ships[i].a),
                        r: 2,
                    });

                }
            }
        }, randomTimer());
    }
}

function enemyBulletsDraw(enemy, c) {
    for (let i = 0; i < enemy.ships.length; i++) {
        for (var j = 0; j < enemy.ships[i].bullets.length; j++) {
            c.fillstyle = "purple";
            c.beginPath();
            c.arc(enemy.ships[i].bullets[j].x, enemy.ships[i].bullets[j].y, enemy.ships[i].bullets[j].r, 0, Math.PI * 2, false);
            c.fill();
        }
    }
}

function enemyBulletsMove(enemy, canvas) {
    for (let i = 0; i < enemy.ships.length; i++) {
        for (let j = 0; j < enemy.ships[i].bullets.length; j++) {
            enemy.ships[i].bullets[j].x += enemy.ships[i].bullets[j].xv;
            enemy.ships[i].bullets[j].y += enemy.ships[i].bullets[j].yv;
            if (enemy.ships[i].bullets[j].x > canvas.width || enemy.ships[i].bullets[j].x < 0 || enemy.ships[i].bullets[j].y > canvas.height || enemy.ships[i].bullets[j].y < 0) {
                enemy.ships[i].bullets.splice(j, 1);
            }
        }
    }
}

function damagePlayer(ship, enemy, distanceBetween, playerExplosion, playerHealth, gameOverCondition) {
    for (let k = 0; k < enemy.ships.length; k++) {
        for (let i = 0; i < enemy.ships[k].bullets.length; i++) {
            if (distanceBetween(enemy.ships[k].bullets[i].x, enemy.ships[k].bullets[i].y, ship.x, ship.y) < enemy.ships[k].bullets[i].r + ship.r) {
                // enemy.ships.splice(j,1);
                // explosion(enemy.ships[j]);
                playerExplosion();
                console.log('that\'s a hit!');
                if (gameOverCondition == false) {
                    const ph = document.getElementById(playerHealth);
                    ph && (ph.style.backgroundColor = "rgba(0,0,0,0)");
                    playerHealth--;
                }
            }
        }
    }
}

function clearEnemyBullets(enemy, canvas) {
    for (let j = 0; j < enemy.ships.length; j++) {
        for (let i = 0; i < enemy.ships[j].bullets.length; i++) {
            if (enemy.ships[j].bullets[i].x > canvas.width || enemy.ships[j].bullets[i].x < 0 || enemy.ships[j].bullets[i].y > canvas.height || enemy.ships[j].bullets[i].y < 0) {
                enemy.ships[j].bullets.splice(i, 1);
            }
        }
    }
}

function clearEnemies(enemy, gameOver, gameOverCondition, canvas) {
    if (gameOverCondition == false) {
        for (let i = 0; i < enemy.ships.length; i++) {
            if (enemy.ships[i].x > window.innerWidth ) {
                enemy.ships[i].x = 1;
            }
        
            if (enemy.ships[i].y > window.innerHeight ) {
                enemy.ships[i].y = 1;
            }
            if (enemy.ships[i].x < 0 ) {
                enemy.ships[i].x = window.innerWidth;
            }
        
            if (enemy.ships[i].y < 0 ) {
                enemy.ships[i].y = window.innerHeight;
            }
        }
    } else if (gameOver == true) {
        for (var i = 0; i < enemy.ships.length; i++) {
            if (enemy.ships[i].x > canvas.width || enemy.ships[i].x < 0  || enemy.ships[i].y > canvas.height || enemy.ships[i].y < 0) {
                enemy.ships.splice(i,1);
            }
        }
    }   
}

const combat = {
    player: {
        shoot: bulletsShoot,
        drawshots: bulletsDraw,
        moveshots: bulletsMove,
        clearshots: clearBullets,
        damage: damagePlayer,
        cycle: (ship, bulletSpeed, maxBullets, gameOver, gameOverCondition, enemy, canvas, c) => {
            combat.player.shoot(ship, bulletSpeed, maxBullets);
            combat.player.drawshots(ship, c);
            combat.player.moveshots(ship, canvas);
            combat.player.clearshots(ship, canvas);
            combat.npc.clear(enemy, gameOver, gameOverCondition, canvas);
        }
    },
    npc: {
        shoot: enemyBulletsShoot,
        drawshot: enemyBulletsDraw,
        moveshot: enemyBulletsMove,
        clearshot: clearEnemyBullets,
        kill: killEnemy,
        clear: clearEnemies,
        cycle: (ship, enemy, canvas, gameOverCondition, bulletSpeed, randomTimer, playerExplosion, playerHealth, distanceBetween, c, explosion, killCount, waveKill, waveCount, theScore) => {
            combat.npc.shoot(enemy, gameOverCondition,  bulletSpeed, randomTimer);
            combat.npc.kill(ship, enemy, distanceBetween, explosion, killCount, waveKill, waveCount, theScore);
            combat.npc.drawshot(enemy, c);
            combat.npc.moveshot(enemy, canvas);
            combat.npc.clearshot(enemy, canvas);
            combat.player.damage(ship, enemy, distanceBetween, playerExplosion, playerHealth, gameOverCondition);
        }
    },

    cycle: () => {
        combat.player.cycle();
        combat.npc.cycle();
    }
};