let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let mode = 'ai'; // 'ai' or '2p'
let scores = { X: 0, O: 0, draw: 0 };

const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const cells = document.querySelectorAll('.cell');
const turnIndicator = document.getElementById('turn-indicator');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');

function init() {
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });
  updateTurnText();
}

function setMode(newMode) {
  mode = newMode;
  document.getElementById('btn-ai').classList.toggle('active', mode === 'ai');
  document.getElementById('btn-2p').classList.toggle('active', mode === '2p');
  resetBoard();
}

function handleCellClick(e) {
  const idx = parseInt(e.target.dataset.idx);
  if (board[idx] !== '' || !gameActive) return;

  makeMove(idx, currentPlayer);

  if (checkWinner(board, currentPlayer)) {
    endGame(currentPlayer);
    return;
  }

  if (isBoardFull(board)) {
    endGame('draw');
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnText();

  if (mode === 'ai' && currentPlayer === 'O' && gameActive) {
    setTimeout(makeAiMove, 300);
  }
}

function makeMove(idx, player) {
  board[idx] = player;
  const cell = cells[idx];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), 'taken');
}

function makeAiMove() {
  if (!gameActive) return;
  const bestIdx = getBestMove();
  makeMove(bestIdx, 'O');

  if (checkWinner(board, 'O')) {
    endGame('O');
    return;
  }

  if (isBoardFull(board)) {
    endGame('draw');
    return;
  }

  currentPlayer = 'X';
  updateTurnText();
}

function getBestMove() {
  // Minimax Algorithm
  let bestScore = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'O';
      let score = minimax(board, 0, false);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move !== -1 ? move : board.findIndex(c => c === '');
}

function minimax(tempBoard, depth, isMaximizing) {
  if (checkWinner(tempBoard, 'O')) return 10 - depth;
  if (checkWinner(tempBoard, 'X')) return depth - 10;
  if (isBoardFull(tempBoard)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (tempBoard[i] === '') {
        tempBoard[i] = 'O';
        best = Math.max(best, minimax(tempBoard, depth + 1, false));
        tempBoard[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (tempBoard[i] === '') {
        tempBoard[i] = 'X';
        best = Math.min(best, minimax(tempBoard, depth + 1, true));
        tempBoard[i] = '';
      }
    }
    return best;
  }
}

function checkWinner(b, player) {
  return winningCombos.some(combo => {
    return combo.every(idx => b[idx] === player);
  });
}

function getWinningCombo(b, player) {
  return winningCombos.find(combo => {
    return combo.every(idx => b[idx] === player);
  });
}

function isBoardFull(b) {
  return b.every(cell => cell !== '');
}

function endGame(winner) {
  gameActive = false;
  if (winner === 'draw') {
    turnIndicator.innerHTML = '🤝 <strong>무승부입니다!</strong>';
    scores.draw++;
    scoreDraw.textContent = scores.draw;
  } else {
    const winnerName = mode === 'ai' ? (winner === 'X' ? '플레이어 (X)' : '인공지능 (O)') : `${winner} 플레이어`;
    const colorClass = winner === 'X' ? 'color-x' : 'color-o';
    turnIndicator.innerHTML = `🏆 <strong class="${colorClass}">${winnerName} 승리!</strong>`;
    scores[winner]++;
    if (winner === 'X') scoreX.textContent = scores.X;
    if (winner === 'O') scoreO.textContent = scores.O;

    const winCombo = getWinningCombo(board, winner);
    if (winCombo) {
      winCombo.forEach(idx => cells[idx].classList.add('win'));
    }
  }
}

function updateTurnText() {
  if (!gameActive) return;
  const turnName = mode === 'ai' ? (currentPlayer === 'X' ? '플레이어 (X)' : 'AI 생각 중...') : `${currentPlayer} 차례`;
  const colorClass = currentPlayer === 'X' ? 'color-x' : 'color-o';
  turnIndicator.innerHTML = `현재 차례: <strong class="${colorClass}">${turnName}</strong>`;
}

function resetBoard() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });
  updateTurnText();
}

function resetScores() {
  scores = { X: 0, O: 0, draw: 0 };
  scoreX.textContent = '0';
  scoreO.textContent = '0';
  scoreDraw.textContent = '0';
  resetBoard();
}

init();
