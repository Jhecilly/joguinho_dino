const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Carregamento simples das imagens (sem crossOrigin)
let player = new Image();
player.src = 'assets/' + (localStorage.getItem('selectedCharacter') || 'char1.png');

let bgDay = new Image();
bgDay.src = 'assets/bg-day.png';
let bgNight = new Image();
bgNight.src = 'assets/bg-night.png';

let cactusImages = [new Image(), new Image()];
cactusImages[0].src = 'assets/flower1.png';
cactusImages[1].src = 'assets/flower2.png';

let coinImage = new Image();
coinImage.src = 'assets/coin.png';

let jumpSound = new Audio('assets/jump.mp3');
let gameOverSound = new Audio('assets/gameover.mp3');
let coinSound = new Audio('assets/coin.mp3');
gameOverSound.load(); // Pré-carrega o som

// Ajuste as posições verticais
let playerX = 50, playerY = 220, velocityY = 0, gravity = 0.45, jumping = false;
let speed = 6; // Velocidade inicial mais baixa
let score = 0, timeCounter = 0;
let lastTime = Date.now();
let cactusSpawnInterval = 900; // Spawn de cactos menos frequente
let lastCactusSpawn = Date.now();
let gameOver = false;
let dayNightTransition = 0;

let coins = [];
let coinSpawnTimer = 0;
let coinValue = 50; // Pontos extras por moeda

let cactos = [
    { x: 1200, index: 0 },
    { x: 1500, index: 1 },
    { x: 1800, index: 0 }  // Adiciona um terceiro cacto
];

// Adicionar após as declarações de variáveis existentes
let coinCombo = 0;
let lastCoinTime = 0;
let comboTimeout = 2000; // 2 segundos para manter o combo

// Ajustar estas variáveis no início
let difficultyLevel = 1;
let maxDifficulty = 5;
let baseCactusInterval = 1000; // Diminuído de 1200 para 1000
let baseSpeed = 6; // Aumentado de 5 para 6
let baseJumpForce = -10;
let maxSpeed = 10; // Aumentado de 8 para 10
let isDayTime = true;
let transitionProgress = 0;

// Adicionar após as declarações de variáveis
let isPaused = false;

// Adicionar após as outras variáveis globais
let gameOverBg = null;

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !jumping && !gameOver) {
        // Ajusta força do pulo baseado na velocidade atual
        velocityY = baseJumpForce - (speed - baseSpeed) * 0.2;
        jumping = true;
        jumpSound.play();
    }
    if (e.code === 'Enter' && gameOver) { // Modificado para verificar se está em game over
        location.reload(); // Usa reload ao invés de href
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!gameOver) {
            isPaused = !isPaused;
            if (isPaused) {
                // Pausa todos os sons quando o jogo for pausado
                jumpSound.pause();
                coinSound.pause();
            }
        }
    }
});

function testLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        console.error('localStorage não está disponível:', e);
        return false;
    }
}

// No início do arquivo, após a declaração do canvas
const playerName = localStorage.getItem('playerName');
if (!playerName) {
    window.location.href = 'select.html';
}

// Modifique a função saveScore para usar o nome já salvo
function saveScore(score) {
    const playerName = localStorage.getItem('playerName');
    if (playerName) {
        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScores.push({ name: playerName, score: score });
        localStorage.setItem('highScores', JSON.stringify(highScores));
        alert("Pontuação salva com sucesso!");
    } else {
        alert("Nome não encontrado. Retornando à tela de seleção...");
        window.location.href = 'select.html';
    }
}

let highScore = Math.max(...(JSON.parse(localStorage.getItem('highScores')) || []).map(s => s.score), 0);

// Adicione esta nova função
function drawTextWithStroke(text, x, y) {
    ctx.font = '16px "Press Start 2P"'; // Reduzido para 16px para ficar mais elegante
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;    // Reduzido para 3 para ficar mais delicado
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#444';
    ctx.fillText(text, x, y);
}

// Modifique a parte da pontuação na função draw
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        if (!gameOverBg) {
            gameOverBg = new Image();
            gameOverBg.src = 'assets/gameover.png';
            gameOverBg.onload = () => {
                ctx.drawImage(gameOverBg, 0, 0, canvas.width, canvas.height);
                // Score em lilás claro
                ctx.font = '24px "Press Start 2P"';
                ctx.fillStyle = '#d4b3f5';
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText(`${score}`, canvas.width/2, canvas.height - 60);
                ctx.fillText(`${score}`, canvas.width/2, canvas.height - 60);
            };
        } else if (gameOverBg.complete) {
            ctx.drawImage(gameOverBg, 0, 0, canvas.width, canvas.height);
            ctx.font = '24px "Press Start 2P"';
            ctx.fillStyle = '#d4b3f5';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(`${score}`, canvas.width/2, canvas.height - 60);
            ctx.fillText(`${score}`, canvas.width/2, canvas.height - 60);
        }
        return;
    }

    // Desenha o fundo do jogo (dia/noite)
    // Nova lógica de transição dia/noite
    const dayPhase = Math.floor(score / 100) % 2; // Alterna entre 0 (dia) e 1 (noite)
    const targetDayTime = dayPhase === 0;
    
    if (targetDayTime !== isDayTime) {
        transitionProgress = Math.min(1, transitionProgress + 0.02); // Transição mais suave
        if (transitionProgress >= 1) {
            isDayTime = targetDayTime;
            transitionProgress = 0;
        }
    }

    ctx.globalAlpha = isDayTime ? (1 - transitionProgress) : transitionProgress;
    ctx.drawImage(bgDay, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = isDayTime ? transitionProgress : (1 - transitionProgress);
    ctx.drawImage(bgNight, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Personagem (com verificação de carregamento)
    if (player.complete) {
        ctx.drawImage(player, playerX, playerY - 44, 56, 64);
    }

    // Cacto (com verificação de carregamento)
    cactos.forEach(cacto => {
        if (cactusImages[cacto.index].complete) {
            ctx.drawImage(cactusImages[cacto.index], cacto.x, 220, 50, 50);
        }
    });

    // Moedas
    coins.forEach(coin => {
        ctx.drawImage(coinImage, coin.x, coin.y, 16, 16);
    });

    // Pontuação e Record com novo estilo
    ctx.fillStyle = '#d4b3f5'; // Lilás mais claro
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // Função helper para texto com borda
    function drawScore(text, x, y) {
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffffa4'; // Cor semi-transparente igual aos botões
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }

    drawScore('Pontuação: ' + score, 10, 35);
    drawScore('Record: ' + highScore, 10, 65);

    if (score >= highScore) {
        ctx.font = '16px "Press Start 2P"';
        const prefixWidth = ctx.measureText('Pontuação: ').width;
        const scoreWidth = ctx.measureText(score.toString()).width;
        ctx.font = '16px Arial';
        ctx.fillText('👑', 10 + prefixWidth + scoreWidth + 5, 32);
    }

    // Mostrar combo ativo
    if (coinCombo > 1 && Date.now() - lastCoinTime < comboTimeout) {
        ctx.fillStyle = '#ffffffa4';
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText(`${coinCombo}x`, canvas.width - 60, 35);
    }

    if (isPaused) {
        // Adiciona overlay semi-transparente sobre o fundo atual
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto "PAUSADO"
        ctx.font = '32px "Press Start 2P"';
        ctx.fillStyle = '#ffffffa4';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('PAUSADO', canvas.width/2, canvas.height/2);
        ctx.fillText('PAUSADO', canvas.width/2, canvas.height/2);
        
        // Instrução
        ctx.font = '16px "Press Start 2P"';
        ctx.strokeText('Pressione SHIFT para continuar', canvas.width/2, canvas.height/2 + 40);
        ctx.fillText('Pressione SHIFT para continuar', canvas.width/2, canvas.height/2 + 40);
        
        return;
    }
}

function updateDifficulty() {
    // Dificuldade aumenta mais rapidamente
    difficultyLevel = Math.min(maxDifficulty, 1 + Math.floor(score / 300)); // Mudado de 400 para 300
    
    // Velocidade aumenta mais
    speed = baseSpeed + (difficultyLevel - 1) * 0.6; // Aumentado de 0.4 para 0.6
    
    // Intervalo de cactos diminui mais
    cactusSpawnInterval = Math.max(500, baseCactusInterval - ((difficultyLevel - 1) * 50));
    
    // Gravidade aumenta um pouco mais
    gravity = 0.45 + (difficultyLevel - 1) * 0.008;

    // Mostra o nível atual na tela (opcional)
    if (score % 400 === 0 && score > 0) {
        console.log(`Nível ${difficultyLevel}: Velocidade ${speed.toFixed(1)}`);
    }
}

function spawnCoin() {
    // Altura mais variável conforme a dificuldade aumenta
    const heightRange = 80 + (difficultyLevel * 20);
    const baseHeight = 100 + (difficultyLevel * 10);
    const height = Math.random() * heightRange + baseHeight;
    
    coins.push({
        x: canvas.width,
        y: height,
        collected: false
    });
}

function update() {
    if (gameOver || isPaused) return;

    let now = Date.now();
    if (now - lastTime >= 100) {
        score++;
        lastTime = now;
        
        // Atualiza a dificuldade
        updateDifficulty();
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
                // Maior variação na distância entre cactos
                let maxX = Math.max(...cactos.map((c, i) => i !== idx ? c.x : -Infinity));
                let minDistance = 250 + Math.random() * 300; // Variação maior na distância
                
                // Adiciona chance de gap maior
                if (Math.random() < 0.3) { // 30% de chance de gap maior
                    minDistance += 200;
                }
                
                cacto.x = Math.max(canvas.width, maxX + minDistance);
                cacto.index = Math.floor(Math.random() * cactusImages.length);
            }
        });

        // Atualização das moedas
        coinSpawnTimer++;
        if (coinSpawnTimer > 120) { // Spawn a cada 2 segundos (60fps * 2)
            spawnCoin();
            coinSpawnTimer = 0;
        }

        // Movimentação e coleta das moedas
        coins = coins.filter(coin => {
            coin.x -= speed;
            
            if (!coin.collected &&
                playerX < coin.x + 16 &&
                playerX + 56 > coin.x &&
                playerY - 44 < coin.y + 16 &&
                playerY + 20 > coin.y) {
                coin.collected = true;
                
                // Sistema de combo
                const now = Date.now();
                if (now - lastCoinTime < comboTimeout) {
                    coinCombo++;
                    score += coinValue * coinCombo; // Pontuação aumenta com o combo
                } else {
                    coinCombo = 1;
                    score += coinValue;
                }
                lastCoinTime = now;
                
                // Ajusta o volume do som baseado no combo
                coinSound.volume = Math.min(0.3 + (coinCombo * 0.1), 1.0);
                coinSound.currentTime = 0;
                coinSound.play();
                return false;
            }
            
            return coin.x > -50;
        });
    }

    // Modifica a parte do game over
    if (cactos.some((cacto, idx) => checkCollision(cacto.x, cacto.index)) && !gameOver) {
        gameOver = true;
        // Tenta tocar o som várias vezes para garantir
        try {
            gameOverSound.currentTime = 0;
            gameOverSound.play().catch(() => {
                // Se falhar, tenta novamente
                setTimeout(() => gameOverSound.play(), 100);
            });
        } catch (e) {
            console.warn('Erro ao tocar som:', e);
        }
        saveScore(score);
    }
}

// Substituir a função getPixelCollision por uma versão simplificada
function checkCollision(cactusXPos, cactusIdx) {
    const playerBox = {
        x: playerX + 10, // Reduz um pouco a área de colisão
        y: playerY - 40,
        width: 40,
        height: 60
    };

    const cactusBox = {
        x: cactusXPos + 10,
        y: 220,
        width: 30,
        height: 50
    };

    // Usa apenas colisão por caixa, mas com área reduzida para maior precisão
    return playerBox.x < cactusBox.x + cactusBox.width &&
           playerBox.x + playerBox.width > cactusBox.x &&
           playerBox.y < cactusBox.y + cactusBox.height &&
           playerBox.y + playerBox.height > cactusBox.y;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
