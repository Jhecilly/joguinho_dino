const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = new Image();
player.src = 'assets/' + (localStorage.getItem('selectedCharacter') || 'char1.png');

let bgDay = new Image();
bgDay.src = 'assets/bg-day.png';
let bgNight = new Image();
bgNight.src = 'assets/bg-night.png';

let cactusImages = [new Image(), new Image()];
cactusImages[0].src = 'assets/flower1.png';
cactusImages[1].src = 'assets/flower2.png';

let jumpSound = new Audio('assets/jump.mp3');
let gameOverSound = new Audio('assets/gameover.mp3');

let playerX = 50, playerY = 264, velocityY = 0, gravity = 0.5, jumping = false;
let cactusX = 1200, cactusIndex = 0, speed = 6;
let score = 0, timeCounter = 0;

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !jumping) {
        velocityY = -10;
        jumping = true;
        jumpSound.play();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    window.location.reload();
});

function saveScore(score) {
    const playerName = prompt("Insira seu nome:");
    if (playerName) {
        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScores.push({ name: playerName, score: score });
        localStorage.setItem('highScores', JSON.stringify(highScores));
        alert("Pontuação salva com sucesso!");
    } else {
        alert("Nome não inserido. Pontuação não salva.");
    }
}

function update() {
    // Aumenta dificuldade com o tempo
    timeCounter++;
    if (timeCounter % 1000 === 0) {
        speed += 0.5;
    }

    // Pulo e gravidade
    playerY += velocityY;
    velocityY += gravity;
    if (playerY > 264) {
        playerY = 264;
        jumping = false;
    }

    // Movimento dos cactos
    cactusX -= speed;
    if (cactusX < -50) {
        cactusX = 1200;
        cactusIndex = (cactusIndex + 1) % cactusImages.length;
        score++;
    }

    // Colisão por pixel colorido (simplificada)
    if (
        cactusX < playerX + 50 &&
        cactusX + 50 > playerX &&
        playerY + 36 > 264 // mesma altura
    ) {
        gameOverSound.play();
        saveScore(score);
        alert('Game Over! Pontuação: ' + score);
        window.location.reload();
    }
}

function draw() {
    // Fundo de acordo com pontos
    let background = score < 50 ? bgDay : bgNight;
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Personagem
    ctx.drawImage(player, playerX, playerY - 36, 50, 50);

    // Cacto
    ctx.drawImage(cactusImages[cactusIndex], cactusX, 220, 50, 50);

    // Pontuação
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Pontuação: ' + score, 10, 30);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
