function off() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("navv").style.display = "block";
    document.getElementById('musc').play();
    document.getElementById('musc').volume = 0.03;
}

function bell() {
    var bell = './assets/mp3/bell.mp3';
    var numba = Math.random();
    if (numba <= 0.3) {
        var audio = new Audio(bell);
        audio.volume = 0.1
        audio.play();
    }
}
document.addEventListener('click', bell);