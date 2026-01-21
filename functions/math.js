// @ts-check

const AU_TO_IGU = 0.847;

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

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const log10 = (x) => Math.log(x) / Math.LN10;
const pow10 = (x) => Math.pow(10, x);
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
