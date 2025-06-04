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
let playerX = 50, playerY = 220, velocityY = 0, gravity = 0.45, jumping = false;
let speed = 6; // Velocidade inicial mais baixa
let score = 0, timeCounter = 0;
let lastTime = Date.now();
let cactusSpawnInterval = 900; // Spawn de cactos menos frequente
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
        velocityY = -10;
        jumping = true;
        jumpSound.play();
    }
    if (e.code === 'Enter' && !gameOver) {
        // Reinicia o jogo ao apertar Enter após o game over
        // Use location.href para garantir recarregamento completo
        location.href = location.href;
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

    if (gameOver) {
        // Ao dar game over, força o fundo noturno
        ctx.globalAlpha = 1;
        ctx.drawImage(bgNight, 0, 0, canvas.width, canvas.height);
        background = bgNight;
    } else if (score >= 100) {
        dayNightTransition = Math.min(1, dayNightTransition + 1);
        ctx.globalAlpha = 1 - dayNightTransition;
        ctx.drawImage(bgDay, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = dayNightTransition;
        background = bgNight;
    } else {
        dayNightTransition = Math.max(0, dayNightTransition - 1);
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
        // Fundo semi-transparente para destacar o Game Over
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#fff';
        ctx.fillRect(canvas.width/2 - 180, canvas.height/2 - 60, 360, 120);
        ctx.restore();

        // Texto Game Over centralizado
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'black';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Pressione Enter para jogar novamente', canvas.width/2, canvas.height/2 + 40);
        ctx.textAlign = 'start';
        ctx.restore();
    }
}

function update() {
    if (gameOver) return;

    let now = Date.now();
    if (now - lastTime >= 100) {
        score++;
        lastTime = now;
        if (score % 100 === 0 && cactusSpawnInterval > 150) { // Dificuldade aumenta a cada 150 pontos
            cactusSpawnInterval -= 50;
            speed += 0.4;
            gravity += 0.01;
        }
    }

    playerY += velocityY;
    velocityY += gravity;

    if (playerY > 250) {
        playerY = 250;
        jumping = false;
    }

    if (!gameOver) {
        cactos.forEach((cacto, idx) => {
            cacto.x -= speed;
            if (cacto.x < -50) {
                // Garante que o novo cacto fique pelo menos 350px distante do anterior mais próximo
                let maxX = Math.max(...cactos.map((c, i) => i !== idx ? c.x : -Infinity));
                let minDistance = 300 + Math.random() * 150; // Distância mínima aumentada
                cacto.x = Math.max(canvas.width, maxX + minDistance);
                cacto.index = Math.floor(Math.random() * cactusImages.length);
            }
        });
    }

    // Redireciona para gameover.html ao perder imediatamente
    if (cactos.some((cacto, idx) => checkCollision(cacto.x, cacto.index)) && !gameOver) {
        gameOver = true;
        try {
            gameOverSound.pause();
            gameOverSound.currentTime = 0;
            gameOverSound.play();
        } catch (e) {}
        try {
            saveScore(score);
        } catch (e) {
            console.error('Erro ao salvar score:', e);
        }
        console.log('Redirecionando para gameover.html');
        window.location.href = 'gameover.html';
    }
}

// Crie dois canvases fora da tela para análise de pixel
const collisionCanvas1 = document.createElement('canvas');
const collisionCanvas2 = document.createElement('canvas');
collisionCanvas1.width = 56;
collisionCanvas1.height = 64;
collisionCanvas2.width = 50;
collisionCanvas2.height = 50;
const colCtx1 = collisionCanvas1.getContext('2d');
const colCtx2 = collisionCanvas2.getContext('2d');

// Substitua a função checkCollision por esta:
function checkCollision(cactusXPos, cactusIdx) {
    let dinoW = 56, dinoH = 64;
    let cactusW = 50, cactusH = 50;
    let dinoX = playerX, dinoY = playerY - 44;
    let cactusY = 220;

    // Verifica colisão retangular primeiro (rápido)
    if (
        cactusXPos < dinoX + dinoW &&
        cactusXPos + cactusW > dinoX &&
        dinoY < cactusY + cactusH &&
        dinoY + dinoH > cactusY
    ) {
        // Calcula a área de interseção
        let overlapX = Math.max(dinoX, cactusXPos);
        let overlapY = Math.max(dinoY, cactusY);
        let overlapW = Math.min(dinoX + dinoW, cactusXPos + cactusW) - overlapX;
        let overlapH = Math.min(dinoY + dinoH, cactusY + cactusH) - overlapY;

        // Limpa e desenha as imagens nas áreas relativas
        colCtx1.clearRect(0, 0, overlapW, overlapH);
        colCtx2.clearRect(0, 0, overlapW, overlapH);
        colCtx1.drawImage(player, overlapX - dinoX, overlapY - dinoY, overlapW, overlapH, 0, 0, overlapW, overlapH);
        colCtx2.drawImage(cactusImages[cactusIdx], overlapX - cactusXPos, overlapY - cactusY, overlapW, overlapH, 0, 0, overlapW, overlapH);

        // Pega os dados de pixel
        let data1 = colCtx1.getImageData(0, 0, overlapW, overlapH).data;
        let data2 = colCtx2.getImageData(0, 0, overlapW, overlapH).data;

        // Verifica se há pixels não transparentes nos dois objetos
        for (let i = 3; i < data1.length; i += 4) {
            if (data1[i] > 0 && data2[i] > 0) {
                return true;
            }
        }
    }
    return false;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
