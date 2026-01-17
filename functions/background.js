// @ts-check

const SPEEDS = [0.3, 0.5, 0.70, 0.78, 0.86, 0.94];

function starsPlace(stars, starCount, canvas) {
    for (let i = 0; stars.length < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: SPEEDS[Math.floor(Math.random() * SPEEDS.length)],
            //temperature, random between 100 and 200
            t: Math.floor(Math.random() * 101) + 100,
            up: true,
            flux: (SPEEDS[Math.floor(Math.random() * SPEEDS.length)] * 10)
        });
    }
}

function starsDraw(stars, c) {
    c.lineWidth = 1;

    for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const strokeColor = starTwinkleColor(s);
        c.strokeStyle = strokeColor;
        c.fillStyle = strokeColor;
        if (i === 1) console.log(strokeColor);
        c.beginPath();
        c.arc(s.x, s.y, .3, 0, Math.PI * 2, false);
        c.stroke();
        c.fill();
    }
}

//move stars opposite player angle of momentum based on player speed - cam not needed
function starsMove(stars, ship, canvas) {
    stars.forEach(star => {
        star.x -= ship.thrust.x * star.speed;
        star.y -= ship.thrust.y * star.speed;
        if (star.x < 0) {
            star.x = canvas.width;
        }
        if (star.x > canvas.width) {
            star.x = 0;
        }
        if (star.y < 0) {
            star.y = canvas.height;
        }
        if (star.y > canvas.height) {
            star.y = 0;
        }
    });
}

function starTwinkleColor(s) {
    // value in [0,1], different per star because x/y differ
    const min = 100;
    const max = 255;

    if (s.t >= max) {
        s.up = false;
        s.t -= s.flux;
    }

    if (s.t <= min) {
        s.up = true;
        s.t += s.flux;
    }

    if (s.t < max && s.up) {
        s.t += s.flux;
    }

    if (s.t > min && !s.up) {
        s.t -= s.flux;
    }
    const str = `rgb(${s.t},${s.t},${s.t})`;
    return str;
}


function spaceDraw(canvas, c) {
    c.fillStyle = "black";
    c.fillRect(0, 0, canvas.width, canvas.height);
};

const bgdraw = (canvas, ship, stars, starCount, c) => {
    spaceDraw(canvas, c);
    starsPlace(stars, starCount, canvas);
    starsDraw(stars, c);
    starsMove(stars, ship, canvas);
}

const background = {
    draw: bgdraw
};