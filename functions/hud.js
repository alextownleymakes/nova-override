// @ts-check

function overlayRefresh(ship) {
    const coords = document.getElementById('coords');
    const dist = document.getElementById('distance');
    const countdown = document.getElementById('countdown');
    coords && (coords.innerHTML = ship.x.toFixed(0) + ', ' + ship.y.toFixed(0));
    dist && (dist.innerHTML = ship.bodyLock ? ship.bodyLock.name : 'N/A');

    //a timer that counts to 60 and returns the current ship coords at that exact moment as a string
    let timer = 60;
    setInterval(() => {
        timer--;
        if (timer < 0) {
            timer = 60;
        }
        countdown && (countdown.innerHTML = timer.toString());
    }, 1000);

    //score increments by 1 every second

}

const hud = {
    draw: overlayRefresh,
};