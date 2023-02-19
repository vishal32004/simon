'use strict';

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Sound = function () {
    function Sound(context) {
        _classCallCheck(this, Sound);

        this.context = context;
    }

    Sound.prototype.setup = function setup() {
        this.oscillator = this.context.createOscillator();
        this.gainNode = this.context.createGain();

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);
        this.oscillator.type = 'sine';
    };

    Sound.prototype.play = function play(value) {
        this.setup();

        this.oscillator.frequency.value = value;
        this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(1, this.context.currentTime + 0.01);

        this.oscillator.start(this.context.currentTime);
        this.stop(this.context.currentTime);
    };

    Sound.prototype.stop = function stop(time = 1) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + time);
        this.oscillator.stop(this.context.currentTime + time);
    };

    return Sound;
}();

var context = false;

function attemptCreateContext() {
    if (context) {
        return context;
    } else {
        context = new(window.AudioContext || window.webkitAudioContext || false)();
    }
    if (!context) {
        alert('Sorry, but the Web Audio API is not supported by your browser.' +
            ' Please, consider downloading the latest version of ' +
            'Google Chrome or Mozilla Firefox');
    }
}

function playSound(note, time = 1000) {
    attemptCreateContext();
    var sound = new Sound(context);
    sound.play(note);
    sound.stop(time / 1000);
}

var defaults = {
    "speed": 1000,
    "round": 1,
    "userInputs": 0
};

var currentGame = Object.assign({}, defaults);
var strict = false;
var started = false;

function Diamond(sound, element) {
    this.element = document.getElementById(element);
    this.chime = function () {
        playSound(sound, currentGame.speed)
    };
    this.cover = this.element.querySelector('.cover');
}

Diamond.prototype.hideGlow = function () {
    this.element.classList.remove("glowing");
}

Diamond.prototype.glow = function () {
    var glowDuration = currentGame.speed - 100;
    this.hideGlow();
    this.element.classList.add("glowing");
    this.cover.style.animationDuration = currentGame.speed;
    var glowing = this;
    setTimeout(function () {
        glowing.hideGlow()
    }, glowDuration);
}

var blueDiamond = new Diamond(587.33, "blue-diamond");
var pinkDiamond = new Diamond(659.25, "pink-diamond");
var yellowDiamond = new Diamond(739.99, "yellow-diamond");
var whiteDiamond = new Diamond(880.00, "white-diamond");
var diamonds = [pinkDiamond, yellowDiamond, whiteDiamond, blueDiamond];

var gameElements = {
    "round": document.getElementById("round"),
    "diamonds": document.getElementById("diamonds"),
    "winMsg": document.getElementById("winMessage"),
    "forgiving": document.getElementById("forgiving"),
    "strict": document.getElementById("strict")
}

var sequence = {
    "current": [],
    "playing": false,
    "index": 0,
    "play": function () {
        this.playing = true;
        currentGame.userInputs = 0;
        var _this = this;

        setTimeout(function () {
            var currentDiamond = _this.current[_this.index];
            currentDiamond.glow();
            currentDiamond.chime();
            _this.index++;
            if (_this.index < currentGame.round) {
                _this.play();
            } else {
                _this.playing = false;
            }
        }, currentGame.speed)
    },

    "generate": function () {
        this.index = 0;
        this.current = [];
        var currentSequence = this.current;
        var easyCheatin = [];
        for (var j = 0; j < 20; j++) {
            var randomDiamond = diamonds[Math.floor(Math.random() * diamonds.length)];
            currentSequence.push(randomDiamond);
            easyCheatin.push(randomDiamond.element.id);
        }
        console.log(easyCheatin);
    }
};

function updateRound() {
    gameElements.round.innerHTML = currentGame.round;
}

function setMode(mode) {
    var other = (mode === "strict") ? 'forgiving' : 'strict';
    strict = (mode === "strict") ? true : false;
    gameElements[other].classList.remove("active");
    gameElements[mode].classList.add("active");
}

function restart() {
    if (started === false) {
        started = true;
        document.getElementById("playMsg").innerHTML = "RESTART?";
        document.getElementById("playIcon").innerHTML = "&#8635;";
        document.getElementById("replay").classList.remove("playMe");
    }
    currentGame = Object.assign({}, defaults);
    updateRound();
    sequence.generate();
    sequence.play();
}

function checkWin() {
    if (currentGame.userInputs >= sequence.current.length) {
        showWin();
        setTimeout(function () {
            restart()
        }, 7000);
    } else if (currentGame.userInputs >= currentGame.round) {
        currentGame.round++;
        updateRound();
        currentGame.speed -= 25;
        sequence.index = 0;
        sequence.play();
    }
}

function guess(diamond) {
    if (sequence.current.length === 0) {
        diamond.chime();
    }
    if (sequence.playing || !started) {
        return;
    }
    if (sequence.current[currentGame.userInputs] === diamond) {
        currentGame.userInputs++;
        diamond.chime();
        checkWin();

    } else {
        errorChime();
        if (strict === true) {
            setTimeout(function () {
                restart();
            }, 1100);
        } else {
            currentGame.userInputs = 0;
            sequence.index = 0;
            setTimeout(function () {
                sequence.playing = false;
                sequence.play();
            }, 1100);
        }
    }
}

function allGlow() {
    pinkDiamond.glow();
    blueDiamond.glow();
    yellowDiamond.glow();
    whiteDiamond.glow();
}

function errorChime() {
    sequence.playing = true;
    allGlow();
    playSound(261.63);
    setTimeout(function () {
        playSound(246.94);
    }, 500);
    setTimeout(function () {
        playSound(220.00);
    }, 1000);
}

function showWin() {
    hideWin();
    allGlow();
    gameElements.diamonds.classList.add("winner");
    document.getElementById("info").classList.add("winner");
    gameElements.winMsg.classList.add("winner");
    setTimeout(function () {
        winOutro()
    }, 3000);
}

function hideWin() {
    gameElements.diamonds.classList.remove("winner");
    gameElements.winMsg.classList.remove("winner");
    gameElements.winMsg.classList.remove("outro");
    gameElements.diamonds.classList.remove("outro");
    document.getElementById("info").classList.remove("winner");
    document.getElementById("info").classList.remove("outro");
}

function winOutro() {
    gameElements.winMsg.classList.add("outro");
    document.getElementById("info").classList.add("outro");
    gameElements.diamonds.classList.add("outro");
    setTimeout(function () {
        allGlow()
    }, 500);
    setTimeout(function () {
        hideWin()
    }, 3000);
}

document.onkeydown = function (e) {
    e = e || window.event;
    if (sequence.playing) {
        return;
    }
    if (e.key === 'ArrowUp' || e.key === 'w') {
        guess(whiteDiamond);
        whiteDiamond.glow();
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        guess(blueDiamond);
        blueDiamond.glow();
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        guess(yellowDiamond);
        yellowDiamond.glow();
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        guess(pinkDiamond);
        pinkDiamond.glow();
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const replayButton = document.getElementById('replay');
    replayButton.addEventListener('click', restart);

    const diamondElems = document.querySelectorAll('.diamond');
    const diamondObj = {
        'white-diamond': whiteDiamond,
        'yellow-diamond': yellowDiamond,
        'blue-diamond': blueDiamond,
        'pink-diamond': pinkDiamond,
    }

    Array.from(diamondElems).forEach(diamondElem => {
        diamondElem.addEventListener('click', function () {
            guess(diamondObj[diamondElem.id]);
        });
    });

    Array.from(document.querySelectorAll('#strict, #forgiving')).forEach(option => {
        option.addEventListener('click', function () {
            setMode(option.id);
        });
    });
});

$(document).on("touchstart", ".diamond", function(){
    $(this).removeClass("glowing");
 });
 