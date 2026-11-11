/**
 * 🪟 Windows 11 - 쌈뽕 에디션 (SsamPong Web OS)
 * Real Working Fake Windows Simulator
 */

(function () {
  'use strict';

  // --- Sound Effects Synthesizer (Web Audio API) ---
  let audioCtx = null;
  let masterVolume = 1.0;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const SOUNDS = {
    startup: () => {
      initAudio();
      if (!audioCtx || masterVolume <= 0) return;
      const now = audioCtx.currentTime;
      // Windows 11 style melodic chord arpeggio
      const notes = [
        { f: 523.25, t: 0.0, d: 0.8 }, // C5
        { f: 659.25, t: 0.15, d: 0.8 }, // E5
        { f: 783.99, t: 0.3, d: 1.0 }, // G5
        { f: 1046.50, t: 0.45, d: 1.4 }, // C6
        { f: 1318.51, t: 0.6, d: 1.8 }  // E6
      ];
      notes.forEach(n => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(n.f, now + n.t);
          gain.gain.setValueAtTime(0.18 * masterVolume, now + n.t);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + n.t);
          osc.stop(now + n.t + n.d);
        } catch (e) {}
      });
    },
    click: () => {
      initAudio();
      if (!audioCtx || masterVolume <= 0) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08 * masterVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
    },
    error: () => {
      initAudio();
      if (!audioCtx || masterVolume <= 0) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2 * masterVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.26);
      } catch (e) {}
    },
    trash: () => {
      initAudio();
      if (!audioCtx || masterVolume <= 0) return;
      try {
        // Paper crumple white noise burst
        const bufferSize = audioCtx.sampleRate * 0.18;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.15 * masterVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
        noise.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
      } catch (e) {}
    },
    fanfare: () => {
      initAudio();
      if (!audioCtx || masterVolume <= 0) return;
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          gain.gain.setValueAtTime(0.2 * masterVolume, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.35);
        } catch (e) {}
      });
    }
  };

  // --- Real Live Clock & Calendar Engine ---
  const lockTime = document.getElementById('lock-time');
  const lockDate = document.getElementById('lock-date');
  const taskbarTime = document.getElementById('taskbar-time');
  const taskbarDate = document.getElementById('taskbar-date');
  const calBigTime = document.getElementById('cal-big-time');
  const calBigDate = document.getElementById('cal-big-date');

  const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = String(hours % 12 || 12).padStart(2, '0');
    const timeStr = `${ampm} ${displayHours}:${minutes}:${seconds}`;
    const simpleTimeStr = `${displayHours}:${minutes}:${seconds}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const dayName = DAYS[now.getDay()];

    if (lockTime) lockTime.textContent = `${displayHours}:${minutes}:${seconds}`;
    if (lockDate) lockDate.textContent = `${year}년 ${month}월 ${date}일 ${dayName}`;
    if (taskbarTime) taskbarTime.textContent = timeStr;
    if (taskbarDate) taskbarDate.textContent = `${year}-${month}-${date}`;
    if (calBigTime) calBigTime.textContent = timeStr;
    if (calBigDate) calBigDate.textContent = `${year}년 ${month}월 ${date}일 ${dayName}`;
  }

  setInterval(updateClock, 1000);
  updateClock();

  // Generate Real Calendar Days
  function buildCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    dayLabels.forEach(lbl => {
      const el = document.createElement('div');
      el.className = 'cal-day-name';
      el.textContent = lbl;
      grid.appendChild(el);
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      grid.appendChild(empty);
    }

    for (let d = 1; d <= lastDate; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      if (d === today) cell.classList.add('today');
      cell.textContent = d;
      grid.appendChild(cell);
    }
  }
  buildCalendar();

  // --- Windows Lock & Login Screen ---
  const lockScreen = document.getElementById('lock-screen');
  const lockClockView = document.getElementById('lock-clock-view');
  const lockLoginView = document.getElementById('lock-login-view');
  const lockPwdInput = document.getElementById('lock-pwd-input');
  const btnUnlock = document.getElementById('btn-unlock');
  const lockErrorMsg = document.getElementById('lock-error-msg');
  const pwdBox = document.getElementById('pwd-box');

  const SECRET_PASSWORD = '12345678967';

  // Click on clock view to show password prompt
  lockClockView.addEventListener('click', () => {
    SOUNDS.click();
    lockClockView.classList.add('hidden');
    lockLoginView.classList.remove('hidden');
    lockPwdInput.focus();
  });

  window.addEventListener('keydown', (e) => {
    if (!lockScreen.classList.contains('unlocked')) {
      if (lockClockView && !lockClockView.classList.contains('hidden')) {
        SOUNDS.click();
        lockClockView.classList.add('hidden');
        lockLoginView.classList.remove('hidden');
        setTimeout(() => lockPwdInput.focus(), 100);
      }
    }
  });

  function attemptUnlock() {
    initAudio();
    const entered = lockPwdInput.value.trim();
    if (entered === SECRET_PASSWORD) {
      // Success! Unlock Desktop
      SOUNDS.startup();
      lockScreen.classList.add('unlocked');
      showToast('Windows 11', '선우 (SsamPong) 님, 환영합니다!');
      lockErrorMsg.classList.add('hidden');
    } else {
      // Error
      SOUNDS.error();
      lockErrorMsg.classList.remove('hidden');
      pwdBox.classList.add('shake');
      setTimeout(() => pwdBox.classList.remove('shake'), 400);
      lockPwdInput.select();
    }
  }

  btnUnlock.addEventListener('click', attemptUnlock);
  lockPwdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptUnlock();
  });

  // --- Window Manager (Dragging, Z-Index, Min/Max/Close) ---
  let topZIndex = 100;
  const windows = document.querySelectorAll('.window');
  const taskbarCenter = document.querySelector('.taskbar-center');

  function bringToFront(win) {
    topZIndex++;
    win.style.zIndex = topZIndex;

    // Update active state in taskbar
    const appKey = win.dataset.app;
    document.querySelectorAll('.taskbar-btn').forEach(btn => {
      if (btn.dataset.app === appKey) {
        btn.classList.add('active');
      }
    });
  }

  function openWindow(appKey) {
    initAudio();
    SOUNDS.click();
    const win = document.getElementById(`win-${appKey}`);
    if (!win) return;

    win.classList.remove('hidden');
    win.classList.remove('minimized');
    bringToFront(win);

    // Sync taskbar button active state
    const tbBtn = document.querySelector(`.taskbar-btn[data-app="${appKey}"]`);
    if (tbBtn) tbBtn.classList.add('active');
  }

  function closeWindow(win) {
    SOUNDS.click();
    win.classList.add('hidden');
    win.classList.remove('maximized');

    const appKey = win.dataset.app;
    const tbBtn = document.querySelector(`.taskbar-btn[data-app="${appKey}"]`);
    if (tbBtn) tbBtn.classList.remove('active');
  }

  function toggleWindow(appKey) {
    const win = document.getElementById(`win-${appKey}`);
    if (!win) return;

    if (win.classList.contains('hidden')) {
      openWindow(appKey);
    } else if (win.classList.contains('minimized')) {
      win.classList.remove('minimized');
      bringToFront(win);
    } else {
      // If window is already on top, minimize it; otherwise bring to front
      if (parseInt(win.style.zIndex || '0', 10) === topZIndex) {
        win.classList.add('minimized');
        const tbBtn = document.querySelector(`.taskbar-btn[data-app="${appKey}"]`);
        if (tbBtn) tbBtn.classList.remove('active');
      } else {
        bringToFront(win);
      }
    }
  }

  // Setup Dragging on Titlebars
  windows.forEach(win => {
    const titlebar = win.querySelector('.window-titlebar');
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    win.addEventListener('mousedown', () => bringToFront(win));

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.titlebar-controls')) return; // ignore control buttons
      if (win.classList.contains('maximized')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = win.offsetLeft;
      initialTop = win.offsetTop;
      bringToFront(win);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Screen boundary clamping
      newTop = Math.max(0, Math.min(window.innerHeight - 80, newTop));
      newLeft = Math.max(-win.offsetWidth + 100, Math.min(window.innerWidth - 100, newLeft));

      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Control buttons inside titlebar
    const btnMin = win.querySelector('.btn-min');
    const btnMax = win.querySelector('.btn-max');
    const btnClose = win.querySelector('.btn-close');

    if (btnMin) {
      btnMin.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.add('minimized');
        const tbBtn = document.querySelector(`.taskbar-btn[data-app="${win.dataset.app}"]`);
        if (tbBtn) tbBtn.classList.remove('active');
      });
    }

    if (btnMax) {
      btnMax.addEventListener('click', (e) => {
        e.stopPropagation();
        win.classList.toggle('maximized');
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(win);
      });
    }
  });

  // Desktop Icons Double Click / Click
  document.querySelectorAll('.desktop-icon[data-app]').forEach(icon => {
    icon.addEventListener('click', () => {
      openWindow(icon.dataset.app);
    });
  });

  // Taskbar App Buttons
  document.querySelectorAll('.taskbar-btn[data-app]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWindow(btn.dataset.app);
    });
  });

  // Start Menu Items Click
  document.querySelectorAll('.start-app-item[data-app], .start-rec-item[data-app]').forEach(item => {
    item.addEventListener('click', () => {
      openWindow(item.dataset.app);
      document.getElementById('start-menu').classList.add('hidden');
    });
  });

  // --- Start Menu & Flyouts Toggle ---
  const btnStart = document.getElementById('btn-start');
  const startMenu = document.getElementById('start-menu');
  const btnPower = document.getElementById('btn-power');
  const powerPopup = document.getElementById('power-popup');
  const calendarFlyout = document.getElementById('calendar-flyout');
  const btnTaskbarClock = document.getElementById('btn-taskbar-clock');
  const btnTaskbarSearch = document.getElementById('btn-taskbar-search');
  const btnShowDesktop = document.getElementById('btn-show-desktop');

  btnStart.addEventListener('click', (e) => {
    e.stopPropagation();
    SOUNDS.click();
    startMenu.classList.toggle('hidden');
    calendarFlyout.classList.add('hidden');
    powerPopup.classList.add('hidden');
  });

  btnTaskbarSearch.addEventListener('click', (e) => {
    e.stopPropagation();
    SOUNDS.click();
    startMenu.classList.remove('hidden');
    document.getElementById('start-search-input').focus();
  });

  btnTaskbarClock.addEventListener('click', (e) => {
    e.stopPropagation();
    SOUNDS.click();
    calendarFlyout.classList.toggle('hidden');
    startMenu.classList.add('hidden');
  });

  btnPower.addEventListener('click', (e) => {
    e.stopPropagation();
    powerPopup.classList.toggle('hidden');
  });

  btnShowDesktop.addEventListener('click', () => {
    windows.forEach(w => w.classList.add('minimized'));
  });

  // Close flyouts on desktop click
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== btnStart && !btnStart.contains(e.target)) {
      startMenu.classList.add('hidden');
    }
    if (!calendarFlyout.contains(e.target) && e.target !== btnTaskbarClock && !btnTaskbarClock.contains(e.target)) {
      calendarFlyout.classList.add('hidden');
    }
    if (!powerPopup.contains(e.target) && e.target !== btnPower) {
      powerPopup.classList.add('hidden');
    }
  });

  // Power options
  document.getElementById('btn-opt-lock').addEventListener('click', () => {
    lockScreen.classList.remove('unlocked');
    lockClockView.classList.remove('hidden');
    lockLoginView.classList.add('hidden');
    lockPwdInput.value = '';
    startMenu.classList.add('hidden');
  });

  document.getElementById('btn-opt-restart').addEventListener('click', () => {
    triggerRebootSimulation();
  });

  document.getElementById('btn-opt-shutdown').addEventListener('click', () => {
    document.body.innerHTML = `
      <div style="background:#000;color:#fff;width:100vw;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;">
        <h1 style="font-size:2rem;margin-bottom:12px;">시스템이 안전하게 종료되었습니다.</h1>
        <p style="color:#94a3b8;margin-bottom:24px;">컴퓨터 전원을 끄셔도 됩니다.</p>
        <button onclick="location.reload()" style="background:#0078d4;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;">다시 켜기 (전원 버튼)</button>
      </div>
    `;
  });

  // Windows Toast Notification helper
  const winToast = document.getElementById('win-toast');
  const toastTitle = document.getElementById('toast-title');
  const toastDesc = document.getElementById('toast-desc');
  let toastTimer = null;

  function showToast(title, desc, icon = 'ℹ️') {
    document.getElementById('toast-icon').textContent = icon;
    toastTitle.textContent = title;
    toastDesc.textContent = desc;
    winToast.classList.remove('hidden');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      winToast.classList.add('hidden');
    }, 4000);
  }

  // ==========================================================================
  // APP 1: Real Working Calculator Logic
  // ==========================================================================
  (function initCalculator() {
    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');

    let currentVal = '0';
    let previousVal = null;
    let currentOp = null;
    let shouldResetDisplay = false;

    function updateCalcDisplay() {
      display.textContent = currentVal;
      if (previousVal !== null && currentOp !== null) {
        history.textContent = `${previousVal} ${getOpSymbol(currentOp)}`;
      } else {
        history.textContent = '\u00A0';
      }
    }

    function getOpSymbol(op) {
      if (op === 'plus') return '+';
      if (op === 'minus') return '−';
      if (op === 'multiply') return '×';
      if (op === 'divide') return '÷';
      return '';
    }

    function inputDigit(digit) {
      if (shouldResetDisplay || currentVal === '0') {
        currentVal = digit;
        shouldResetDisplay = false;
      } else {
        currentVal += digit;
      }
      updateCalcDisplay();
    }

    function inputDecimal() {
      if (shouldResetDisplay) {
        currentVal = '0.';
        shouldResetDisplay = false;
      } else if (!currentVal.includes('.')) {
        currentVal += '.';
      }
      updateCalcDisplay();
    }

    function handleOperator(op) {
      const num = parseFloat(currentVal);
      if (previousVal === null) {
        previousVal = num;
      } else if (currentOp) {
        previousVal = calculate(previousVal, num, currentOp);
        currentVal = String(previousVal);
      }
      currentOp = op;
      shouldResetDisplay = true;
      updateCalcDisplay();
    }

    function calculate(a, b, op) {
      if (op === 'plus') return a + b;
      if (op === 'minus') return a - b;
      if (op === 'multiply') return a * b;
      if (op === 'divide') {
        if (b === 0) {
          showToast('계산기', '0으로 나눌 수 없습니다! 🧮');
          return 0;
        }
        return a / b;
      }
      return b;
    }

    function executeEquals() {
      if (previousVal !== null && currentOp !== null) {
        const num = parseFloat(currentVal);
        const result = calculate(previousVal, num, currentOp);
        history.textContent = `${previousVal} ${getOpSymbol(currentOp)} ${num} =`;
        currentVal = String(Math.round(result * 100000000) / 100000000);
        previousVal = null;
        currentOp = null;
        shouldResetDisplay = true;
        display.textContent = currentVal;
        SOUNDS.click();
      }
    }

    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SOUNDS.click();
        const k = btn.dataset.k;

        if (!isNaN(k)) {
          inputDigit(k);
        } else if (k === 'dot') {
          inputDecimal();
        } else if (['plus', 'minus', 'multiply', 'divide'].includes(k)) {
          handleOperator(k);
        } else if (k === 'equals') {
          executeEquals();
        } else if (k === 'c') {
          currentVal = '0';
          previousVal = null;
          currentOp = null;
          shouldResetDisplay = false;
          updateCalcDisplay();
        } else if (k === 'ce') {
          currentVal = '0';
          updateCalcDisplay();
        } else if (k === 'back') {
          if (currentVal.length > 1) {
            currentVal = currentVal.slice(0, -1);
          } else {
            currentVal = '0';
          }
          updateCalcDisplay();
        } else if (k === 'neg') {
          currentVal = String(-parseFloat(currentVal));
          updateCalcDisplay();
        } else if (k === 'sq') {
          const num = parseFloat(currentVal);
          currentVal = String(num * num);
          shouldResetDisplay = true;
          updateCalcDisplay();
        } else if (k === 'sqrt') {
          const num = parseFloat(currentVal);
          currentVal = String(Math.sqrt(Math.max(0, num)));
          shouldResetDisplay = true;
          updateCalcDisplay();
        } else if (k === 'inv') {
          const num = parseFloat(currentVal);
          currentVal = num !== 0 ? String(1 / num) : '0';
          shouldResetDisplay = true;
          updateCalcDisplay();
        } else if (k === 'percent') {
          currentVal = String(parseFloat(currentVal) / 100);
          updateCalcDisplay();
        }
      });
    });

    // Keyboard support for calculator
    window.addEventListener('keydown', (e) => {
      const winCalc = document.getElementById('win-calc');
      if (winCalc.classList.contains('hidden') || winCalc.classList.contains('minimized')) return;
      if (parseInt(winCalc.style.zIndex || '0', 10) !== topZIndex) return;

      if (!isNaN(e.key)) inputDigit(e.key);
      if (e.key === '.') inputDecimal();
      if (e.key === '+') handleOperator('plus');
      if (e.key === '-') handleOperator('minus');
      if (e.key === '*') handleOperator('multiply');
      if (e.key === '/') handleOperator('divide');
      if (e.key === 'Enter' || e.key === '=') executeEquals();
      if (e.key === 'Backspace') {
        currentVal = currentVal.length > 1 ? currentVal.slice(0, -1) : '0';
        updateCalcDisplay();
      }
      if (e.key === 'Escape') {
        currentVal = '0';
        previousVal = null;
        currentOp = null;
        updateCalcDisplay();
      }
    });
  })();

  // ==========================================================================
  // APP 2: Real Working Minesweeper Game Logic
  // ==========================================================================
  (function initMinesweeper() {
    const boardEl = document.getElementById('minesweeper-board');
    const mineCountDisplay = document.getElementById('mine-count-display');
    const timerDisplay = document.getElementById('mine-timer-display');
    const faceBtn = document.getElementById('btn-mine-restart');

    const ROWS = 9;
    const COLS = 9;
    const TOTAL_MINES = 10;

    let board = [];
    let isGameOver = false;
    let timer = 0;
    let timerInterval = null;
    let flagsPlaced = 0;
    let revealedCount = 0;
    let isFirstClick = true;

    function startNewGame() {
      clearInterval(timerInterval);
      timer = 0;
      flagsPlaced = 0;
      revealedCount = 0;
      isGameOver = false;
      isFirstClick = true;
      faceBtn.textContent = '🙂';
      timerDisplay.textContent = '000';
      mineCountDisplay.textContent = String(TOTAL_MINES).padStart(3, '0');

      board = Array.from({ length: ROWS }, () => 
        Array.from({ length: COLS }, () => ({
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0
        }))
      );

      renderBoard();
    }

    function placeMines(excludeR, excludeC) {
      let placed = 0;
      while (placed < TOTAL_MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (!board[r][c].isMine && !(r === excludeR && c === excludeC)) {
          board[r][c].isMine = true;
          placed++;
        }
      }

      // Count neighbors
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!board[r][c].isMine) {
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
                  count++;
                }
              }
            }
            board[r][c].neighborMines = count;
          }
        }
      }
    }

    function renderBoard() {
      boardEl.innerHTML = '';
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = document.createElement('div');
          cell.className = 'mine-cell';
          cell.dataset.r = r;
          cell.dataset.c = c;

          const data = board[r][c];
          if (data.revealed) {
            cell.classList.add('revealed');
            if (data.isMine) {
              cell.classList.add('mine');
              cell.textContent = '💣';
            } else if (data.neighborMines > 0) {
              cell.textContent = data.neighborMines;
              cell.dataset.val = data.neighborMines;
            }
          } else if (data.flagged) {
            cell.textContent = '🚩';
          }

          cell.addEventListener('mousedown', (e) => {
            if (isGameOver) return;
            if (e.button === 0) faceBtn.textContent = '😮';
          });

          cell.addEventListener('mouseup', () => {
            if (!isGameOver) faceBtn.textContent = '🙂';
          });

          cell.addEventListener('click', () => revealCell(r, c));
          cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleFlag(r, c);
          });

          boardEl.appendChild(cell);
        }
      }
    }

    function revealCell(r, c) {
      if (isGameOver || board[r][c].revealed || board[r][c].flagged) return;

      if (isFirstClick) {
        isFirstClick = false;
        placeMines(r, c);
        timerInterval = setInterval(() => {
          timer = Math.min(999, timer + 1);
          timerDisplay.textContent = String(timer).padStart(3, '0');
        }, 1000);
      }

      SOUNDS.click();
      const cellData = board[r][c];
      cellData.revealed = true;
      revealedCount++;

      if (cellData.isMine) {
        // Boom! Game Over
        isGameOver = true;
        clearInterval(timerInterval);
        faceBtn.textContent = '😵';
        SOUNDS.error();
        // Reveal all mines
        board.forEach(row => row.forEach(cell => {
          if (cell.isMine) cell.revealed = true;
        }));
        renderBoard();
        showToast('지뢰찾기', '💥 지뢰를 밟았습니다! 게임 오버!');
        return;
      }

      // If blank, flood fill
      if (cellData.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !board[nr][nc].revealed) {
              revealCell(nr, nc);
            }
          }
        }
      }

      renderBoard();
      checkWin();
    }

    function toggleFlag(r, c) {
      if (isGameOver || board[r][c].revealed) return;
      SOUNDS.click();
      const cellData = board[r][c];
      cellData.flagged = !cellData.flagged;
      flagsPlaced += cellData.flagged ? 1 : -1;
      mineCountDisplay.textContent = String(Math.max(0, TOTAL_MINES - flagsPlaced)).padStart(3, '0');
      renderBoard();
    }

    function checkWin() {
      if (revealedCount === (ROWS * COLS - TOTAL_MINES)) {
        isGameOver = true;
        clearInterval(timerInterval);
        faceBtn.textContent = '😎';
        SOUNDS.fanfare();
        if (window.confetti) {
          window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        showToast('지뢰찾기 승리!', `🎉 축하합니다! ${timer}초 만에 모든 지뢰를 찾았습니다!`);
      }
    }

    faceBtn.addEventListener('click', startNewGame);
    startNewGame();

    // Cheat code function for VIP Console
    window.cheatRevealMines = function () {
      board.forEach((row, r) => row.forEach((cell, c) => {
        if (cell.isMine && !cell.flagged) {
          toggleFlag(r, c);
        }
      }));
      showToast('VIP 치트 발동', '💣 모든 지뢰 위치에 깃발이 꽂혔습니다!');
    };
  })();

  // ==========================================================================
  // APP 3: Coupang Store App Logic
  // ==========================================================================
  (function initCoupang() {
    const productGrid = document.getElementById('coupang-product-grid');
    const searchInput = document.getElementById('coupang-search-input');
    const btnSearch = document.getElementById('btn-coupang-search');
    const cartCountEl = document.getElementById('coupang-cart-count');

    let cartCount = 0;

    const PRODUCTS = [
      { id: 1, name: 'Apple 2024 맥북 프로 16 M3 Max', price: 3990000, emoji: '💻', tag: '로켓배송 🚀' },
      { id: 2, name: '농심 신라면 120g 5개입', price: 3980, emoji: '🍜', tag: '로켓프레시 🥬' },
      { id: 3, name: '닌텐도 스위치 OLED 본체 화이트', price: 415000, emoji: '🎮', tag: '로켓배송 🚀' },
      { id: 4, name: '애플 에어팟 프로 2세대 USB-C', price: 312000, emoji: '🎧', tag: '로켓와우 ⭐' },
      { id: 5, name: '쌈뽕 파워 에너지 드링크 24캔', price: 24900, emoji: '⚡', tag: '로켓배송 🚀' },
      { id: 6, name: '로지텍 무선 기계식 게이밍 키보드', price: 129000, emoji: '⌨️', tag: '로켓배송 🚀' },
      { id: 7, name: '제주 삼다수 2L 6병', price: 5880, emoji: '💧', tag: '로켓프레시 🥬' },
      { id: 8, name: '쌈뽕 게임 메이커 골드 에디션', price: 0, emoji: '👑', tag: '무료배송 🚚' }
    ];

    function renderProducts(query = '') {
      productGrid.innerHTML = '';
      const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

      if (filtered.length === 0) {
        productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:#64748b;">검색된 상품이 없습니다. 다른 키워드로 검색해보세요!</div>';
        return;
      }

      filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'coupang-card';
        card.innerHTML = `
          <div class="card-img-placeholder">${p.emoji}</div>
          <div class="card-title">${p.name}</div>
          <div class="card-badge-row">
            <span class="badge-rocket">${p.tag}</span>
          </div>
          <div class="card-price-row">
            <span class="card-price">${p.price === 0 ? '무료 (Free)' : p.price.toLocaleString() + '원'}</span>
          </div>
          <button class="card-btn-buy" data-id="${p.id}">바로 구매</button>
        `;

        card.querySelector('.card-btn-buy').addEventListener('click', () => {
          SOUNDS.fanfare();
          cartCount++;
          cartCountEl.textContent = cartCount;
          if (window.confetti) {
            window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
          }
          showToast('쿠팡 로켓배송 주문 완료 🚀', `'${p.name}' 주문이 접수되었습니다! 내일 새벽 7시 전 도착 보장!`);
        });

        productGrid.appendChild(card);
      });
    }

    btnSearch.addEventListener('click', () => {
      renderProducts(searchInput.value.trim());
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') renderProducts(searchInput.value.trim());
    });

    renderProducts();

    document.getElementById('btn-view-cart').addEventListener('click', () => {
      showToast('장바구니', `현재 담긴 상품 수: ${cartCount}개`);
    });
  })();

  // ==========================================================================
  // APP 4: Google Chrome Search Engine Logic
  // ==========================================================================
  (function initGoogle() {
    const homeView = document.getElementById('google-home-view');
    const resultsView = document.getElementById('google-results-view');
    const queryInput = document.getElementById('google-query-input');
    const resultsInput = document.getElementById('google-results-input');
    const btnSearch = document.getElementById('btn-google-search');
    const btnResultsSearch = document.getElementById('btn-results-search');
    const resultsList = document.getElementById('google-results-list');
    const btnBackHome = document.getElementById('btn-back-to-google-home');

    function performSearch(q) {
      if (!q) return;
      SOUNDS.click();
      homeView.classList.add('hidden');
      resultsView.classList.remove('hidden');
      resultsInput.value = q;
      queryInput.value = q;

      resultsList.innerHTML = '';

      // Generate realistic results
      const results = [
        {
          url: 'https://ssampong-mini-game.vercel.app',
          title: `${q} - 쌈뽕 미니게임 천국 공식 웹사이트`,
          snippet: '검 강화 타자, 네온 틱택토, 정통 오목, 얼불춤, 네온 비트 건반, 쌈뽕 게임 메이커까지 누구나 웹에서 즉시 즐길 수 있는 최고의 게임 포털입니다.'
        },
        {
          url: 'https://ko.wikipedia.org/wiki/' + encodeURIComponent(q),
          title: `${q} - 위키백과, 우리 모두의 백과사전`,
          snippet: `${q}에 관한 방대한 역사와 정의, 다양한 사용 사례 및 최신 정보를 위키백과에서 확인해보세요.`
        },
        {
          url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q),
          title: `${q} 최신 인기 동영상 및 실시간 스트리밍 모음`,
          snippet: `${q} 관련 고화질 영상, 리뷰, 플레이 영상 및 유튜버들의 추천 컨텐츠를 감상하세요.`
        },
        {
          url: 'https://news.naver.com/search?query=' + encodeURIComponent(q),
          title: `[속보] ${q} 관련 오늘 자 주요 뉴스 및 동향`,
          snippet: `오늘 날짜 기준으로 ${q}에 관한 주요 언론사들의 심층 분석과 실시간 핫이슈 보도 자료입니다.`
        }
      ];

      results.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
          <div class="search-url">${item.url}</div>
          <a class="search-title" href="${item.url}" target="_blank">${item.title}</a>
          <div class="search-snippet">${item.snippet}</div>
        `;
        resultsList.appendChild(div);
      });
    }

    btnSearch.addEventListener('click', () => performSearch(queryInput.value.trim()));
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch(queryInput.value.trim());
    });

    btnResultsSearch.addEventListener('click', () => performSearch(resultsInput.value.trim()));
    resultsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch(resultsInput.value.trim());
    });

    document.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        queryInput.value = chip.dataset.q;
        performSearch(chip.dataset.q);
      });
    });

    btnBackHome.addEventListener('click', () => {
      homeView.classList.remove('hidden');
      resultsView.classList.add('hidden');
    });

    document.getElementById('btn-google-lucky').addEventListener('click', () => {
      performSearch(queryInput.value.trim() || '쌈뽕 미니게임');
    });
  })();

  // ==========================================================================
  // APP 5: User Custom Vault (사용자 지정 & VIP 제어판)
  // ==========================================================================
  (function initVault() {
    const authView = document.getElementById('vault-auth-view');
    const vipView = document.getElementById('vault-vip-view');
    const pwdInput = document.getElementById('vault-pwd-input');
    const btnUnlock = document.getElementById('btn-vault-unlock');
    const btnRelock = document.getElementById('btn-relock-vault');
    const btnLockSys = document.getElementById('btn-lock-system');
    const volSlider = document.getElementById('vip-slider-volume');
    const volVal = document.getElementById('vip-vol-val');

    function checkVaultPwd() {
      if (pwdInput.value.trim() === SECRET_PASSWORD) {
        SOUNDS.fanfare();
        authView.classList.add('hidden');
        vipView.classList.remove('hidden');
        if (window.confetti) {
          window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
        showToast('VIP 보안 인증 완료', '👑 비밀 제어 콘솔이 개방되었습니다!');
      } else {
        SOUNDS.error();
        pwdInput.classList.add('shake');
        setTimeout(() => pwdInput.classList.remove('shake'), 400);
        showToast('보안 오류', '비밀번호 11자리가 일치하지 않습니다 (12345678967).');
      }
    }

    btnUnlock.addEventListener('click', checkVaultPwd);
    pwdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkVaultPwd();
    });

    btnRelock.addEventListener('click', () => {
      vipView.classList.add('hidden');
      authView.classList.remove('hidden');
      pwdInput.value = '';
      showToast('사용자 지정', '🔒 VIP 콘솔이 다시 잠겼습니다.');
    });

    btnLockSys.addEventListener('click', () => {
      document.getElementById('btn-opt-lock').click();
    });

    // Wallpaper Switcher
    document.querySelectorAll('.wp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wp-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.body.className = btn.dataset.theme;
        SOUNDS.click();
        showToast('바탕 화면', '배경화면 테마가 변경되었습니다!');
      });
    });

    // Volume Slider
    volSlider.addEventListener('input', (e) => {
      masterVolume = parseInt(e.target.value, 10) / 100;
      volVal.textContent = `${Math.round(masterVolume * 100)}%`;
    });

    document.getElementById('btn-test-chime').addEventListener('click', () => {
      SOUNDS.startup();
    });

    // Cheats
    document.getElementById('btn-cheat-minesweeper').addEventListener('click', () => {
      if (window.cheatRevealMines) window.cheatRevealMines();
    });

    document.getElementById('btn-cheat-coupang').addEventListener('click', () => {
      SOUNDS.fanfare();
      showToast('쿠팡 치트 발동', '💰 사용자 계정에 5,000,000 캐시가 충전되었습니다!');
    });

    document.getElementById('btn-cheat-calc').addEventListener('click', () => {
      const calcWin = document.getElementById('win-calc');
      calcWin.style.borderColor = '#fbbf24';
      calcWin.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.6)';
      SOUNDS.fanfare();
      showToast('계산기 치트', '🧮 골든 네온 스킨이 계산기에 적용되었습니다!');
    });

    document.getElementById('btn-cheat-praise').addEventListener('click', () => {
      SOUNDS.fanfare();
      showToast('전설의 67', '⭐ 우주 최강 숫자 67 찬양 모드가 활성화되었습니다!');
    });
  })();

  // ==========================================================================
  // APP 6: Recycle Bin (휴지통)
  // ==========================================================================
  (function initRecycleBin() {
    const listEl = document.getElementById('trash-list');
    const countEl = document.getElementById('trash-item-count');
    const btnEmpty = document.getElementById('btn-empty-trash');
    const btnRestore = document.getElementById('btn-restore-trash');
    const desktopTrashEmoji = document.getElementById('icon-trash-emoji');

    let trashItems = [
      { name: '기말고사_공부자료_최종.pdf', date: '2026-11-10', size: '4.2 MB', icon: '📄' },
      { name: '인터넷_익스플로러_구버전.exe', date: '2026-11-09', size: '18.5 MB', icon: '💾' },
      { name: '숙제_진짜_진짜_final.docx', date: '2026-11-08', size: '512 KB', icon: '📝' },
      { name: '비밀번호_모음_1234.txt', date: '2026-11-07', size: '12 KB', icon: '🔑' }
    ];

    function renderTrash() {
      listEl.innerHTML = '';
      countEl.textContent = `항목 ${trashItems.length}개`;

      if (trashItems.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b;">휴지통이 비어 있습니다.</div>';
        desktopTrashEmoji.textContent = '🗑️';
        return;
      }

      desktopTrashEmoji.textContent = '🗑️';

      trashItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'trash-item';
        row.innerHTML = `
          <div class="trash-col-name"><span>${item.icon}</span> <span>${item.name}</span></div>
          <div class="trash-col-date">${item.date}</div>
          <div class="trash-col-size">${item.size}</div>
        `;
        listEl.appendChild(row);
      });
    }

    btnEmpty.addEventListener('click', () => {
      if (trashItems.length === 0) return;
      SOUNDS.trash();
      trashItems = [];
      renderTrash();
      showToast('휴지통', '휴지통을 완전히 비웠습니다.');
    });

    btnRestore.addEventListener('click', () => {
      SOUNDS.click();
      trashItems = [
        { name: '기말고사_공부자료_최종.pdf', date: '2026-11-10', size: '4.2 MB', icon: '📄' },
        { name: '인터넷_익스플로러_구버전.exe', date: '2026-11-09', size: '18.5 MB', icon: '💾' },
        { name: '숙제_진짜_진짜_final.docx', date: '2026-11-08', size: '512 KB', icon: '📝' },
        { name: '비밀번호_모음_1234.txt', date: '2026-11-07', size: '12 KB', icon: '🔑' }
      ];
      renderTrash();
      showToast('휴지통', '모든 항목이 복원되었습니다.');
    });

    renderTrash();
  })();

  // ==========================================================================
  // APP 7: Windows Update (윈도우 업데이트 시뮬레이터)
  // ==========================================================================
  (function initWindowsUpdate() {
    const btnCheck = document.getElementById('btn-check-updates');
    const btnRestart = document.getElementById('btn-trigger-restart');
    const cardProgress = document.getElementById('update-progress-card');
    const progressBar = document.getElementById('update-progress-bar');
    const progressPercent = document.getElementById('update-progress-percent');
    const statusDesc = document.getElementById('update-status-desc');

    btnCheck.addEventListener('click', () => {
      SOUNDS.click();
      btnCheck.disabled = true;
      btnCheck.textContent = '업데이트 확인 중...';
      statusDesc.textContent = '새로운 업데이트를 확인하고 있습니다...';

      setTimeout(() => {
        statusDesc.textContent = '중요 업데이트 1건이 발견되었습니다. 설치를 진행합니다.';
        cardProgress.classList.remove('hidden');

        let percent = 0;
        const interval = setInterval(() => {
          percent += Math.floor(Math.random() * 15) + 5;
          if (percent >= 100) {
            percent = 100;
            clearInterval(interval);
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
            statusDesc.textContent = '업데이트가 설치되었습니다. 컴퓨터를 다시 시작해야 합니다.';
            btnCheck.classList.add('hidden');
            btnRestart.classList.remove('hidden');
            showToast('Windows 업데이트', '설치 완료! 시스템을 다시 시작하세요.', '🔄');
          } else {
            progressBar.style.width = `${percent}%`;
            progressPercent.textContent = `${percent}%`;
          }
        }, 300);
      }, 1200);
    });

    btnRestart.addEventListener('click', () => {
      triggerRebootSimulation();
    });
  })();

  function triggerRebootSimulation() {
    const bsod = document.getElementById('bsod-update-screen');
    const percentText = document.getElementById('bsod-percent-text');
    bsod.classList.remove('hidden');

    let percent = 12;
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 20) + 10;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        percentText.textContent = '100% 완료됨. 컴퓨터를 다시 시작합니다...';

        setTimeout(() => {
          bsod.classList.add('hidden');
          // Boot sound & lock screen
          SOUNDS.startup();
          lockScreen.classList.remove('unlocked');
          lockClockView.classList.remove('hidden');
          lockLoginView.classList.add('hidden');
          lockPwdInput.value = '';
          showToast('Windows 11', '업데이트가 성공적으로 완료되었습니다!', '✨');
        }, 2000);
      } else {
        percentText.textContent = `${percent}% 완료됨. 컴퓨터를 끄지 마십시오.`;
      }
    }, 450);
  }

  // ==========================================================================
  // APP 8: Notepad (메모장)
  // ==========================================================================
  (function initNotepad() {
    const textarea = document.getElementById('notepad-textarea');
    const lineCol = document.getElementById('notepad-line-col');
    const btnSave = document.getElementById('btn-notepad-save');
    const btnClear = document.getElementById('btn-notepad-clear');

    // Load saved note
    const saved = localStorage.getItem('fake_win_notepad_text');
    if (saved) textarea.value = saved;

    function updateLineCol() {
      const text = textarea.value.substr(0, textarea.selectionStart);
      const lines = text.split('\n');
      const curLine = lines.length;
      const curCol = lines[lines.length - 1].length + 1;
      lineCol.textContent = `줄 ${curLine}, 열 ${curCol}`;
    }

    textarea.addEventListener('keyup', updateLineCol);
    textarea.addEventListener('click', updateLineCol);

    btnSave.addEventListener('click', () => {
      SOUNDS.click();
      localStorage.setItem('fake_win_notepad_text', textarea.value);
      showToast('메모장', '메모가 저장되었습니다 (로컬 브라우저 저장소).');
    });

    btnClear.addEventListener('click', () => {
      if (confirm('새 문서를 만드시겠습니까? 저장되지 않은 내용은 삭제됩니다.')) {
        textarea.value = '';
        updateLineCol();
      }
    });
  })();

  // Open default app on load (Calculator or Google)
  setTimeout(() => {
    // Keep desktop ready
  }, 500);

})();
