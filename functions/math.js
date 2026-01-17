// @ts-check

function distanceBetween (x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x2-x1, 2) * Math.pow(y2 - y1, 2));
}

function randomTimer() {
    return (Math.random()*3000)+500;
}

function calculateAccelRatio (x,y,d, accelRatio, kdr) {
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

const math = {
    dbtwn: distanceBetween,
    rt: randomTimer,
    car: calculateAccelRatio,
};