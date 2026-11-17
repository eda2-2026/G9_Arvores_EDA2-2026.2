const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let arvore = null;
let abelha = { noAtual: null, x: 0, y: 0 };
let timeLeft = 90;
let gameActive = false;
let timerInterval = null;
let spawnInterval = null;
let missaoAtualIndex = 0;
const TOTAL_MISSOES = 8;
let missaoAtual = null;
let spawnRate = 6500;
let totalRotations = 0;

function gerarMissaoCoerente() {
    const nos = arvore.obterTodosNos();
    const pares = nos.filter(n => n.chave % 2 === 0);
    const impares = nos.filter(n => n.chave % 2 !== 0);
    const maiores50 = nos.filter(n => n.chave > 50);
    const menores50 = nos.filter(n => n.chave < 50);
    const folhas = nos.filter(n => !n.esquerda && !n.direita);

    const candidatos = [];

    if (pares.length >= 2) {
        const meta = Math.min(3, pares.length);
        candidatos.push({
            texto: `Colha ${meta} flores com valores PARES.`,
            meta: meta,
            progresso: 0,
            validar: (no) => no.chave % 2 === 0,
            gerarCompativel: () => (Math.floor(Math.random() * 45) + 5) * 2
        });
    }

    if (impares.length >= 2) {
        const meta = Math.min(3, impares.length);
        candidatos.push({
            texto: `Colha ${meta} flores com valores ÍMPARES.`,
            meta: meta,
            progresso: 0,
            validar: (no) => no.chave % 2 !== 0,
            gerarCompativel: () => (Math.floor(Math.random() * 44) + 5) * 2 + 1
        });
    }

    if (maiores50.length >= 2) {
        const meta = Math.min(2, maiores50.length);
        candidatos.push({
            texto: `Colha ${meta} flores com valores MAIORES que 50.`,
            meta: meta,
            progresso: 0,
            validar: (no) => no.chave > 50,
            gerarCompativel: () => Math.floor(Math.random() * 49) + 51
        });
    }

    if (menores50.length >= 2) {
        const meta = Math.min(2, menores50.length);
        candidatos.push({
            texto: `Colha ${meta} flores com valores MENORES que 50.`,
            meta: meta,
            progresso: 0,
            validar: (no) => no.chave < 50,
            gerarCompativel: () => Math.floor(Math.random() * 40) + 10
        });
    }

    if (folhas.length >= 2) {
        const meta = Math.min(3, folhas.length);
        candidatos.push({
            texto: `Colha ${meta} flores das PONTAS (nós folha).`,
            meta: meta,
            progresso: 0,
            validar: (no) => !no.esquerda && !no.direita,
            gerarCompativel: () => Math.floor(Math.random() * 90) + 10
        });
    }

    if (candidatos.length === 0) {
        const meta = Math.max(1, Math.min(3, nos.length));
        return {
            texto: `Colha ${meta} flor(es) de qualquer valor.`,
            meta: meta,
            progresso: 0,
            validar: () => true,
            gerarCompativel: () => Math.floor(Math.random() * 90) + 10
        };
    }

    const filtrados = missaoAtual 
        ? candidatos.filter(c => c.texto !== missaoAtual.texto) 
        : candidatos;
    const pool = filtrados.length > 0 ? filtrados : candidatos;

    return pool[Math.floor(Math.random() * pool.length)];
}

let nuvens = [
    { x: 100, y: 80, speed: 0.2, scale: 0.8 },
    { x: 450, y: 50, speed: 0.15, scale: 1.1 },
    { x: 750, y: 120, speed: 0.25, scale: 0.9 }
];

let abelhasFundo = [
    { x: 200, y: 200, angle: 0, speed: 0.03 },
    { x: 600, y: 150, angle: 2, speed: 0.04 }
];

function log(msg) {
    const box = document.getElementById('log-box');
    if (box) {
        box.innerText += msg + "\n";
        box.scrollTop = box.scrollHeight;
    }
}

function setDifficulty(level) {
    document.getElementById('diffEasy').classList.remove('selected');
    document.getElementById('diffHard').classList.remove('selected');
    if (level === 'easy') {
        document.getElementById('diffEasy').classList.add('selected');
        spawnRate = 6500;
    } else {
        document.getElementById('diffHard').classList.add('selected');
        spawnRate = 4200;
    }
}

function openInstructions() {
    document.getElementById('instructionsModal').style.display = 'flex';
}

function closeInstructions() {
    document.getElementById('instructionsModal').style.display = 'none';
}

function startGame() {
    document.getElementById('welcomeModal').style.display = 'none';
    initGame();
}

function spawnNovaSemente(forcarCompativel = false) {
    if (!gameActive) return;
    
    const nos = arvore.obterTodosNos();
    const validosNaArvore = missaoAtual ? nos.filter(n => missaoAtual.validar(n)).length : 0;
    const faltamNaMissao = missaoAtual ? (missaoAtual.meta - missaoAtual.progresso) : 0;

    let novoVal;
    let tentativas = 0;

    if ((forcarCompativel || validosNaArvore < faltamNaMissao) && missaoAtual && missaoAtual.gerarCompativel) {
        do {
            novoVal = missaoAtual.gerarCompativel();
            tentativas++;
        } while ((contemChave(arvore.raiz, novoVal) || novoVal < 10 || novoVal > 99) && tentativas < 50);
    }

    if (!novoVal || contemChave(arvore.raiz, novoVal)) {
        do {
            novoVal = Math.floor(Math.random() * 90) + 10;
        } while (contemChave(arvore.raiz, novoVal));
    }

    arvore.inserir(novoVal);
    log(`🌱 Semente brotou: [${novoVal}]`);
    atualizarUI();

    if (arvore.obterAlturaMaxima() >= 5) {
        gameOver(false);
    }
}

function initGame() {
    totalRotations = 0;
    arvore = new ArvoreAVL(log, () => { totalRotations++; });
    timeLeft = 90;
    gameActive = true;
    missaoAtualIndex = 0;
    missaoAtual = null;

    const logBox = document.getElementById('log-box');
    if (logBox) logBox.innerText = "Novo jardim iniciado!\n";
    
    [50, 25, 75, 14, 38, 62, 87].forEach(v => arvore.inserir(v));
    abelha.noAtual = arvore.raiz;
    abelha.x = 0;
    abelha.y = 0;

    missaoAtual = gerarMissaoCoerente();

    document.getElementById('endModal').style.display = 'none';
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.innerText = `⏱️ Tempo: ${timeLeft}s`;
    atualizarUI();

    clearInterval(timerInterval);
    clearInterval(spawnInterval);

    timerInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft--;
        if (timerDisplay) timerDisplay.innerText = `⏱️ Tempo: ${timeLeft}s`;
        if (timeLeft <= 0) gameOver(false, "O tempo esgotou!");
    }, 1000);

    spawnInterval = setInterval(() => {
        spawnNovaSemente(false);
    }, spawnRate);
}

function contemChave(no, val) {
    if (!no) return false;
    if (no.chave === val) return true;
    return val < no.chave ? contemChave(no.esquerda, val) : contemChave(no.direita, val);
}

function resizeCanvas() {
    if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function calcularPosicoes(no, x, y, espacamento) {
    if (!no) return;
    no.targetX = x;
    no.targetY = y;

    if (!no.x && !no.y) {
        no.x = x;
        no.y = y;
    }

    if (no.esquerda) {
        calcularPosicoes(no.esquerda, x - espacamento, y + 80, Math.max(espacamento * 0.52, 36));
    }
    if (no.direita) {
        calcularPosicoes(no.direita, x + espacamento, y + 80, Math.max(espacamento * 0.52, 36));
    }
}

function atualizarInterpolacao(no) {
    if (!no) return;
    no.x += (no.targetX - no.x) * 0.15;
    no.y += (no.targetY - no.y) * 0.15;
    atualizarInterpolacao(no.esquerda);
    atualizarInterpolacao(no.direita);
}

function desenharFundo() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    nuvens.forEach(n => {
        n.x += n.speed;
        if (n.x > canvas.width + 100) n.x = -150;
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, 30 * n.scale, 0, Math.PI * 2);
        ctx.arc(n.x + 25 * n.scale, n.y - 10, 25 * n.scale, 0, Math.PI * 2);
        ctx.arc(n.x + 50 * n.scale, n.y, 28 * n.scale, 0, Math.PI * 2);
        ctx.fill();
    });

    abelhasFundo.forEach(ab => {
        ab.angle += ab.speed;
        let bx = ab.x + Math.sin(ab.angle) * 50;
        let by = ab.y + Math.cos(ab.angle * 0.7) * 20;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐝', bx, by);
    });
}

function desenharFlorzinha(no) {
    if (!no) return;

    if (no.esquerda) {
        ctx.beginPath();
        ctx.moveTo(no.x, no.y);
        ctx.lineTo(no.esquerda.x, no.esquerda.y);
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
        desenharFlorzinha(no.esquerda);
    }
    if (no.direita) {
        ctx.beginPath();
        ctx.moveTo(no.x, no.y);
        ctx.lineTo(no.direita.x, no.direita.y);
        ctx.strokeStyle = '#ffa726';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
        desenharFlorzinha(no.direita);
    }

    let raioPetala = 21;
    ctx.fillStyle = '#ff6b81';
    for (let i = 0; i < 5; i++) {
        let ang = (i * Math.PI * 2) / 5;
        let px = no.x + Math.cos(ang) * 14;
        let py = no.y + Math.sin(ang) * 14;
        ctx.beginPath();
        ctx.arc(px, py, raioPetala, 0, Math.PI * 2);
        ctx.fill();
    }

    if (no === abelha.noAtual) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(no.x, no.y, 36, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbc02d';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(no.x, no.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = (no === abelha.noAtual) ? '#fff9c4' : '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = (no === abelha.noAtual) ? '#fbc02d' : '#ffb1c1';
    ctx.stroke();

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 15px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(no.chave, no.x, no.y);

    let fb = arvore.fatorBalanceamento(no);
    ctx.fillStyle = fb === 0 ? '#2e7d32' : (Math.abs(fb) === 1 ? '#1976d2' : '#e91e63');
    ctx.beginPath();
    ctx.roundRect(no.x + 18, no.y - 28, 28, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Segoe UI';
    ctx.fillText(fb > 0 ? `+${fb}` : fb, no.x + 32, no.y - 19);
}

function desenharAbelhaPersonagem() {
    if (!abelha.noAtual) return;
    if (abelha.x === 0 && abelha.y === 0) {
        abelha.x = abelha.noAtual.x;
        abelha.y = abelha.noAtual.y;
    }
    abelha.x += (abelha.noAtual.x - abelha.x) * 0.2;
    abelha.y += (abelha.noAtual.y - abelha.y) * 0.2;

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐝', abelha.x, abelha.y - 38);
}

function gameLoop() {
    if (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight) {
        resizeCanvas();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharFundo();

    if (arvore && arvore.raiz) {
        let centroX = canvas.width / 2;
        let alturaMax = arvore.obterAlturaMaxima();
        let espacamentoInicial = Math.min(canvas.width / 3.8, Math.max(120, 240 - (alturaMax * 25)));
        
        calcularPosicoes(arvore.raiz, centroX, 155, espacamentoInicial);
        atualizarInterpolacao(arvore.raiz);
        desenharFlorzinha(arvore.raiz);
        desenharAbelhaPersonagem();
    }

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (e) => {
    if (!gameActive || !abelha.noAtual) return;

    if (e.key === 'ArrowLeft' && abelha.noAtual.esquerda) {
        abelha.noAtual = abelha.noAtual.esquerda;
    } else if (e.key === 'ArrowRight' && abelha.noAtual.direita) {
        abelha.noAtual = abelha.noAtual.direita;
    } else if (e.key === 'ArrowUp') {
        let pai = encontrarPai(arvore.raiz, abelha.noAtual.chave);
        if (pai) abelha.noAtual = pai;
    } else if (e.key === 'r' || e.key === 'R') {
        abelha.noAtual = arvore.raiz;
    } else if (e.key === ' ') {
        e.preventDefault();
        colherFlorAtual();
    }
});

function encontrarPai(raiz, chaveFilho) {
    if (!raiz) return null;
    if ((raiz.esquerda && raiz.esquerda.chave === chaveFilho) || (raiz.direita && raiz.direita.chave === chaveFilho)) {
        return raiz;
    }
    if (chaveFilho < raiz.chave) return encontrarPai(raiz.esquerda, chaveFilho);
    return encontrarPai(raiz.direita, chaveFilho);
}

canvas.addEventListener('click', (e) => {
    if (!gameActive || !arvore || !arvore.raiz) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let noClicado = encontrarNoPorCoordenada(arvore.raiz, mouseX, mouseY);
    if (noClicado) {
        abelha.noAtual = noClicado;
    }
});

function encontrarNoPorCoordenada(no, x, y) {
    if (!no) return null;
    let dist = Math.hypot(no.x - x, no.y - y);
    if (dist < 30) return no;
    let esq = encontrarNoPorCoordenada(no.esquerda, x, y);
    if (esq) return esq;
    return encontrarNoPorCoordenada(no.direita, x, y);
}

function colherFlorAtual() {
    if (!abelha.noAtual || !missaoAtual) return;
    let noColhido = abelha.noAtual;

    if (missaoAtual.validar(noColhido)) {
        missaoAtual.progresso++;
        log(`🌸 Flor [${noColhido.chave}] colhida! (${missaoAtual.progresso}/${missaoAtual.meta})`);
        
        arvore.remover(noColhido.chave);
        abelha.noAtual = arvore.raiz;

        if (missaoAtual.progresso >= missaoAtual.meta) {
            missaoAtualIndex++;
            if (missaoAtualIndex >= TOTAL_MISSOES) {
                gameOver(true);
                return;
            } else {
                if (arvore.obterTodosNos().length < 4) {
                    spawnNovaSemente(false);
                    spawnNovaSemente(false);
                }
                missaoAtual = gerarMissaoCoerente();
                log(`🎉 Missão concluída! Nova missão gerada.`);
            }
        }
        atualizarUI();
    } else {
        log(`❌ Flor [${noColhido.chave}] errada! Removida e nova semente brotou.`);
        arvore.remover(noColhido.chave);
        abelha.noAtual = arvore.raiz;
        spawnNovaSemente(true);
    }
}

function atualizarUI() {
    const missionText = document.getElementById('mission-text');
    const heightDisplay = document.getElementById('height-display');

    if (missionText && missaoAtual) {
        missionText.innerText = `${missaoAtual.texto} (${missaoAtual.progresso}/${missaoAtual.meta}) [Fase ${missaoAtualIndex + 1}/${TOTAL_MISSOES}]`;
    }
    if (heightDisplay) {
        heightDisplay.innerText = `🌲 Altura: ${arvore.obterAlturaMaxima()}`;
    }
}

function gameOver(vitoria, customMsg) {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(spawnInterval);

    const endIcon = document.getElementById('end-icon');
    const endTitle = document.getElementById('end-title');
    const endMessage = document.getElementById('end-message');
    const endModal = document.getElementById('endModal');

    if (vitoria) {
        endIcon.innerText = "🏆🌸";
        endTitle.innerText = "Jardim Conquistado!";
        endMessage.innerText = "Você completou todas as 8 missões e manteve a árvore perfeitamente balanceada!";
    } else {
        endIcon.innerText = "🌳🍂";
        endTitle.innerText = "O Jardim Transbordou!";
        endMessage.innerText = customMsg || "A árvore cresceu até a altura 5 e tomou conta de todo o jardim!";
    }

    document.getElementById('final-missions').innerText = `${missaoAtualIndex}/${TOTAL_MISSOES}`;
    document.getElementById('final-rotations').innerText = totalRotations;
    document.getElementById('final-time').innerText = `${timeLeft}s`;

    if (endModal) endModal.style.display = 'flex';
}

function restartGame() {
    document.getElementById('endModal').style.display = 'none';
    initGame();
}

function goToMenu() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(spawnInterval);
    document.getElementById('endModal').style.display = 'none';
    document.getElementById('welcomeModal').style.display = 'flex';
}

arvore = new ArvoreAVL(log, () => {});
[50, 25, 75, 14, 38, 62, 87].forEach(v => arvore.inserir(v));
abelha.noAtual = arvore.raiz;