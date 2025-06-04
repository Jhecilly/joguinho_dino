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

// Ajuste as posições verticais
let playerX = 50, playerY = 220, velocityY = 0, gravity = 0.6, jumping = false;
let speed = 8; // Velocidade inicial mais alta
let score = 0, timeCounter = 0;
let lastTime = Date.now();
let cactusSpawnInterval = 600; // Spawn de cactos mais frequente
let lastCactusSpawn = Date.now();
let gameOver = false;
let dayNightTransition = 0;

let cactos = [
    { x: 1200, index: 0 },
    { x: 1500, index: 1 },
    { x: 1800, index: 0 }  // Adiciona um terceiro cacto
];

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !jumping && !gameOver) {
        velocityY = -12; // Força do pulo um pouco menor
        jumping = true;
        jumpSound.play();
    }
    if (e.code === 'Enter' && gameOver) {
        window.location.reload();
    }
});

function saveScore(score) {
    const playerName = localStorage.getItem('playerName') || prompt("Insira seu nome:");
    if (playerName) {
        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScores.push({ name: playerName, score: score });
        localStorage.setItem('highScores', JSON.stringify(highScores));
        alert("Pontuação salva com sucesso!");
    } else {
        alert("Nome não inserido. Pontuação não salva.");
    }
}

function draw() {
    // Interpolação entre dia e noite
    let background = bgDay;
    if (score >= 100) {
        dayNightTransition = Math.min(1, dayNightTransition + 1); // Transição mais lenta
        ctx.globalAlpha = 1 - dayNightTransition;
        ctx.drawImage(bgDay, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = dayNightTransition;
        background = bgNight;
    } else {
        dayNightTransition = Math.max(0, dayNightTransition - 1); // Transição mais lenta
        background = bgDay;
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Personagem
    ctx.drawImage(player, playerX, playerY - 44, 56, 64);

    // Cacto
    cactos.forEach(cacto => {
        ctx.drawImage(cactusImages[cacto.index], cacto.x, 220, 50, 50);
    });

    // Pontuação
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Pontuação: ' + score, 10, 30);

    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        ctx.textAlign = 'start';
    }
}

function update() {
    if (gameOver) return;

    let now = Date.now();
    if (now - lastTime >= 100) {
        score++;
        lastTime = now;
        if (score % 50 === 0 && cactusSpawnInterval > 300) {
            cactusSpawnInterval -= 100;
            speed += 0.8;
            gravity += 0.03;
        }
    }

    playerY += velocityY;
    velocityY += gravity;

    if (playerY > 250) {
        playerY = 250;
        jumping = false;
    }

    if (!gameOver) {
        cactos.forEach(cacto => {
            cacto.x -= speed;
            if (cacto.x < -50) {
                cacto.x = canvas.width + Math.random() * 200;
                cacto.index = Math.floor(Math.random() * cactusImages.length);
            }
        });
    }

    if (cactos.some(cacto => checkCollision(cacto.x)) && !gameOver) {
        gameOver = true;
        gameOverSound.play();
        setTimeout(() => {
            saveScore(score);
        }, 300);
    }
}

function checkCollision(cactusXPos) {
    let dinoW = 56, dinoH = 64;
    let cactusW = 50, cactusH = 50;
    let dinoX = playerX, dinoY = playerY - 44;
    let cactusY = 220;

    return cactusXPos < dinoX + dinoW &&
           cactusXPos + cactusW > dinoX &&
           dinoY < cactusY + cactusH &&
           dinoY + dinoH > cactusY;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
