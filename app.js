const ROWS = 10, COLS = 10;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let turn = 'X';
let history = [];

const gameEl = document.getElementById('game');
const statusEl = document.getElementById('status');
const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');

function renderBoard() {
  gameEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      if (board[r][c]) btn.classList.add(board[r][c]);
      btn.textContent = board[r][c] || '';
      btn.addEventListener('click', () => {
        if (board[r][c] || aiThinking) return;
        makeMove(r, c);
      });
      btn.dataset.r = r;
      btn.dataset.c = c;
      gameEl.appendChild(btn);
    }
  }
  highlightSegments();
}

function cloneBoard(bd) {
  return bd.map(row => row.slice());
}

function makeMove(r, c) {
  if (board[r][c]) return;
  history.push(cloneBoard(board));
  board[r][c] = turn;
  turn = turn === 'X' ? 'O' : 'X';
  updateStatus();
  renderBoard();
  updateUndoButton();
  if (aiEnabled && turn === aiPlayer) aiMove();
}

function undo() {
  if (!history.length) return;
  board = history.pop();
  turn = turn === 'X' ? 'O' : 'X';
  updateStatus();
  renderBoard();
  updateUndoButton();
}

function reset() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  turn = 'X';
  history = [];
  updateStatus();
  renderBoard();
  updateUndoButton();
}

function updateUndoButton() {
  undoBtn.disabled = history.length === 0;
}

function updateStatus() {
  const scores = calculateScores(board);
  statusEl.textContent = `Turn: ${turn} | Score X: ${scores.X} | Score O: ${scores.O}`;
}

function calculateScores(bd) {
  const segmentsX = findSegments(bd, 'X');
  const segmentsO = findSegments(bd, 'O');
  let scoreX = 0, scoreO = 0;
  for (const seg of segmentsX) {
    if (seg.length === 3) scoreX += 1;
    else if (seg.length === 4) scoreX += 2;
  }
  for (const seg of segmentsO) {
    if (seg.length === 3) scoreO += 1;
    else if (seg.length === 4) scoreO += 2;
  }
  return { X: scoreX, O: scoreO };
}

const directions = [
  [0,1],[1,0],[1,1],[1,-1]
];

// Find all 3- and 4-length segments for a player
function findSegments(bd, player) {
  const segs = [];
  for(let r=0; r<ROWS; r++) {
    for(let c=0; c<COLS; c++) {
      if(bd[r][c] !== player) continue;
      for(const [dr, dc] of directions) {
        for(const len of [3,4]) {
          let valid = true;
          const cells = [];
          for(let k=0; k<len; k++) {
            const nr = r + dr*k, nc = c + dc*k;
            if(nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || bd[nr][nc] !== player) {
              valid = false;
              break;
            }
            cells.push([nr, nc]);
          }
          if(!valid) continue;
          // Only count segment if it's the start of run (no same player cell before start)
          const pr = r - dr, pc = c - dc;
          if(pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS && bd[pr][pc] === player) continue;
          segs.push({ length: len, cells });
        }
      }
    }
  }
  return segs;
}

function highlightSegments() {
  const segmentsX = findSegments(board, 'X');
  const segmentsO = findSegments(board, 'O');

  // Clear all highlights
  const buttons = document.querySelectorAll('button.cell');
  buttons.forEach(btn => {
    btn.classList.remove('highlight3', 'highlight4');
  });

  // Highlight X segments
  for(const seg of segmentsX) {
    const cls = seg.length === 4 ? 'highlight4' : 'highlight3';
    seg.cells.forEach(([r,c]) => {
      const btn = [...buttons].find(b => +b.dataset.r === r && +b.dataset.c === c);
      if(btn) btn.classList.add(cls);
    });
  }

  // Highlight O segments
  for(const seg of segmentsO) {
    const cls = seg.length === 4 ? 'highlight4' : 'highlight3';
    seg.cells.forEach(([r,c]) => {
      const btn = [...buttons].find(b => +b.dataset.r === r && +b.dataset.c === c);
      if(btn) btn.classList.add(cls);
    });
  }
}

// Simple AI: pick the move that maximizes (score gained - opponent score lost)
let aiEnabled = true;
let aiPlayer = 'O';
let aiThinking = false;

async function aiMove() {
  aiThinking = true;
  await new Promise(r => setTimeout(r, 400)); // delay for UX
  const moves = [];
  const opp = aiPlayer === 'X' ? 'O' : 'X';
  for(let r=0; r<ROWS; r++) {
    for(let c=0; c<COLS; c++) {
      if(board[r][c]) continue;
      const nb = cloneBoard(board);
      nb[r][c] = aiPlayer;
      const scoresAfter = calculateScores(nb);
      const scoresBefore = calculateScores(board);
      const delta = (scoresAfter[aiPlayer] - scoresBefore[aiPlayer]) - (scoresAfter[opp] - scoresBefore[opp]) * 1.2;
      moves.push({ r, c, delta });
    }
  }
  moves.sort((a,b) => b.delta - a.delta);
  const best = moves[0];
  if(best) makeMove(best.r, best.c);
  aiThinking = false;
}

undoBtn.addEventListener('click', undo);
resetBtn.addEventListener('click', reset);

reset();
