/**
 * 쌈뽕 오목 (Gomoku) - AI (쉬움/중간/어려움) & 2인 대전 엔진
 */

(function () {
  'use strict';

  // Constants
  const BOARD_SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;

  // Canvas & Context
  const canvas = document.getElementById('omok-canvas');
  const ctx = canvas.getContext('2d');

  // DOM Elements
  const turnText = document.getElementById('turn-text');
  const stoneIcon = document.getElementById('current-stone-icon');
  const scoreWin = document.getElementById('score-win');
  const scoreLoss = document.getElementById('score-loss');
  const scoreDraw = document.getElementById('score-draw');

  const diffGroup = document.getElementById('diff-group');
  const colorGroup = document.getElementById('color-group');

  const modal = document.getElementById('result-modal');
  const modalIcon = document.getElementById('modal-icon');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  // Win Rate Elements
  const wrPlayerLabel = document.getElementById('wr-player-label');
  const wrPlayerPct = document.getElementById('wr-player-pct');
  const wrAiLabel = document.getElementById('wr-ai-label');
  const wrAiPct = document.getElementById('wr-ai-pct');
  const wrStatusText = document.getElementById('wr-status-text');
  const wrHumanBar = document.getElementById('wr-human-bar');
  const wrAiBar = document.getElementById('wr-ai-bar');

  // Game States
  let board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
  let moveHistory = []; // Array of { r, c, player }
  let currentPlayer = BLACK;
  let gameMode = 'ai'; // 'ai' or '2p'
  let difficulty = 'normal'; // 'easy', 'normal', 'hard'
  let humanColor = BLACK;
  let aiColor = WHITE;
  let gameOver = false;
  let winningLine = null;
  let hoverPos = null;

  let scores = { win: 0, loss: 0, draw: 0 };

  // Audio Context (Web Audio API)
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playStoneSound() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    // Wood resonant thwack
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // High sharp click
    const click = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(1400, now);
    click.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    clickGain.gain.setValueAtTime(0.25, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    click.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    click.start(now);
    click.stop(now + 0.04);
  }

  function playWinSound() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.25, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.26);
    });
  }

  // --- RENDERING ---
  const PADDING = 30;
  let cellSize = (canvas.width - PADDING * 2) / (BOARD_SIZE - 1);

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid lines
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#5a3411';

    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = PADDING + i * cellSize;

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(canvas.width - PADDING, pos);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, canvas.height - PADDING);
      ctx.stroke();
    }

    // Outer border frame
    ctx.lineWidth = 2.5;
    ctx.strokeRect(PADDING, PADDING, canvas.width - PADDING * 2, canvas.height - PADDING * 2);

    // 2. Star dots (화점) at (3,3), (11,3), (7,7), (3,11), (11,11)
    const starPoints = [
      [3, 3], [11, 3], [7, 7], [3, 11], [11, 11]
    ];
    ctx.fillStyle = '#5a3411';
    starPoints.forEach(([r, c]) => {
      const x = PADDING + c * cellSize;
      const y = PADDING + r * cellSize;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Placed Stones
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== EMPTY) {
          drawStone(r, c, board[r][c]);
        }
      }
    }

    // 4. Last move marker
    if (moveHistory.length > 0) {
      const last = moveHistory[moveHistory.length - 1];
      const x = PADDING + last.c * cellSize;
      const y = PADDING + last.r * cellSize;

      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = last.player === BLACK ? '#f43f5e' : '#38bdf8';
      ctx.fill();
    }

    // 5. Hover ghost stone
    if (!gameOver && hoverPos && board[hoverPos.r][hoverPos.c] === EMPTY) {
      if (gameMode === '2p' || currentPlayer === humanColor) {
        drawGhostStone(hoverPos.r, hoverPos.c, currentPlayer);
      }
    }

    // 6. Winning Line Highlight
    if (winningLine && winningLine.length >= 2) {
      const start = winningLine[0];
      const end = winningLine[winningLine.length - 1];
      const x1 = PADDING + start.c * cellSize;
      const y1 = PADDING + start.r * cellSize;
      const x2 = PADDING + end.c * cellSize;
      const y2 = PADDING + end.r * cellSize;

      ctx.save();
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawStone(r, c, player) {
    const x = PADDING + c * cellSize;
    const y = PADDING + r * cellSize;
    const radius = cellSize * 0.44;

    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (player === BLACK) {
      // Black 3D sphere gradient
      const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
      grad.addColorStop(0, '#555555');
      grad.addColorStop(0.5, '#222222');
      grad.addColorStop(1, '#050505');
      ctx.fillStyle = grad;
    } else {
      // White 3D sphere gradient
      const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#e2e8f0');
      grad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = grad;
    }
    ctx.fill();
    ctx.restore();
  }

  function drawGhostStone(r, c, player) {
    const x = PADDING + c * cellSize;
    const y = PADDING + r * cellSize;
    const radius = cellSize * 0.42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = player === BLACK ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
    ctx.strokeStyle = player === BLACK ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // --- GAMEPLAY & RULES ---
  function makeMove(r, c) {
    if (gameOver || board[r][c] !== EMPTY) return false;

    board[r][c] = currentPlayer;
    moveHistory.push({ r, c, player: currentPlayer });
    playStoneSound();

    const winCheck = checkWin(r, c, currentPlayer);
    if (winCheck) {
      gameOver = true;
      winningLine = winCheck;
      drawBoard();
      handleGameOver(currentPlayer);
      return true;
    }

    if (isBoardFull()) {
      gameOver = true;
      drawBoard();
      handleGameOver(0); // Draw
      return true;
    }

    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
    updateHUD();
    drawBoard();

    // Trigger AI if in AI mode
    if (!gameOver && gameMode === 'ai' && currentPlayer === aiColor) {
      setTimeout(handleAiTurn, 250);
    }
    return true;
  }

  function checkWin(r, c, player) {
    const directions = [
      [[0, 1], [0, -1]],   // Horizontal
      [[1, 0], [-1, 0]],   // Vertical
      [[1, 1], [-1, -1]],  // Diagonal \
      [[1, -1], [-1, 1]]   // Diagonal /
    ];

    for (const [dir1, dir2] of directions) {
      let count = 1;
      const line = [{ r, c }];

      // Positive side
      let step = 1;
      while (true) {
        const nr = r + dir1[0] * step;
        const nc = c + dir1[1] * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
          count++;
          line.push({ r: nr, c: nc });
          step++;
        } else break;
      }

      // Negative side
      step = 1;
      while (true) {
        const nr = r + dir2[0] * step;
        const nc = c + dir2[1] * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
          count++;
          line.unshift({ r: nr, c: nc });
          step++;
        } else break;
      }

      if (count >= 5) {
        return line;
      }
    }
    return null;
  }

  function isBoardFull() {
    return board.every(row => row.every(cell => cell !== EMPTY));
  }

  function handleGameOver(winner) {
    if (winner === 0) {
      scores.draw++;
      scoreDraw.textContent = scores.draw;
      modalIcon.textContent = '🤝';
      modalTitle.textContent = '무승부!';
      modalDesc.textContent = '바둑판이 가득 찼지만 승부가 나지 않았습니다.';
    } else {
      const isHumanWin = (gameMode === 'ai' && winner === humanColor) || (gameMode === '2p' && winner === BLACK);

      if (gameMode === 'ai') {
        if (winner === humanColor) {
          scores.win++;
          scoreWin.textContent = scores.win;
          modalIcon.textContent = '🏆';
          modalTitle.textContent = '승리하셨습니다!';
          modalDesc.textContent = `축하합니다! ${getDifficultyName(difficulty)} AI를 꺾고 5목을 달성했습니다.`;
          playWinSound();
          if (window.confetti) window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } else {
          scores.loss++;
          scoreLoss.textContent = scores.loss;
          modalIcon.textContent = '🤖';
          modalTitle.textContent = '패배했습니다...';
          modalDesc.textContent = `${getDifficultyName(difficulty)} AI가 먼저 5목을 완성했습니다. 다시 도전해 보세요!`;
        }
      } else {
        const winnerName = winner === BLACK ? '흑돌 (선공)' : '백돌 (후공)';
        modalIcon.textContent = '🎉';
        modalTitle.textContent = `${winnerName} 승리!`;
        modalDesc.textContent = `${winnerName} 플레이어가 멋진 전술로 5목을 달성했습니다!`;
        playWinSound();
        if (window.confetti) window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }

    setTimeout(() => {
      modal.classList.remove('hidden');
    }, 700);
  }

  function getDifficultyName(d) {
    if (d === 'easy') return '쉬움';
    if (d === 'hard') return '어려움';
    return '중간';
  }

  function updateHUD() {
    const isHumanTurn = (gameMode === '2p') || (currentPlayer === humanColor);
    const colorName = currentPlayer === BLACK ? '흑돌' : '백돌';
    const tag = gameMode === 'ai' ? (isHumanTurn ? '(플레이어)' : '(AI 생각 중...)') : (currentPlayer === BLACK ? '(선공)' : '(후공)');

    stoneIcon.textContent = currentPlayer === BLACK ? '⚫' : '⚪';
    turnText.innerHTML = `현재 차례: <strong>${colorName} ${tag}</strong>`;
    updateWinRateDisplay();
  }

  // --- REAL-TIME AI WIN RATE CALCULATION ---
  function calculateWinRate() {
    // If game is over with a winner
    if (gameOver && winningLine) {
      const winner = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].player : EMPTY;
      if (gameMode === 'ai') {
        const aiWon = (winner === aiColor);
        return {
          humanRate: aiWon ? 0.0 : 100.0,
          aiRate: aiWon ? 100.0 : 0.0,
          status: aiWon ? '🔥 AI 승리 확정!' : '🏆 플레이어 승리!'
        };
      } else {
        const blackWon = (winner === BLACK);
        return {
          humanRate: blackWon ? 100.0 : 0.0,
          aiRate: blackWon ? 0.0 : 100.0,
          status: blackWon ? '⚫ 흑돌 승리!' : '⚪ 백돌 승리!'
        };
      }
    }

    if (moveHistory.length === 0) {
      return {
        humanRate: 50.0,
        aiRate: 50.0,
        status: '⚖️ 팽팽한 호각세 (50 : 50)'
      };
    }

    // Evaluate all 572 five-in-a-row lines on 15x15 board
    let scoreBlack = 0;
    let scoreWhite = 0;

    const patternWeights = [0, 15, 120, 1000, 15000, 500000];

    function evaluateWindow(cells) {
      let bCount = 0;
      let wCount = 0;
      for (let i = 0; i < 5; i++) {
        if (cells[i] === BLACK) bCount++;
        else if (cells[i] === WHITE) wCount++;
      }
      if (bCount > 0 && wCount > 0) return; // Blocked line
      if (bCount > 0) scoreBlack += patternWeights[bCount];
      if (wCount > 0) scoreWhite += patternWeights[wCount];
    }

    // Horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        evaluateWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3], board[r][c+4]]);
      }
    }

    // Vertical
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        evaluateWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c], board[r+4][c]]);
      }
    }

    // Diagonal \
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        evaluateWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3], board[r+4][c+4]]);
      }
    }

    // Diagonal /
    for (let r = 4; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        evaluateWindow([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3], board[r-4][c+4]]);
      }
    }

    // Initiative (current turn tempo) bonus
    if (currentPlayer === BLACK) scoreBlack *= 1.15;
    else scoreWhite *= 1.15;

    let targetDiff = 0;
    if (gameMode === 'ai') {
      const aiScore = aiColor === BLACK ? scoreBlack : scoreWhite;
      const humanScore = humanColor === BLACK ? scoreBlack : scoreWhite;
      targetDiff = aiScore - humanScore;
    } else {
      // White vs Black in 2P mode
      targetDiff = scoreWhite - scoreBlack;
    }

    // Sigmoid curve mapping
    let aiProb = 1 / (1 + Math.pow(10, -targetDiff / 1500));
    let aiPct = Math.min(99.0, Math.max(1.0, aiProb * 100));
    let humanPct = 100.0 - aiPct;

    // AI Status commentary
    let status = '';
    if (gameMode === 'ai') {
      if (aiPct >= 85) status = '🔥 AI 승기 확정권! (치명적 수)';
      else if (aiPct >= 70) status = '⚡ AI 압도적 우세 (연속 공세)';
      else if (aiPct >= 58) status = '📈 AI 유리 (포석 우위 점유)';
      else if (aiPct >= 43) status = '⚖️ 팽팽한 호각세 (치열한 수싸움)';
      else if (aiPct >= 30) status = '🛡️ 플레이어 유리 (AI 수비 집중)';
      else if (aiPct >= 15) status = '💥 플레이어 결정적 승세!';
      else status = '👑 플레이어 승리 목전!';
    } else {
      const bPct = humanPct;
      if (bPct >= 70) status = '⚫ 흑돌 압도적 우세!';
      else if (bPct >= 56) status = '⚫ 흑돌 유리';
      else if (bPct >= 44) status = '⚖️ 팽팽한 호각세';
      else if (bPct >= 30) status = '⚪ 백돌 유리';
      else status = '⚪ 백돌 압도적 우세!';
    }

    return {
      humanRate: parseFloat(humanPct.toFixed(1)),
      aiRate: parseFloat(aiPct.toFixed(1)),
      status: status
    };
  }

  function updateWinRateDisplay() {
    if (!wrPlayerPct || !wrAiPct || !wrHumanBar || !wrAiBar) return;
    const wr = calculateWinRate();

    if (gameMode === 'ai') {
      wrPlayerLabel.textContent = '👤 플레이어';
      wrAiLabel.textContent = '🤖 AI 승률';
      wrPlayerPct.textContent = `${wr.humanRate.toFixed(1)}%`;
      wrAiPct.textContent = `${wr.aiRate.toFixed(1)}%`;
      wrHumanBar.style.width = `${wr.humanRate}%`;
      wrAiBar.style.width = `${wr.aiRate}%`;
      wrStatusText.textContent = `${wr.status} (${wr.humanRate.toFixed(0)} : ${wr.aiRate.toFixed(0)})`;
    } else {
      wrPlayerLabel.textContent = '⚫ 흑돌 승률';
      wrAiLabel.textContent = '⚪ 백돌 승률';
      wrPlayerPct.textContent = `${wr.humanRate.toFixed(1)}%`;
      wrAiPct.textContent = `${wr.aiRate.toFixed(1)}%`;
      wrHumanBar.style.width = `${wr.humanRate}%`;
      wrAiBar.style.width = `${wr.aiRate}%`;
      wrStatusText.textContent = `${wr.status} (${wr.humanRate.toFixed(0)} : ${wr.aiRate.toFixed(0)})`;
    }
  }

  // --- AI ENGINES: EASY, NORMAL, HARD ---
  function handleAiTurn() {
    if (gameOver) return;

    let move = null;

    if (difficulty === 'easy') {
      move = getEasyMove();
    } else if (difficulty === 'normal') {
      move = getNormalMove();
    } else {
      move = getHardMove();
    }

    if (move) {
      makeMove(move.r, move.c);
    }
  }

  // Find candidate empty spots near existing stones (within distance 2)
  function getCandidateMoves(distance = 2) {
    const candidates = [];
    const hasAnyStones = moveHistory.length > 0;

    if (!hasAnyStones) {
      // First move is center
      return [{ r: 7, c: 7 }];
    }

    const checked = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== EMPTY) {
          for (let dr = -distance; dr <= distance; dr++) {
            for (let dc = -distance; dc <= distance; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (board[nr][nc] === EMPTY && !checked[nr][nc]) {
                  checked[nr][nc] = true;
                  candidates.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }
    return candidates.length > 0 ? candidates : [{ r: 7, c: 7 }];
  }

  // 1. EASY AI:
  // - 70% chance to block/take immediate wins
  // - Otherwise random choice among close candidates
  function getEasyMove() {
    const candidates = getCandidateMoves(1);

    // Check immediate win for AI
    for (const cand of candidates) {
      board[cand.r][cand.c] = aiColor;
      if (checkWin(cand.r, cand.c, aiColor)) {
        board[cand.r][cand.c] = EMPTY;
        return cand;
      }
      board[cand.r][cand.c] = EMPTY;
    }

    // With 70% chance, check immediate block
    if (Math.random() < 0.7) {
      for (const cand of candidates) {
        board[cand.r][cand.c] = humanColor;
        if (checkWin(cand.r, cand.c, humanColor)) {
          board[cand.r][cand.c] = EMPTY;
          return cand;
        }
        board[cand.r][cand.c] = EMPTY;
      }
    }

    // Pick a semi-random move near existing stones
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 2. NORMAL (MEDIUM) AI:
  // Heuristic pattern evaluation for both Attack & Defense
  function getNormalMove() {
    const candidates = getCandidateMoves(2);
    let bestScore = -Infinity;
    let bestMove = candidates[0];

    for (const cand of candidates) {
      // Score AI attack
      const attackScore = evaluatePoint(cand.r, cand.c, aiColor);
      // Score Human defense threat
      const defenseScore = evaluatePoint(cand.r, cand.c, humanColor);

      // Total balance (defense is weighed 0.95)
      const totalScore = attackScore + defenseScore * 0.95 + (7 - Math.abs(cand.r - 7) + 7 - Math.abs(cand.c - 7));

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = cand;
      }
    }
    return bestMove;
  }

  // 3. HARD AI:
  // Comprehensive Gomoku Heuristic + Tactical Combos (4-4, 4-3, 3-3 detection)
  function getHardMove() {
    const candidates = getCandidateMoves(2);

    // 1. Check immediate win for AI
    for (const cand of candidates) {
      board[cand.r][cand.c] = aiColor;
      if (checkWin(cand.r, cand.c, aiColor)) {
        board[cand.r][cand.c] = EMPTY;
        return cand;
      }
      board[cand.r][cand.c] = EMPTY;
    }

    // 2. Check immediate win for Human (must block 5 in a row)
    for (const cand of candidates) {
      board[cand.r][cand.c] = humanColor;
      if (checkWin(cand.r, cand.c, humanColor)) {
        board[cand.r][cand.c] = EMPTY;
        return cand;
      }
      board[cand.r][cand.c] = EMPTY;
    }

    // 3. Multi-Factor Deep Heuristic
    let bestScore = -Infinity;
    let bestMove = candidates[0];

    for (const cand of candidates) {
      const myAtk = evaluatePointAdvanced(cand.r, cand.c, aiColor);
      const enemyDef = evaluatePointAdvanced(cand.r, cand.c, humanColor);

      // Positional center bias (stones closer to center control more diagonals)
      const centerDist = Math.abs(cand.r - 7) + Math.abs(cand.c - 7);
      const posBias = (14 - centerDist) * 3;

      // In Gomoku, if enemy has open 4 or 4-3, defense is ultra urgent
      let comboScore = myAtk * 1.1 + enemyDef * 1.05 + posBias;

      if (comboScore > bestScore) {
        bestScore = comboScore;
        bestMove = cand;
      }
    }
    return bestMove;
  }

  // Line pattern evaluator: returns score for placing 'player' at (r, c)
  function evaluatePoint(r, c, player) {
    let totalScore = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    board[r][c] = player;

    for (const [dr, dc] of directions) {
      let count = 1;
      let openEnds = 0;

      // Positive direction
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === player) {
            count++;
            step++;
          } else {
            if (board[nr][nc] === EMPTY) openEnds++;
            break;
          }
        } else break;
      }

      // Negative direction
      step = 1;
      while (true) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === player) {
            count++;
            step++;
          } else {
            if (board[nr][nc] === EMPTY) openEnds++;
            break;
          }
        } else break;
      }

      totalScore += getScoreForPattern(count, openEnds);
    }

    board[r][c] = EMPTY;
    return totalScore;
  }

  function evaluatePointAdvanced(r, c, player) {
    let totalScore = 0;
    let fourCount = 0;
    let openThreeCount = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    board[r][c] = player;

    for (const [dr, dc] of directions) {
      let count = 1;
      let openEnds = 0;

      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === player) {
            count++;
            step++;
          } else {
            if (board[nr][nc] === EMPTY) openEnds++;
            break;
          }
        } else break;
      }

      step = 1;
      while (true) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === player) {
            count++;
            step++;
          } else {
            if (board[nr][nc] === EMPTY) openEnds++;
            break;
          }
        } else break;
      }

      const patternScore = getScoreForPattern(count, openEnds);
      totalScore += patternScore;

      if (count === 4) fourCount++;
      if (count === 3 && openEnds === 2) openThreeCount++;
    }

    // Double threat bonuses
    if (fourCount >= 2) totalScore += 50000; // Double 4
    if (fourCount >= 1 && openThreeCount >= 1) totalScore += 30000; // 4-3 combo
    if (openThreeCount >= 2) totalScore += 20000; // Double 3 (3-3)

    board[r][c] = EMPTY;
    return totalScore;
  }

  function getScoreForPattern(count, openEnds) {
    if (count >= 5) return 100000; // 5 in a row
    if (count === 4) {
      if (openEnds === 2) return 15000; // Open 4 (unstoppable win)
      if (openEnds === 1) return 3000;  // Closed 4
      return 0;
    }
    if (count === 3) {
      if (openEnds === 2) return 2000;  // Open 3
      if (openEnds === 1) return 400;   // Closed 3
      return 0;
    }
    if (count === 2) {
      if (openEnds === 2) return 150;   // Open 2
      if (openEnds === 1) return 30;    // Closed 2
      return 0;
    }
    if (count === 1 && openEnds === 2) return 10;
    return 0;
  }

  // --- USER CONTROLS & EVENTS ---
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.round((x - PADDING) / cellSize);
    const row = Math.round((y - PADDING) / cellSize);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { r: row, c: col };
    }
    return null;
  }

  canvas.addEventListener('click', (e) => {
    initAudio();
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer !== humanColor) return;

    const pos = getCanvasCoords(e);
    if (pos && board[pos.r][pos.c] === EMPTY) {
      makeMove(pos.r, pos.c);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const pos = getCanvasCoords(e);
    hoverPos = pos;
    drawBoard();
  });

  canvas.addEventListener('mouseleave', () => {
    hoverPos = null;
    drawBoard();
  });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    initAudio();
    if (gameOver) return;
    if (gameMode === 'ai' && currentPlayer !== humanColor) return;

    const pos = getCanvasCoords(e);
    if (pos && board[pos.r][pos.c] === EMPTY) {
      e.preventDefault();
      makeMove(pos.r, pos.c);
    }
  }, { passive: false });

  // Mode & Difficulty Switches
  window.setMode = function (mode) {
    gameMode = mode;
    document.getElementById('mode-ai').classList.toggle('active', mode === 'ai');
    document.getElementById('mode-2p').classList.toggle('active', mode === '2p');

    diffGroup.style.display = mode === 'ai' ? 'flex' : 'none';
    colorGroup.style.display = mode === 'ai' ? 'flex' : 'none';
    restartGame();
  };

  window.setDifficulty = function (diff) {
    difficulty = diff;
    document.getElementById('diff-easy').classList.toggle('active', diff === 'easy');
    document.getElementById('diff-normal').classList.toggle('active', diff === 'normal');
    document.getElementById('diff-hard').classList.toggle('active', diff === 'hard');
    restartGame();
  };

  window.setPlayerColor = function (color) {
    humanColor = color;
    aiColor = color === BLACK ? WHITE : BLACK;
    document.getElementById('color-black').classList.toggle('active', color === BLACK);
    document.getElementById('color-white').classList.toggle('active', color === WHITE);
    restartGame();
  };

  window.undoMove = function () {
    if (gameOver) return;
    if (moveHistory.length === 0) return;

    if (gameMode === 'ai') {
      // In AI mode, undo human + AI moves (2 moves)
      if (currentPlayer === aiColor) return; // Wait if AI is thinking
      const stepsToUndo = moveHistory.length >= 2 ? 2 : 1;
      for (let i = 0; i < stepsToUndo; i++) {
        const last = moveHistory.pop();
        if (last) board[last.r][last.c] = EMPTY;
      }
      currentPlayer = humanColor;
    } else {
      // In 2P mode, undo 1 move
      const last = moveHistory.pop();
      if (last) {
        board[last.r][last.c] = EMPTY;
        currentPlayer = last.player;
      }
    }

    winningLine = null;
    updateHUD();
    drawBoard();
  };

  window.restartGame = function () {
    board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
    moveHistory = [];
    currentPlayer = BLACK;
    gameOver = false;
    winningLine = null;
    modal.classList.add('hidden');
    updateHUD();
    drawBoard();

    // If AI is Black (선공), it makes the first move at center
    if (gameMode === 'ai' && aiColor === BLACK) {
      setTimeout(() => {
        makeMove(7, 7);
      }, 300);
    }
  };

  window.resetScores = function () {
    scores = { win: 0, loss: 0, draw: 0 };
    scoreWin.textContent = '0';
    scoreLoss.textContent = '0';
    scoreDraw.textContent = '0';
  };

  // Initial draw
  updateHUD();
  drawBoard();
})();
