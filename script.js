const cells = Array.from(document.querySelectorAll('.cell'));

const boardEl = document.getElementById('board');

const statusEl = document.getElementById('status');

const restartBtn = document.getElementById('restart');

const aiFirstCheckbox = document.getElementById('ai-first');

const playerScoreEl = document.getElementById('player-score');

const aiScoreEl = document.getElementById('ai-score');

const tiesEl = document.getElementById('ties');

const heartsContainer = document.getElementById('hearts-container');

let board = Array(9).fill(null); // null | 'X' | 'O'

let player = 'X'; // jogador humano

let ai = 'O';

let gameOver = false;

let scores = { player: 0, ai: 0, ties: 0 };

// motivational messages

const winMsgs = ["É isso! 🔥", "Arrasou! 💗", "Marcou lindo!", "Show, campeão!"];

const loseMsgs = ["Quase... tenta de novo!", "PC te pegou 😈", "Não desanima!", "Boa tentativa!"];

const tieMsgs = ["Empate! 🤝", "Quase lá — jogo apertado!", "Batalha equilibrada!"];

// inicialização

function init() {

  cells.forEach(c => {

    c.textContent = '';

    c.classList.remove('disabled','win');

    c.addEventListener('click', onCellClick);

  });

  board = Array(9).fill(null);

  gameOver = false;

  statusEl.textContent = "Sua vez — marque um X!";

  if (aiFirstCheckbox.checked) {

    // se IA começa, dá pequeno atraso para efeito

    setTimeout(() => {

      aiMove();

    }, 350);

  }

}

init();

// --- utilitários de som (WebAudio) ---

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq=440, type='sine', duration=100, gain=0.02) {

  const o = audioCtx.createOscillator();

  const g = audioCtx.createGain();

  o.type = type;

  o.frequency.value = freq;

  g.gain.value = gain;

  o.connect(g); g.connect(audioCtx.destination);

  o.start();

  setTimeout(() => {

    o.stop();

  }, duration);

}

// sons chamativos para vitória/derrota

function playWinSound(){ playTone(780,'sine',240,0.04); playTone(980,'triangle',120,0.03); }

function playLoseSound(){ playTone(180,'sawtooth',260,0.03); playTone(240,'sine',140,0.02); }

function playPlaceSound(){ playTone(520,'sine',70,0.02); }

// --- evento de clique ---

function onCellClick(e){

  const idx = Number(e.currentTarget.dataset.index);

  if (gameOver || board[idx]) return;

  makeMove(idx, player);

  playPlaceSound();

  const winner = checkWinner(board);

  if (!winner) {

    // turno da IA

    setTimeout(() => {

      aiMove();

    }, 280);

  }

}

// aplicar movimento

function makeMove(index, who){

  board[index] = who;

  const el = cells[index];

  el.textContent = who;

  el.classList.add('disabled');

}

// checagem de vitória / empate

function checkWinner(bd){

  const wins = [

    [0,1,2],[3,4,5],[6,7,8],

    [0,3,6],[1,4,7],[2,5,8],

    [0,4,8],[2,4,6]

  ];

  for (const combo of wins){

    const [a,b,c] = combo;

    if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {

      return { winner: bd[a], combo };

    }

  }

  if (bd.every(Boolean)) return { winner: 'tie' };

  return null;

}

// destacar vitória

function highlight(combo){

  combo.forEach(i => cells[i].classList.add('win'));

}

// finalizar rodada

function endGame(result){

  gameOver = true;

  if (result.winner === 'tie') {

    statusEl.innerHTML = `${tieMsgs[Math.floor(Math.random()*tieMsgs.length)]} <span class="motiv">Empate</span>`;

    scores.ties++;

    tiesEl.textContent = scores.ties;

    playTone(440,'sine',180,0.02);

  } else if (result.winner === player) {

    highlight(result.combo);

    statusEl.innerHTML = `${winMsgs[Math.floor(Math.random()*winMsgs.length)]} <span class="motiv">Você venceu!</span>`;

    scores.player++;

    playerScoreEl.textContent = scores.player;

    playWinSound();

    spawnHearts(12);

  } else {

    highlight(result.combo);

    statusEl.innerHTML = `${loseMsgs[Math.floor(Math.random()*loseMsgs.length)]} <span class="motiv">PC venceu</span>`;

    scores.ai++;

    aiScoreEl.textContent = scores.ai;

    playLoseSound();

  }

}

// IA logic (Minimax)

function availableMoves(bd) {

  return bd.map((v,i)=> v? null : i).filter(v=>v!==null);

}

function aiMove(){

  if (gameOver) return;

  // if board empty and we want some randomness first move: play center if available

  let idx;

  if (board.every(v => v===null)) {

    idx = 4; // melhor primeira jogada

  } else {

    idx = bestMove(board, ai).index;

  }

  makeMove(idx, ai);

  playPlaceSound();

  const winner = checkWinner(board);

  if (winner) {

    endGame(winner);

  } else {

    statusEl.textContent = "Sua vez — marque um X!";

  }

}

// Minimax retornando {score, index}

function bestMove(newBoard, who) {

  const human = player;

  const opponent = ai;

  const winnerRes = checkWinner(newBoard);

  if (winnerRes) {

    if (winnerRes.winner === human) return { score: -10 };

    if (winnerRes.winner === opponent) return { score: 10 };

    if (winnerRes.winner === 'tie') return { score: 0 };

  }

  const moves = [];

  const avail = availableMoves(newBoard);

  for (const i of avail) {

    const move = {};

    move.index = i;

    newBoard[i] = who;

    // next player

    const next = (who === opponent) ? human : opponent;

    const result = bestMove(newBoard, next);

    move.score = result.score;

    // reset

    newBoard[i] = null;

    moves.push(move);

  }

  // choose best for current player

  let bestIdx = 0;

  if (who === opponent) {

    // maximize

    let bestScore = -Infinity;

    moves.forEach((m,idx) => { if (m.score > bestScore) { bestScore = m.score; bestIdx = idx; }});

  } else {

    // minimize

    let bestScore = Infinity;

    moves.forEach((m,idx) => { if (m.score < bestScore) { bestScore = m.score; bestIdx = idx; }});

  }

  return moves[bestIdx];

}

// --- evento reiniciar partida ---

restartBtn.addEventListener('click', () => {

  // limpar células e iniciar

  cells.forEach(c => { c.textContent = ''; c.classList.remove('disabled','win'); });

  board = Array(9).fill(null);

  gameOver = false;

  statusEl.textContent = "Nova partida — sua vez!";

  // se IA começa:

  if (aiFirstCheckbox.checked) {

    setTimeout(aiMove, 350);

  }

});

// observador de mudança de estado após cada movimento para checar resultado

const originalMakeMove = makeMove;

makeMove = function(index, who) {

  originalMakeMove(index, who);

  const winner = checkWinner(board);

  if (winner) {

    endGame(winner);

  } else {

    // bloquear células completadas apenas visualmente

    cells.forEach((c,i)=> {

      if (board[i]) c.classList.add('disabled'); else c.classList.remove('disabled');

    });

  }

}

// gerar corações (animação)

function spawnHearts(n=8){

  for (let i=0;i<n;i++){

    const h = document.createElement('div');

    h.className = 'heart';

    // posição aleatória ao redor do centro do tabuleiro

    const r = boardEl.getBoundingClientRect();

    const x = r.left + r.width/2 + (Math.random()*240 - 120);

    const y = r.top + r.height/2 + (Math.random()*40 - 20);

    h.style.left = `${x}px`;

    h.style.top = `${y}px`;

    h.style.transform = `translate(-50%,-50%) scale(${0.8 + Math.random()*0.6}) rotate(${Math.random()*40 - 20}deg)`;

    h.style.opacity = 0;

    const hueShift = Math.random()*30 - 15;

    h.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

      <path d="M12 21s-7-4.35-9-7.5C-1 9.5 3 4.5 7 6.5 9 7.7 12 13 12 13s3-5.3 5-6.5c4-2 8 3 4 7-2 3.15-9 7.5-9 7.5z"

        fill="${shadeColor('#ff4fb1', hueShift)}"/>

      </svg>`;

    heartsContainer.appendChild(h);

    // remover depois da animação

    setTimeout(()=> h.remove(), 1800 + Math.random()*500);

  }

}

// utilitário para ajustar cor levemente (retorna hex)

function shadeColor(hex, percent) {

  // hex sem #

  hex = hex.replace('#','');

  const num = parseInt(hex,16);

  let r = (num >> 16) + Math.round(percent);

  let g = ((num >> 8) & 0x00FF) + Math.round(percent);

  let b = (num & 0x0000FF) + Math.round(percent);

  r = Math.max(0, Math.min(255, r));

  g = Math.max(0, Math.min(255, g));

  b = Math.max(0, Math.min(255, b));

  return `rgb(${r}, ${g}, ${b})`;

}

// --- inicializar scores (persistência simples durante a sessão) ---

function loadScores(){ 

  try {

    const s = JSON.parse(sessionStorage.getItem('tv_scores') || '{}');

    if (s.player!=null) scores = s;

  } catch(e){}

  playerScoreEl.textContent = scores.player;

  aiScoreEl.textContent = scores.ai;

  tiesEl.textContent = scores.ties;

}

function saveScores(){

  try { sessionStorage.setItem('tv_scores', JSON.stringify(scores)); } catch(e){}

}

window.addEventListener('beforeunload', saveScores);

loadScores();

// ensure layout loads before possibly positioning hearts (if first move by AI)

window.addEventListener('load', ()=> {

  if (aiFirstCheckbox.checked) setTimeout(aiMove, 350);

});
