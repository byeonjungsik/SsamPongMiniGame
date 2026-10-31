/**
 * 🧮 쌈뽕 스마트 계산기 (Smart Neon Calculator)
 * Full Interactive Engine with Scientific Functions & History
 */

(function () {
  'use strict';

  // DOM Elements
  const appRoot = document.querySelector('.calculator-app');
  const expressionLine = document.getElementById('expression-line');
  const resultLine = document.getElementById('result-line');
  const keyClear = document.getElementById('key-clear');
  const copyBtn = document.getElementById('btn-copy');
  const copyToast = document.getElementById('copy-toast');

  const modeStdBtn = document.getElementById('mode-std-btn');
  const modeSciBtn = document.getElementById('mode-sci-btn');
  const scientificPanel = document.getElementById('scientific-panel');

  const soundToggleBtn = document.getElementById('btn-sound-toggle');
  const historyToggleBtn = document.getElementById('btn-history-toggle');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  const closeHistoryBtn = document.getElementById('btn-close-history');

  // Calculator State
  let currentInput = '0';
  let previousValue = null;
  let activeOperator = null; // '+', '-', '×', '÷', '^'
  let waitingForOperand = false;
  let expressionHistory = '';
  let calculationDone = false;

  let historyData = [];
  let isSoundEnabled = true;

  // Web Audio Context for haptic key click
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

  function playKeyClickSound(type = 'num') {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      let freq = 600;
      if (type === 'op') freq = 850;
      else if (type === 'equals') freq = 1200;
      else if (type === 'clear') freq = 450;
      else if (type === 'sci') freq = 980;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Audio playback ignore on restrict
    }
  }

  // Formatting Number with Commas
  function formatDisplayNumber(numStr) {
    if (numStr === 'Error' || numStr === 'Infinity' || numStr === '-Infinity' || numStr === 'NaN') {
      return numStr;
    }
    const parts = numStr.split('.');
    const intPart = parts[0];
    const decPart = parts.length > 1 ? '.' + parts[1] : '';

    // Add comma to integer part
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedInt + decPart;
  }

  // Adjust font size based on string length
  function adjustFontSize() {
    const len = resultLine.textContent.length;
    if (len > 16) {
      resultLine.style.fontSize = '1.45rem';
    } else if (len > 12) {
      resultLine.style.fontSize = '1.85rem';
    } else if (len > 9) {
      resultLine.style.fontSize = '2.2rem';
    } else {
      resultLine.style.fontSize = '2.6rem';
    }
  }

  function updateDisplay() {
    resultLine.textContent = formatDisplayNumber(currentInput);
    expressionLine.textContent = expressionHistory || '\u00A0';
    adjustFontSize();

    // Toggle AC / C label
    if (currentInput !== '0' || previousValue !== null) {
      keyClear.textContent = 'C';
    } else {
      keyClear.textContent = 'AC';
    }

    // Highlight active operator button
    document.querySelectorAll('.key-op').forEach(btn => {
      if (waitingForOperand && activeOperator && btn.dataset.val === activeOperator) {
        btn.classList.add('active-op');
      } else {
        btn.classList.remove('active-op');
      }
    });
  }

  // Number Input
  function inputDigit(digit) {
    playKeyClickSound('num');

    if (calculationDone) {
      currentInput = digit;
      expressionHistory = '';
      calculationDone = false;
      waitingForOperand = false;
      updateDisplay();
      return;
    }

    if (waitingForOperand) {
      currentInput = digit;
      waitingForOperand = false;
    } else {
      if (currentInput === '0') {
        currentInput = digit;
      } else {
        if (currentInput.replace(/[^0-9]/g, '').length < 16) {
          currentInput += digit;
        }
      }
    }
    updateDisplay();
  }

  // Decimal Point
  function inputDecimal() {
    playKeyClickSound('num');

    if (calculationDone) {
      currentInput = '0.';
      expressionHistory = '';
      calculationDone = false;
      waitingForOperand = false;
      updateDisplay();
      return;
    }

    if (waitingForOperand) {
      currentInput = '0.';
      waitingForOperand = false;
      updateDisplay();
      return;
    }

    if (!currentInput.includes('.')) {
      currentInput += '.';
      updateDisplay();
    }
  }

  // Operators (+, -, ×, ÷, ^)
  function handleOperator(nextOperator) {
    playKeyClickSound('op');
    const inputValue = parseFloat(currentInput);

    if (calculationDone) {
      calculationDone = false;
    }

    if (previousValue === null) {
      previousValue = inputValue;
    } else if (activeOperator && !waitingForOperand) {
      const result = performCalculation(activeOperator, previousValue, inputValue);
      currentInput = String(result);
      previousValue = result;
    }

    waitingForOperand = true;
    activeOperator = nextOperator;
    expressionHistory = `${formatDisplayNumber(String(previousValue))} ${nextOperator}`;
    updateDisplay();
  }

  function performCalculation(op, firstVal, secondVal) {
    let res = 0;
    switch (op) {
      case '+':
        res = firstVal + secondVal;
        break;
      case '-':
        res = firstVal - secondVal;
        break;
      case '×':
        res = firstVal * secondVal;
        break;
      case '÷':
        if (secondVal === 0) return 'Error';
        res = firstVal / secondVal;
        break;
      case '^':
        res = Math.pow(firstVal, secondVal);
        break;
      default:
        return secondVal;
    }
    // Clean floating point precision issues (e.g. 0.1 + 0.2 = 0.3)
    return parseFloat(res.toPrecision(12));
  }

  // Calculate Equals (=)
  function calculateEquals() {
    playKeyClickSound('equals');

    if (activeOperator === null || previousValue === null) {
      return;
    }

    const currentValue = parseFloat(currentInput);
    const result = performCalculation(activeOperator, previousValue, currentValue);

    const fullExp = `${formatDisplayNumber(String(previousValue))} ${activeOperator} ${formatDisplayNumber(String(currentValue))}`;

    // Save to history
    saveHistory(fullExp, String(result));

    expressionHistory = `${fullExp} =`;
    currentInput = String(result);
    previousValue = null;
    activeOperator = null;
    waitingForOperand = false;
    calculationDone = true;

    updateDisplay();
  }

  // Clear (AC / C)
  function handleClear() {
    playKeyClickSound('clear');

    if (keyClear.textContent === 'C' && !calculationDone) {
      currentInput = '0';
    } else {
      currentInput = '0';
      previousValue = null;
      activeOperator = null;
      waitingForOperand = false;
      expressionHistory = '';
      calculationDone = false;
    }
    updateDisplay();
  }

  // Backspace (⌫)
  function handleBackspace() {
    playKeyClickSound('clear');
    if (calculationDone) {
      expressionHistory = '';
      calculationDone = false;
      return;
    }

    if (waitingForOperand) return;

    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '-' || currentInput === '-0') {
        currentInput = '0';
      }
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  // Percent (%)
  function handlePercent() {
    playKeyClickSound('fn');
    let val = parseFloat(currentInput);
    if (previousValue !== null && (activeOperator === '+' || activeOperator === '-')) {
      val = previousValue * (val / 100);
    } else {
      val = val / 100;
    }
    currentInput = String(parseFloat(val.toPrecision(12)));
    updateDisplay();
  }

  // Negate (±)
  function handleNegate() {
    playKeyClickSound('fn');
    if (currentInput === '0' || currentInput === 'Error') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    updateDisplay();
  }

  // Scientific Single-Operand Functions
  function handleScientific(action) {
    playKeyClickSound('sci');
    const val = parseFloat(currentInput);
    let res = null;
    let expDesc = '';

    switch (action) {
      case 'square':
        res = Math.pow(val, 2);
        expDesc = `sqr(${val})`;
        break;
      case 'cube':
        res = Math.pow(val, 3);
        expDesc = `cube(${val})`;
        break;
      case 'sqrt':
        if (val < 0) res = 'Error';
        else res = Math.sqrt(val);
        expDesc = `√(${val})`;
        break;
      case 'reciprocal':
        if (val === 0) res = 'Error';
        else res = 1 / val;
        expDesc = `1/(${val})`;
        break;
      case 'factorial':
        if (val < 0 || !Number.isInteger(val) || val > 170) res = 'Error';
        else {
          let f = 1;
          for (let i = 2; i <= val; i++) f *= i;
          res = f;
        }
        expDesc = `fact(${val})`;
        break;
      case 'sin':
        // Degree input
        res = Math.sin((val * Math.PI) / 180);
        expDesc = `sin(${val}°)`;
        break;
      case 'cos':
        res = Math.cos((val * Math.PI) / 180);
        expDesc = `cos(${val}°)`;
        break;
      case 'tan':
        if ((val - 90) % 180 === 0) res = 'Error';
        else res = Math.tan((val * Math.PI) / 180);
        expDesc = `tan(${val}°)`;
        break;
      case 'log':
        if (val <= 0) res = 'Error';
        else res = Math.log10(val);
        expDesc = `log(${val})`;
        break;
      case 'ln':
        if (val <= 0) res = 'Error';
        else res = Math.log(val);
        expDesc = `ln(${val})`;
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      case 'power':
        handleOperator('^');
        return;
      case 'paren-open':
      case 'paren-close':
        // Informative note for single-step standard engine
        return;
    }

    if (res !== null) {
      if (res !== 'Error') {
        res = parseFloat(Number(res).toPrecision(12));
      }
      if (expDesc) {
        saveHistory(expDesc, String(res));
        expressionHistory = `${expDesc} =`;
      }
      currentInput = String(res);
      calculationDone = true;
      updateDisplay();
    }
  }

  // Copy Result to Clipboard
  function copyResult() {
    initAudio();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentInput).then(() => {
        showCopyToast();
      }).catch(() => {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const ta = document.createElement('textarea');
    ta.value = currentInput;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopyToast();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function showCopyToast() {
    copyToast.classList.add('show');
    setTimeout(() => {
      copyToast.classList.remove('show');
    }, 1500);
  }

  // History System
  function saveHistory(expr, res) {
    if (res === 'Error') return;
    historyData.unshift({ expr, res, timestamp: Date.now() });
    if (historyData.length > 50) historyData.pop();
    renderHistory();
    try {
      localStorage.setItem('ssampong_calc_history', JSON.stringify(historyData));
    } catch (e) {}
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem('ssampong_calc_history');
      if (saved) {
        historyData = JSON.parse(saved);
        renderHistory();
      }
    } catch (e) {}
  }

  function renderHistory() {
    if (historyData.length === 0) {
      historyList.innerHTML = '<div class="empty-history">아직 계산 기록이 없습니다.</div>';
      return;
    }

    historyList.innerHTML = '';
    historyData.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <span class="hist-exp">${item.expr}</span>
        <strong class="hist-res">${formatDisplayNumber(item.res)}</strong>
      `;
      div.addEventListener('click', () => {
        playKeyClickSound('fn');
        currentInput = item.res;
        calculationDone = true;
        updateDisplay();
      });
      historyList.appendChild(div);
    });
  }

  function clearHistory() {
    historyData = [];
    localStorage.removeItem('ssampong_calc_history');
    renderHistory();
  }

  // Mode Switch (Standard vs Scientific)
  modeStdBtn.addEventListener('click', () => {
    modeStdBtn.classList.add('active');
    modeSciBtn.classList.remove('active');
    scientificPanel.classList.add('hidden');
    appRoot.classList.remove('sci-mode');
  });

  modeSciBtn.addEventListener('click', () => {
    modeSciBtn.classList.add('active');
    modeStdBtn.classList.remove('active');
    scientificPanel.classList.remove('hidden');
    appRoot.classList.add('sci-mode');
  });

  // Tools Bar Listeners
  soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundToggleBtn.textContent = isSoundEnabled ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('active', isSoundEnabled);
  });

  historyToggleBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('hidden');
    historyToggleBtn.classList.toggle('active', !historyPanel.classList.contains('hidden'));
  });

  closeHistoryBtn.addEventListener('click', () => {
    historyPanel.classList.add('hidden');
    historyToggleBtn.classList.remove('active');
  });

  clearHistoryBtn.addEventListener('click', clearHistory);
  copyBtn.addEventListener('click', copyResult);

  // Keypad Click Delegation
  document.querySelector('.keypad-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      if (btn.dataset.num === '.') inputDecimal();
      else inputDigit(btn.dataset.num);
    } else if (btn.dataset.action) {
      const act = btn.dataset.action;
      if (act === 'operator') handleOperator(btn.dataset.val);
      else if (act === 'calculate') calculateEquals();
      else if (act === 'clear') handleClear();
      else if (act === 'backspace') handleBackspace();
      else if (act === 'percent') handlePercent();
      else if (act === 'negate') handleNegate();
    }
  });

  // Scientific Panel Click Delegation
  scientificPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.action) return;
    handleScientific(btn.dataset.action);
  });

  // Keyboard Shortcuts Support
  window.addEventListener('keydown', (e) => {
    // Prevent accidental form submissions or scrolling with Space / Backspace
    if (e.key === 'Backspace' || e.key === '/') {
      e.preventDefault();
    }

    let targetBtn = null;

    if (e.key >= '0' && e.key <= '9') {
      inputDigit(e.key);
      targetBtn = document.querySelector(`.key-num[data-num="${e.key}"]`);
    } else if (e.key === '.') {
      inputDecimal();
      targetBtn = document.querySelector('.key-num[data-num="."]');
    } else if (e.key === '+' || e.key === '-') {
      handleOperator(e.key);
      targetBtn = document.querySelector(`.key-op[data-val="${e.key}"]`);
    } else if (e.key === '*' || e.key === 'x') {
      handleOperator('×');
      targetBtn = document.querySelector('.key-op[data-val="×"]');
    } else if (e.key === '/') {
      handleOperator('÷');
      targetBtn = document.querySelector('.key-op[data-val="÷"]');
    } else if (e.key === 'Enter' || e.key === '=') {
      calculateEquals();
      targetBtn = document.querySelector('.key-equals');
    } else if (e.key === 'Backspace') {
      handleBackspace();
      targetBtn = document.querySelector('.key-fn[data-action="backspace"]');
    } else if (e.key === 'Escape') {
      handleClear();
      targetBtn = keyClear;
    } else if (e.key === '%') {
      handlePercent();
      targetBtn = document.querySelector('.key-fn[data-action="percent"]');
    }

    if (targetBtn) {
      targetBtn.classList.add('pressed');
      setTimeout(() => targetBtn.classList.remove('pressed'), 120);
    }
  });

  // Init
  loadHistory();
  updateDisplay();
})();
