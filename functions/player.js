// @ts-check

function shipDraw(c, ship, shipSize, gameOverCondition, showBounding) {
    if (gameOverCondition == false) {
        c.strokeStyle = "white",
            c.lineWidth = shipSize / 10;
        c.beginPath();
        c.moveTo( //nose of ship
            ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
        );
        c.lineTo( //rear left
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
        );
        c.lineTo( //rear right
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
        );
        c.closePath();
        c.stroke();
        c.fillStyle = "skyblue";
        c.fillRect(ship.x - 1, ship.y - 1, 2, 2);

        if (showBounding) {
            c.strokeStyle = "lime";
            c.beginPath();
            c.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
            c.stroke();
        }
    }
    else if (gameOverCondition == true) {

    }
}
function thrusterDraw(c, ship, shipSize) {
    // console.log("drawing thruster");
    if (!ship.accel && !ship.decel) { return; }
    c.strokeStyle = "orange",
        c.lineWidth = shipSize / 10;
    c.beginPath();
    c.moveTo(
        (ship.x - 2) - ship.r * (2 / 3 * Math.cos(ship.a) + 1 * Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 1 * Math.cos(ship.a))
    );
    c.lineTo(
        ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
        (ship.y - 7) + ship.r * 6 / 3 * Math.sin(ship.a)
    );
    c.lineTo(
        (ship.x - 2) - ship.r * (2 / 3 * Math.cos(ship.a) - .01 * Math.sin(ship.a)),
        ship.y + ship.r * (3 / 6 * Math.sin(ship.a) + .01 * Math.cos(ship.a))
    )
    c.lineTo(
        ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
        (ship.y + 7) + ship.r * 6 / 3 * Math.sin(ship.a)
    );
    c.lineTo(
        (ship.x - 2) - ship.r * (2 / 3 * Math.cos(ship.a) - 1 * Math.sin(ship.a)),
        ship.y + ship.r * (3 / 6 * Math.sin(ship.a) + 1 * Math.cos(ship.a))
    )
    c.closePath();
    c.stroke();
}

function shipRotation(controller, ship, handling, angle) {
    // console.log('props: ', leftTurn, rightTurn, ship, handling, angle);
    if (controller.leftTurn) {
        if (ship.angle == 360) {
            ship.angle = 0
            console.log('Angle reset to 0 from 360');
        }
        ship.angle += ship.handling;
        ship.a = ship.angle / 180 * Math.PI; // convert to radians
    }

    if (controller.rightTurn) {
        if (ship.angle == 0) {
            ship.angle = 360
            console.log('Angle reset to 360 from 0');
        }
        ship.angle -= ship.handling;
        ship.a = ship.angle / 180 * Math.PI;
    }

}

function shipAcceleration(c, ship, shipSize, acceleration) {
    // console.log(ship)
    if (ship.accel) {
        thrusterDraw(c, ship, shipSize);
        if (ship.thrust.x < ship.speedCap && ship.thrust.x > -ship.speedCap) {
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

function shipDeceleration(ship, d) {
    // console.log(dR);
    if (ship.decel) {
        ship.thrust.x -= d * ship.thrust.x;
        ship.thrust.y -= d * ship.thrust.y;
    }

    if (ship.thrust.x < 1 && ship.thrust.x > -1 && ship.thrust.y < 1 &&
        ship.thrust.y > -1) {
        ship.thrust.x = 0;
        ship.thrust.y = 0;
    }
}

function thrustLimiter(ship, x, y, s) {
    if (x >= s) { ship.thrust.x = s - .5 };
    if (x <= -s) { ship.thrust.x = -s + .5 };
    if (y >= s) { ship.thrust.y = s - .5 };
    if (y <= -s) { ship.thrust.y = -s + .5 };
}

function reverseAngle(ship, controller) {
    if (controller.flip) {
        let currentAOM = Math.atan2(-ship.thrust.y, ship.thrust.x) * 180 / Math.PI;
        let targetA = Math.floor((currentAOM + 180) % 360);
        if (ship.angle !== targetA || Math.abs(ship.angle - targetA) < ship.handling) {
            if (ship.angle < 0) {
                ship.angle = 360 + ship.angle;
            }

            if (ship.angle > 360) {
                ship.angle -= 360;
            }
            let angleDifference = targetA - ship.angle;
            if (angleDifference > 180) {
                angleDifference -= 360;
            } else if (angleDifference < -180) {
                angleDifference += 360;
            }
            ship.angle += angleDifference * 0.2;
        } else {
            ship.angle = targetA;
        }

        ship.a = ship.angle / 180 * Math.PI;
    }
}

function playerExplosion(ship, explosionCount, c) {
    for (let i = 0; i < explosionCount; i++) {
        ship.explosions.push({
            x: ship.x,
            y: ship.y,
        });
        c.beginPath()
        c.strokeStyle = "red";
        c.fillStyle = "orange";
        c.arc((ship.x - 20) + Math.random() * 40, (ship.y - 20) + Math.random() * 40, ship.r, 0, Math.PI * 2, false);
        c.fill();
        c.stroke();
        c.closePath();
    }
    ship.explosions = [];
    // enemy.ships.splice(j,1);  
}

function shipScreenWrap() {
    // OLD behavior: wrap around the screen edges.
    // With a camera locked to the player, the "world" is effectively unbounded,
    // so wrapping is disabled.
}

function shipTurnToTarget(ship) {
    const body = ship.bodyLock;
    if (!controller.target || !body) { return; }
    const desiredAngle = Math.atan2(body.y - ship.y, body.x - ship.x) * 180 / Math.PI;
    let angleDifference = desiredAngle - ship.angle;

    if (angleDifference > 180) {
        angleDifference -= 360;
    } else if (angleDifference < -180) {
        angleDifference += 360;
    }

    if (Math.abs(angleDifference) < ship.handling) {
        ship.angle = desiredAngle;
    }

    ship.angle += Math.sign(angleDifference) * ship.handling;
    ship.a = ship.angle / 180 * Math.PI;
}

const draw = (c, ship, shipSize, gameOverCondition, showBounding) => {
    shipDraw(c, ship, shipSize, gameOverCondition, showBounding);
    thrusterDraw(c, ship, shipSize);
}

const player = {
    draw,
    rot: shipRotation,
    accel: shipAcceleration,
    lim: thrustLimiter,
    decel: shipDeceleration,
    wrap: shipScreenWrap,
    flip: reverseAngle,
    target: shipTurnToTarget,
    cycle: (c, ship, shipSize, gameOverCondition, showBounding, x, y, speedCap, acceleration, d, angle, controller) => {
        player.draw(c, ship, shipSize, gameOverCondition, showBounding);
        player.rot(controller, ship, angle);
        player.flip(ship, controller);
        player.target(ship);
        player.lim(ship, x, y, speedCap);
        player.accel(c, ship, shipSize, acceleration);
        player.decel(ship, d);
        // player.wrap(); // disabled (unbounded world)
    }
};

