// @ts-check

function explosion(dis, enemy, j, c, explosionCount) {
    for(let k=0; k < explosionCount; k++) {
        enemy.ships[j].explosions.push({
            x: dis.x,
            y: dis.y,
        });
        for(let l=0; l < dis.explosions.length; l++){
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

function gameOver(playerHealth, gameOverCondition, theScore, maxEnemies) {
    if (playerHealth <= 0) {
        gameOverCondition = true;
        let go = document.getElementById('gameover');
        let fs = document.getElementById('finalscore');
        fs && (fs.innerHTML = theScore);
        go && (go.style.visibility = "visible");
        maxEnemies = 0;
    }
}