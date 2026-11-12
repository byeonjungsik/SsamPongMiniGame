/**
 * 💣 쌈뽕 지뢰찾기 (SsamPong Minesweeper) - Game Engine
 * Features:
 * - First-Click Safe Zone Guarantee
 * - Full Classic Rules, Flood-Fill BFS Zero Reveal, and Chording
 * - Touch-friendly: Dig/Flag Mode Toggle & Long-Press Flagging
 * - Web Audio API Sound Synthesizer & Canvas Confetti Victory
 * - Multiple Difficulties & Custom Grid Settings
 * - LocalStorage Best Time Tracking & Multiple Themes
 */

(function () {
  'use strict';

  // --- 1. Sound Effects (Web Audio API) ---
  let audioCtx = null;
  let soundEnabled = true;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'flag') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.07);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'explode') {
        // Deep noise explosion rumble
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'chord') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'win') {
        // Fanfare chord
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.25, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.32);
        });
      }
    } catch (e) {
      // Audio autoplay policy
    }
  }

  // --- 2. Configurations & Presets ---
  const PRESETS = {
    easy: { rows: 9, cols: 9, mines: 10, name: '초급 (9×9)' },
    normal: { rows: 16, cols: 16, mines: 40, name: '중급 (16×16)' },
    hard: { rows: 16, cols: 30, mines: 99, name: '고급 (16×30)' }
  };

  let currentDiff = 'easy';
  let rows = PRESETS.easy.rows;
  let cols = PRESETS.easy.cols;
  let totalMines = PRESETS.easy.mines;

  let board = [];
  let gameState = 'READY'; // 'READY', 'PLAYING', 'WON', 'LOST'
  let isFirstClick = true;
  let flagsCount = 0;
  let timer = 0;
  let timerInterval = null;
  let touchMode = 'dig'; // 'dig' or 'flag'

  // Long press tracking for mobile
  let longPressTimer = null;
  let isLongPress = false;

  // Best scores storage
  const STORAGE_KEY = 'ssampong_minesweeper_best_scores';
  function getBestScores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveBestScore(diff, timeSec) {
    const scores = getBestScores();
    if (!scores[diff] || timeSec < scores[diff]) {
      scores[diff] = timeSec;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      } catch (e) {}
      return true; // new record
    }
    return false;
  }

  // DOM Elements
  const mineBoardEl = document.getElementById('mine-board');
  const mineCounterEl = document.getElementById('mine-counter');
  const timeCounterEl = document.getElementById('time-counter');
  const faceEmojiEl = document.getElementById('face-emoji');
  const faceBtnEl = document.getElementById('face-btn');
  const bestScoreDisplayEl = document.getElementById('best-score-display');

  const toolDigBtn = document.getElementById('tool-dig');
  const toolFlagBtn = document.getElementById('tool-flag');
  const btnHint = document.getElementById('btn-hint');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIconEl = document.getElementById('sound-icon');

  const customModalEl = document.getElementById('custom-modal');
  const customRowsInput = document.getElementById('custom-rows');
  const customColsInput = document.getElementById('custom-cols');
  const customMinesInput = document.getElementById('custom-mines');

  const resultModalEl = document.getElementById('result-modal');
  const resultIconEl = document.getElementById('result-icon');
  const resultTitleEl = document.getElementById('result-title');
  const resultDescEl = document.getElementById('result-desc');
  const statDiffEl = document.getElementById('stat-diff');
  const statTimeEl = document.getElementById('stat-time');
  const statBestEl = document.getElementById('stat-best');

  // --- 3. Board Initialization ---
  function initBoard() {
    board = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          count: 0,
          isOpen: false,
          isFlagged: false,
          isQuestion: false
        });
      }
      board.push(row);
    }
  }

  function startNewGame() {
    clearInterval(timerInterval);
    timer = 0;
    flagsCount = 0;
    gameState = 'READY';
    isFirstClick = true;

    initBoard();
    updateDisplays();
    renderBoard();
    updateBestDisplay();
    faceEmojiEl.textContent = '😊';
  }

  // --- 4. First Click & Mine Placement ---
  function placeMines(safeR, safeC) {
    let placed = 0;
    // Collect all valid positions except the safe 3x3 surrounding safeR, safeC
    const candidates = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isNeighbor = Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1;
        if (!isNeighbor) {
          candidates.push({ r, c });
        }
      }
    }

    // Shuffle candidates (Fisher-Yates)
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const actualMines = Math.min(totalMines, candidates.length);
    for (let i = 0; i < actualMines; i++) {
      const { r, c } = candidates[i];
      board[r][c].isMine = true;
    }

    // Compute adjacent mine counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (board[nr][nc].isMine) count++;
              }
            }
          }
          board[r][c].count = count;
        }
      }
    }
  }

  // --- 5. Cell Reveal & Flood-Fill ---
  function revealCell(r, c) {
    if (gameState === 'WON' || gameState === 'LOST') return;
    const cell = board[r][c];
    if (cell.isOpen || cell.isFlagged) return;

    // Start timer and place mines on first click
    if (isFirstClick) {
      isFirstClick = false;
      gameState = 'PLAYING';
      placeMines(r, c);
      startTimer();
    }

    if (cell.isMine) {
      // Game Over: Boom!
      gameOverLoss(r, c);
      return;
    }

    // BFS Flood Fill for safe zero clusters
    const queue = [{ r, c }];
    cell.isOpen = true;
    let openedCount = 1;

    while (queue.length > 0) {
      const curr = queue.shift();
      const currCell = board[curr.r][curr.c];

      if (currCell.count === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = curr.r + dr, nc = curr.c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = board[nr][nc];
              if (!neighbor.isOpen && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isOpen = true;
                openedCount++;
                if (neighbor.count === 0) {
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }

    playSound(openedCount > 1 ? 'chord' : 'click');
    renderBoard();
    checkWinCondition();
  }

  // --- 6. Chording (Reveal Neighbors of Number Cell) ---
  function performChord(r, c) {
    const cell = board[r][c];
    if (!cell.isOpen || cell.count === 0) return;

    // Count adjacent flags
    let adjacentFlags = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (board[nr][nc].isFlagged) adjacentFlags++;
        }
      }
    }

    if (adjacentFlags === cell.count) {
      let triggeredBomb = false;
      let bombR = -1, bombC = -1;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const neighbor = board[nr][nc];
            if (!neighbor.isOpen && !neighbor.isFlagged) {
              if (neighbor.isMine) {
                triggeredBomb = true;
                bombR = nr;
                bombC = nc;
              }
            }
          }
        }
      }

      if (triggeredBomb) {
        gameOverLoss(bombR, bombC);
      } else {
        // Open all safe neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const neighbor = board[nr][nc];
              if (!neighbor.isOpen && !neighbor.isFlagged) {
                revealCell(nr, nc);
              }
            }
          }
        }
        playSound('chord');
      }
    }
  }

  // --- 7. Flag Toggling ---
  function toggleFlag(r, c) {
    if (gameState === 'WON' || gameState === 'LOST') return;
    const cell = board[r][c];
    if (cell.isOpen) return;

    if (!cell.isFlagged && !cell.isQuestion) {
      cell.isFlagged = true;
      flagsCount++;
      playSound('flag');
    } else if (cell.isFlagged) {
      cell.isFlagged = false;
      cell.isQuestion = true;
      flagsCount--;
      playSound('click');
    } else {
      cell.isQuestion = false;
      playSound('click');
    }

    updateDisplays();
    renderBoard();
  }

  // --- 8. Win / Loss Handlers ---
  function checkWinCondition() {
    let unOpenedCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isOpen) unOpenedCount++;
      }
    }

    if (unOpenedCount === totalMines) {
      gameState = 'WON';
      clearInterval(timerInterval);
      faceEmojiEl.textContent = '😎';
      playSound('win');

      // Auto flag remaining mines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (board[r][c].isMine) board[r][c].isFlagged = true;
        }
      }
      flagsCount = totalMines;
      updateDisplays();
      renderBoard();

      // Confetti burst
      if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      // Best score record
      const isNewRecord = saveBestScore(currentDiff, timer);
      const diffName = PRESETS[currentDiff] ? PRESETS[currentDiff].name : '커스텀';

      statDiffEl.textContent = diffName;
      statTimeEl.textContent = `${timer}초`;
      statBestEl.textContent = isNewRecord ? `${timer}초 (🎉 신기록!)` : `${getBestScores()[currentDiff] || timer}초`;

      resultIconEl.textContent = '🏆';
      resultTitleEl.textContent = '지뢰찾기 클리어!';
      resultDescEl.textContent = `축하합니다! ${timer}초 만에 모든 지뢰를 피하고 안전지대를 찾았습니다!`;
      resultModalEl.classList.remove('hidden');

      updateBestDisplay();
    }
  }

  function gameOverLoss(hitR, hitC) {
    gameState = 'LOST';
    clearInterval(timerInterval);
    faceEmojiEl.textContent = '😵';
    playSound('explode');

    // Reveal all mines and mark wrong flags
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (cell.isMine) {
          if (!cell.isFlagged) {
            cell.isOpen = true;
          }
        } else if (cell.isFlagged) {
          cell.isWrongFlag = true;
        }
      }
    }

    // Mark the triggered mine
    if (hitR !== undefined && hitC !== undefined) {
      board[hitR][hitC].isExploded = true;
    }

    renderBoard();
  }

  // --- 9. Timer & Displays ---
  function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    timerInterval = setInterval(() => {
      timer++;
      if (timer > 999) timer = 999;
      timeCounterEl.textContent = String(timer).padStart(3, '0');
    }, 1000);
  }

  function updateDisplays() {
    const remainingMines = totalMines - flagsCount;
    const formattedMines = remainingMines < 0
      ? `-${String(Math.abs(remainingMines)).padStart(2, '0')}`
      : String(Math.max(0, remainingMines)).padStart(3, '0');

    mineCounterEl.textContent = formattedMines;
    timeCounterEl.textContent = String(timer).padStart(3, '0');
  }

  function updateBestDisplay() {
    const bests = getBestScores();
    const bestTime = bests[currentDiff];
    bestScoreDisplayEl.textContent = bestTime ? `${bestTime}초` : '--초';
  }

  // --- 10. DOM Board Rendering ---
  function renderBoard() {
    mineBoardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    mineBoardEl.style.gridTemplateRows = `repeat(${rows}, 32px)`;
    mineBoardEl.innerHTML = '';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;

        if (cell.isOpen) {
          cellEl.classList.add('opened');
          if (cell.isMine) {
            if (cell.isExploded) {
              cellEl.classList.add('mine-exploded');
              cellEl.textContent = '💥';
            } else {
              cellEl.textContent = '💣';
            }
          } else if (cell.count > 0) {
            cellEl.dataset.num = cell.count;
            cellEl.textContent = cell.count;
          }
        } else {
          if (cell.isFlagged) {
            cellEl.classList.add('flagged');
            cellEl.textContent = '🚩';
            if (cell.isWrongFlag) cellEl.classList.add('wrong-flag');
          } else if (cell.isQuestion) {
            cellEl.textContent = '❓';
          }
        }

        // Mouse Down Face Reaction
        cellEl.addEventListener('mousedown', (e) => {
          if (e.button === 0 && gameState !== 'WON' && gameState !== 'LOST' && !cell.isOpen) {
            faceEmojiEl.textContent = '😮';
          }
        });

        // Mouse Events
        cellEl.addEventListener('click', (e) => {
          if (gameState === 'WON' || gameState === 'LOST') return;
          if (touchMode === 'flag') {
            toggleFlag(r, c);
          } else {
            if (cell.isOpen && cell.count > 0) {
              performChord(r, c);
            } else {
              revealCell(r, c);
            }
          }
        });

        cellEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(r, c);
        });

        // Touch Long-press support on mobile
        cellEl.addEventListener('touchstart', (e) => {
          isLongPress = false;
          longPressTimer = setTimeout(() => {
            isLongPress = true;
            toggleFlag(r, c);
            if (navigator.vibrate) navigator.vibrate(40);
          }, 360);
        }, { passive: true });

        cellEl.addEventListener('touchend', (e) => {
          clearTimeout(longPressTimer);
          if (isLongPress) {
            e.preventDefault();
          }
        });

        cellEl.addEventListener('touchmove', () => {
          clearTimeout(longPressTimer);
        });

        mineBoardEl.appendChild(cellEl);
      }
    }
  }

  document.addEventListener('mouseup', () => {
    if (gameState !== 'WON' && gameState !== 'LOST') {
      faceEmojiEl.textContent = '😊';
    }
  });

  // --- 11. Hint Feature ---
  btnHint.addEventListener('click', () => {
    if (gameState === 'WON' || gameState === 'LOST') return;
    if (isFirstClick) {
      // Recommend center cell
      const centerR = Math.floor(rows / 2);
      const centerC = Math.floor(cols / 2);
      highlightHint(centerR, centerC);
      return;
    }

    // Scan for guaranteed safe cell by simple deduction
    let safeCandidate = null;

    // 1. Check opened cells whose remaining unrevealed neighbors == unflagged mines needed
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (cell.isOpen && cell.count > 0) {
          let flags = 0;
          const unopenedNeighbors = [];

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const n = board[nr][nc];
                if (n.isFlagged) flags++;
                else if (!n.isOpen) unopenedNeighbors.push({ r: nr, c: nc });
              }
            }
          }

          // If flags == count, any unopened neighbor is guaranteed safe!
          if (flags === cell.count && unopenedNeighbors.length > 0) {
            safeCandidate = unopenedNeighbors[0];
            break;
          }
        }
      }
      if (safeCandidate) break;
    }

    // 2. If no guaranteed chord safe, pick any unopened non-mine cell
    if (!safeCandidate) {
      const allSafeUnopened = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = board[r][c];
          if (!cell.isOpen && !cell.isMine && !cell.isFlagged) {
            allSafeUnopened.push({ r, c });
          }
        }
      }
      if (allSafeUnopened.length > 0) {
        safeCandidate = allSafeUnopened[Math.floor(Math.random() * allSafeUnopened.length)];
      }
    }

    if (safeCandidate) {
      highlightHint(safeCandidate.r, safeCandidate.c);
    }
  });

  function highlightHint(r, c) {
    const selector = `.cell[data-r="${r}"][data-c="${c}"]`;
    const el = mineBoardEl.querySelector(selector);
    if (el) {
      el.classList.add('hint-cell');
      playSound('chord');
      setTimeout(() => {
        el.classList.remove('hint-cell');
      }, 2000);
    }
  }

  // --- 12. Controls & Event Listeners ---

  // Face Button Restart
  faceBtnEl.addEventListener('click', startNewGame);

  // Difficulty Buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.dataset.diff;
      if (diff === 'custom') {
        customModalEl.classList.remove('hidden');
        return;
      }
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentDiff = diff;
      rows = PRESETS[diff].rows;
      cols = PRESETS[diff].cols;
      totalMines = PRESETS[diff].mines;
      startNewGame();
    });
  });

  // Touch Tool Toggles (Dig vs Flag)
  toolDigBtn.addEventListener('click', () => {
    touchMode = 'dig';
    toolDigBtn.classList.add('active');
    toolFlagBtn.classList.remove('active');
  });

  toolFlagBtn.addEventListener('click', () => {
    touchMode = 'flag';
    toolFlagBtn.classList.add('active');
    toolDigBtn.classList.remove('active');
  });

  // Sound Toggle
  btnSoundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIconEl.textContent = soundEnabled ? '🔊 소리' : '🔇 음소거';
  });

  // Theme Picker
  document.querySelectorAll('.theme-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.body.className = btn.dataset.theme;
    });
  });

  // Custom Modal Handlers
  document.getElementById('btn-custom-close').addEventListener('click', () => {
    customModalEl.classList.add('hidden');
  });
  document.getElementById('btn-custom-cancel').addEventListener('click', () => {
    customModalEl.classList.add('hidden');
  });
  document.getElementById('btn-custom-apply').addEventListener('click', () => {
    let r = parseInt(customRowsInput.value, 10);
    let c = parseInt(customColsInput.value, 10);
    let m = parseInt(customMinesInput.value, 10);

    r = Math.max(8, Math.min(30, isNaN(r) ? 16 : r));
    c = Math.max(8, Math.min(40, isNaN(c) ? 30 : c));
    const maxMines = Math.floor(r * c * 0.85);
    m = Math.max(5, Math.min(maxMines, isNaN(m) ? 40 : m));

    rows = r;
    cols = c;
    totalMines = m;
    currentDiff = 'custom';

    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.diff-btn[data-diff="custom"]').classList.add('active');

    customModalEl.classList.add('hidden');
    startNewGame();
  });

  // Result Modal Handlers
  document.getElementById('btn-modal-restart').addEventListener('click', () => {
    resultModalEl.classList.add('hidden');
    startNewGame();
  });
  document.getElementById('btn-modal-review').addEventListener('click', () => {
    resultModalEl.classList.add('hidden');
  });

  // Start game on initial load
  startNewGame();
})();
