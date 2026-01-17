// @ts-check

function overlayRefresh(waveCount, theScore, killCount) {
    const wave = document.getElementById('wave');
    const score = document.getElementById('score');
    const kills = document.getElementById('kills');
    wave && (wave.innerHTML = waveCount);
    score && (score.innerHTML = theScore);
    kills && (kills.innerHTML = killCount);
}

const hud = {
    draw: overlayRefresh,
};