// @ts-check

function starsPlace(stars, starCount, canvas) {
    for (let i = 0; stars.length < starCount; i++) {
        stars.push ({
            x: Math.random()*canvas.width,
            y: Math.random()*canvas.height
        });
    }
}

function starsDraw(stars, c) {
    for (let i = 0; i < stars.length; i++) {
        c.strokeStyle = "white";
        c.lineWidth = "1";
        c.beginPath();

        c.arc(stars[i].x,stars[i].y,.3,0,Math.PI*2,false);
        c.stroke();
    }
}

function spaceDraw (canvas, c) {
    c.fillStyle = "black";
    c.fillRect (0, 0, canvas.width, canvas.height);
}

const bgdraw = (canvas, stars, starCount, c) => {
    spaceDraw(canvas, c);
    starsPlace(stars, starCount, canvas);
    starsDraw(stars, c);
}

const background = {
   draw: bgdraw
};