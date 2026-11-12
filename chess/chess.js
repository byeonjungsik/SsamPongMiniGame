/**
 * ♟️ 쌈뽕 체스 (SsamPong Chess) - Core Game Engine & AI
 * Features:
 * - Full FIDE Chess Rules: Legal Move Validation, Castling, En Passant, Pawn Promotion
 * - Check, Checkmate & Stalemate Detection
 * - Real-time AI Win Rate & Evaluation Bar (Material + Positional Piece-Square Tables)
 * - 3 AI Difficulties (Easy, Normal, Hard) with Minimax & Alpha-Beta Pruning
 * - Web Audio API Sound Effects & Canvas Confetti Victory Celebration
 * - Timers, Move History Notation, Hints, Board Flipping & Theme Switching
 */

(function () {
  'use strict';

  // --- 1. Piece SVGs (Clean, Vector Standard Chess Pieces) ---
  const SVG_PIECES = {
    // White pieces
    'P': `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    'N': `<svg viewBox="0 0 45 45"><path d="m 22,10 c 10.5,1 16.5,8 16,29 l -23,0 c 0,-9 10,-6.5 8,-21" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/><path d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.89,-1.9 2,-3.5 0.2,-2.14 -0.66,-3.45 -0.66,-3.45 0,0 2.2,-0.2 4.16,1.45 C 19.5,13.6 21,15.5 22,18 z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/><circle cx="15.5" cy="18.5" r="1.5" fill="#1e293b"/></svg>`,
    'B': `<svg viewBox="0 0 45 45"><g fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -3.39,-0.21 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.79 -13.5,1 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z" fill="#ffffff"/><path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z" fill="#ffffff"/><path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z" fill="#ffffff"/><path d="m 17.5,26 h 10 M 22.5,21 v 10 M 22.5,13 v 5"/></g></svg>`,
    'R': `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,39 h 27 v -3 H 9 v 3 z m 3,-3 v -4 h 21 v 4 H 12 z m -1,-22 2.5,18 h 18 l 2.5,-18 z m -2,-3 v 3 h 4 v -3 z m 8,0 v 3 h 5 v -3 z m 9,0 v 3 h 4 v -3 z"/></g></svg>`,
    'Q': `<svg viewBox="0 0 45 45"><g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,11 -4,-15 -4.5,15 -7,-11 z"/><path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1.5,2.5 -1.5,2.5 -1.5,1.5 0.5,2.5 0.5,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0.5,-2.5 0,0 0,-1.5 -1.5,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z"/><circle cx="6" cy="12" r="2.2"/><circle cx="14" cy="9" r="2.2"/><circle cx="22.5" cy="8" r="2.2"/><circle cx="31" cy="9" r="2.2"/><circle cx="39" cy="12" r="2.2"/></g></svg>`,
    'K': `<svg viewBox="0 0 45 45"><g fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 22.5,11.63 v 6 M 20,13.5 h 5" stroke-width="2"/><path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 -1.5,-3 -6,-3 -7.5,0 -1.5,3 3,10.5 3,10.5" fill="#ffffff"/><path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-1 -6,2 -6,2 0,0 0,-4 -6,-4 -6,0 -6,4 -6,4 0,0 -2,-3 -6,-2 -3,6 6,10.5 6,10.5 v 7 z" fill="#ffffff"/><path d="m 11.5,30 c 5.5,-3 15.5,-3 21,0 m -21,3.5 c 5.5,-3 15.5,-3 21,0 m -21,3.5 c 5.5,-3 15.5,-3 21,0"/></g></svg>`,

    // Black pieces
    'p': `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    'n': `<svg viewBox="0 0 45 45"><path d="m 22,10 c 10.5,1 16.5,8 16,29 l -23,0 c 0,-9 10,-6.5 8,-21" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5"/><path d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.89,-1.9 2,-3.5 0.2,-2.14 -0.66,-3.45 -0.66,-3.45 0,0 2.2,-0.2 4.16,1.45 C 19.5,13.6 21,15.5 22,18 z" fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5"/><circle cx="15.5" cy="18.5" r="1.5" fill="#f8fafc"/></svg>`,
    'b': `<svg viewBox="0 0 45 45"><g fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -3.39,-0.21 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.79 -13.5,1 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z" fill="#1e293b"/><path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z" fill="#1e293b"/><path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z" fill="#1e293b"/><path d="m 17.5,26 h 10 M 22.5,21 v 10 M 22.5,13 v 5"/></g></svg>`,
    'r': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,39 h 27 v -3 H 9 v 3 z m 3,-3 v -4 h 21 v 4 H 12 z m -1,-22 2.5,18 h 18 l 2.5,-18 z m -2,-3 v 3 h 4 v -3 z m 8,0 v 3 h 5 v -3 z m 9,0 v 3 h 4 v -3 z"/></g></svg>`,
    'q': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,11 -4,-15 -4.5,15 -7,-11 z"/><path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1.5,2.5 -1.5,2.5 -1.5,1.5 0.5,2.5 0.5,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0.5,-2.5 0,0 0,-1.5 -1.5,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z"/><circle cx="6" cy="12" r="2.2"/><circle cx="14" cy="9" r="2.2"/><circle cx="22.5" cy="8" r="2.2"/><circle cx="31" cy="9" r="2.2"/><circle cx="39" cy="12" r="2.2"/></g></svg>`,
    'k': `<svg viewBox="0 0 45 45"><g fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 22.5,11.63 v 6 M 20,13.5 h 5" stroke-width="2"/><path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 -1.5,-3 -6,-3 -7.5,0 -1.5,3 3,10.5 3,10.5" fill="#1e293b"/><path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-1 -6,2 -6,2 0,0 0,-4 -6,-4 -6,0 -6,4 -6,4 0,0 -2,-3 -6,-2 -3,6 6,10.5 6,10.5 v 7 z" fill="#1e293b"/><path d="m 11.5,30 c 5.5,-3 15.5,-3 21,0 m -21,3.5 c 5.5,-3 15.5,-3 21,0 m -21,3.5 c 5.5,-3 15.5,-3 21,0"/></g></svg>`
  };

  // --- 2. Piece-Square Tables (PST) for AI Position Evaluation ---
  const PST_PAWN = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];
  const PST_KNIGHT = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ];
  const PST_BISHOP = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ];
  const PST_ROOK = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ];
  const PST_QUEEN = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ];
  const PST_KING_MID = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ];

  const PIECE_VALUES = {
    'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
  };

  // --- 3. Audio Synth (Web Audio API) ---
  let audioCtx = null;
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
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'move') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'capture') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'check') {
        [523.25, 659.25].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.25, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.22);
        });
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.38);
        });
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // --- 4. Game State Variables ---
  let board = [];
  let currentTurn = 'w'; // 'w' or 'b'
  let castling = { wK: true, wQ: true, bK: true, bQ: true };
  let enPassant = null; // { r, c }
  let halfMoveClock = 0;
  let fullMoveNumber = 1;
  let moveHistory = []; // Move records for undo and display

  let gameMode = 'ai'; // 'ai' or '2p'
  let aiDiff = 'normal'; // 'easy', 'normal', 'hard'
  let playerSide = 'w'; // 'w' (White) or 'b' (Black)
  let isFlipped = false;
  let timeLimit = 0; // 0 = unlimited, 180, 300, 600
  let whiteTime = 0;
  let blackTime = 0;
  let timerInterval = null;
  let isGameOver = false;

  let selectedSquare = null; // { r, c }
  let legalMovesForSelected = []; // Array of move objects
  let lastMove = null; // { from: {r,c}, to: {r,c} }
  let hintSquares = null; // { from: {r,c}, to: {r,c} }
  let pendingPromotion = null; // { from, to }

  // DOM Elements Cache
  const chessboardEl = document.getElementById('chessboard');
  const turnDotEl = document.getElementById('turn-dot');
  const turnTextEl = document.getElementById('turn-text');
  const checkAlertEl = document.getElementById('check-alert');

  const evalBarWhiteEl = document.getElementById('eval-bar-white');
  const evalBarBlackEl = document.getElementById('eval-bar-black');
  const evalValueLabelEl = document.getElementById('eval-value-label');
  const evalScoreTextEl = document.getElementById('eval-score-text');
  const evalFillBarEl = document.getElementById('eval-fill-bar');
  const evalWhitePctEl = document.getElementById('eval-white-pct');
  const evalBlackPctEl = document.getElementById('eval-black-pct');

  const historyListEl = document.getElementById('history-list');
  const moveCountBadgeEl = document.getElementById('move-count-badge');

  const topAvatarEl = document.getElementById('top-avatar');
  const topNameEl = document.getElementById('top-name');
  const topColorTagEl = document.getElementById('top-color-tag');
  const topCapturedEl = document.getElementById('top-captured');
  const topClockEl = document.getElementById('top-clock');

  const bottomAvatarEl = document.getElementById('bottom-avatar');
  const bottomNameEl = document.getElementById('bottom-name');
  const bottomColorTagEl = document.getElementById('bottom-color-tag');
  const bottomCapturedEl = document.getElementById('bottom-captured');
  const bottomClockEl = document.getElementById('bottom-clock');

  const promoModalEl = document.getElementById('promotion-modal');
  const promoPiecesEl = document.getElementById('promo-pieces');
  const gameOverModalEl = document.getElementById('game-over-modal');
  const gameOverIconEl = document.getElementById('game-over-icon');
  const gameOverTitleEl = document.getElementById('game-over-title');
  const gameOverDescEl = document.getElementById('game-over-desc');
  const statTotalMovesEl = document.getElementById('stat-total-moves');
  const statTimeEl = document.getElementById('stat-time');

  // --- 5. Chess Board Initialization ---
  function initBoard() {
    return [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
  }

  function resetGame() {
    board = initBoard();
    currentTurn = 'w';
    castling = { wK: true, wQ: true, bK: true, bQ: true };
    enPassant = null;
    halfMoveClock = 0;
    fullMoveNumber = 1;
    moveHistory = [];
    isGameOver = false;
    selectedSquare = null;
    legalMovesForSelected = [];
    lastMove = null;
    hintSquares = null;
    pendingPromotion = null;

    // Reset clocks
    whiteTime = timeLimit;
    blackTime = timeLimit;
    clearInterval(timerInterval);
    if (timeLimit > 0) {
      timerInterval = setInterval(updateClocks, 1000);
    }

    // Set flip based on player side in AI mode
    if (gameMode === 'ai') {
      isFlipped = (playerSide === 'b');
    }

    updatePlayerHeaders();
    renderBoard();
    updateUI();
    updateEval();

    // If AI is white, trigger first move
    if (gameMode === 'ai' && playerSide === 'b' && currentTurn === 'w') {
      setTimeout(makeAiMove, 500);
    }
  }

  // --- 6. Helper & Rule Functions ---
  function isWhitePiece(p) { return p && p === p.toUpperCase(); }
  function isBlackPiece(p) { return p && p === p.toLowerCase(); }
  function getPieceColor(p) {
    if (!p) return null;
    return isWhitePiece(p) ? 'w' : 'b';
  }

  function coordsToAlgebraic(r, c) {
    const file = String.fromCharCode('a'.charCodeAt(0) + c);
    const rank = 8 - r;
    return `${file}${rank}`;
  }

  function findKing(b, color) {
    const target = (color === 'w') ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] === target) return { r, c };
      }
    }
    return null;
  }

  function isSquareAttacked(b, targetR, targetC, byColor) {
    // Pawn attacks
    const pawnDir = (byColor === 'w') ? -1 : 1;
    const pawnPiece = (byColor === 'w') ? 'P' : 'p';
    const pR = targetR - pawnDir;
    if (pR >= 0 && pR < 8) {
      if (targetC - 1 >= 0 && b[pR][targetC - 1] === pawnPiece) return true;
      if (targetC + 1 < 8 && b[pR][targetC + 1] === pawnPiece) return true;
    }

    // Knight attacks
    const knightPiece = (byColor === 'w') ? 'N' : 'n';
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = targetR + dr, nc = targetC + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (b[nr][nc] === knightPiece) return true;
      }
    }

    // Bishop / Queen diagonals
    const bishopPiece = (byColor === 'w') ? 'B' : 'b';
    const queenPiece = (byColor === 'w') ? 'Q' : 'q';
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let step = 1;
      while (true) {
        const nr = targetR + dr * step, nc = targetC + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        const p = b[nr][nc];
        if (p) {
          if (p === bishopPiece || p === queenPiece) return true;
          break;
        }
        step++;
      }
    }

    // Rook / Queen orthogonals
    const rookPiece = (byColor === 'w') ? 'R' : 'r';
    const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of orthoDirs) {
      let step = 1;
      while (true) {
        const nr = targetR + dr * step, nc = targetC + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        const p = b[nr][nc];
        if (p) {
          if (p === rookPiece || p === queenPiece) return true;
          break;
        }
        step++;
      }
    }

    // King attacks
    const kingPiece = (byColor === 'w') ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = targetR + dr, nc = targetC + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (b[nr][nc] === kingPiece) return true;
        }
      }
    }

    return false;
  }

  function isKingInCheck(b, color) {
    const kPos = findKing(b, color);
    if (!kPos) return false;
    const opponent = (color === 'w') ? 'b' : 'w';
    return isSquareAttacked(b, kPos.r, kPos.c, opponent);
  }

  // Generate pseudo-legal moves (ignoring own check)
  function getPseudoMoves(b, r, c, ep, cast) {
    const piece = b[r][c];
    if (!piece) return [];
    const color = getPieceColor(piece);
    const opponent = (color === 'w') ? 'b' : 'w';
    const type = piece.toLowerCase();
    const moves = [];

    if (type === 'p') {
      const dir = (color === 'w') ? -1 : 1;
      const startRank = (color === 'w') ? 6 : 1;
      const promoRank = (color === 'w') ? 0 : 7;

      // 1 square forward
      const f1R = r + dir;
      if (f1R >= 0 && f1R < 8 && !b[f1R][c]) {
        if (f1R === promoRank) {
          ['q', 'r', 'b', 'n'].forEach(promo => {
            moves.push({ from: { r, c }, to: { r: f1R, c }, promo: (color === 'w' ? promo.toUpperCase() : promo) });
          });
        } else {
          moves.push({ from: { r, c }, to: { r: f1R, c } });
        }

        // 2 squares forward from start rank
        const f2R = r + dir * 2;
        if (r === startRank && !b[f2R][c]) {
          moves.push({ from: { r, c }, to: { r: f2R, c }, isDoublePawn: true });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const tc = c + dc;
        if (tc >= 0 && tc < 8 && f1R >= 0 && f1R < 8) {
          const target = b[f1R][tc];
          if (target && getPieceColor(target) === opponent) {
            if (f1R === promoRank) {
              ['q', 'r', 'b', 'n'].forEach(promo => {
                moves.push({ from: { r, c }, to: { r: f1R, c: tc }, promo: (color === 'w' ? promo.toUpperCase() : promo), capture: target });
              });
            } else {
              moves.push({ from: { r, c }, to: { r: f1R, c: tc }, capture: target });
            }
          } else if (ep && ep.r === f1R && ep.c === tc) {
            // En Passant
            moves.push({ from: { r, c }, to: { r: f1R, c: tc }, isEnPassant: true, capture: (color === 'w' ? 'p' : 'P') });
          }
        }
      }
    } else if (type === 'n') {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else if (getPieceColor(target) === opponent) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target });
          }
        }
      }
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const dirs = [];
      if (type === 'b' || type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (type === 'r' || type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const nr = r + dr * step, nc = c + dc * step;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          const target = b[nr][nc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc } });
          } else {
            if (getPieceColor(target) === opponent) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target });
            }
            break;
          }
          step++;
        }
      }
    } else if (type === 'k') {
      // 1 square steps
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = b[nr][nc];
            if (!target) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } else if (getPieceColor(target) === opponent) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: target });
            }
          }
        }
      }

      // Castling
      if (cast) {
        if (color === 'w' && r === 7 && c === 4) {
          // White Kingside
          if (cast.wK && !b[7][5] && !b[7][6] && b[7][7] === 'R') {
            if (!isSquareAttacked(b, 7, 4, 'b') && !isSquareAttacked(b, 7, 5, 'b') && !isSquareAttacked(b, 7, 6, 'b')) {
              moves.push({ from: { r, c }, to: { r: 7, c: 6 }, isCastle: 'K' });
            }
          }
          // White Queenside
          if (cast.wQ && !b[7][3] && !b[7][2] && !b[7][1] && b[7][0] === 'R') {
            if (!isSquareAttacked(b, 7, 4, 'b') && !isSquareAttacked(b, 7, 3, 'b') && !isSquareAttacked(b, 7, 2, 'b')) {
              moves.push({ from: { r, c }, to: { r: 7, c: 2 }, isCastle: 'Q' });
            }
          }
        } else if (color === 'b' && r === 0 && c === 4) {
          // Black Kingside
          if (cast.bK && !b[0][5] && !b[0][6] && b[0][7] === 'r') {
            if (!isSquareAttacked(b, 0, 4, 'w') && !isSquareAttacked(b, 0, 5, 'w') && !isSquareAttacked(b, 0, 6, 'w')) {
              moves.push({ from: { r, c }, to: { r: 0, c: 6 }, isCastle: 'K' });
            }
          }
          // Black Queenside
          if (cast.bQ && !b[0][3] && !b[0][2] && !b[0][1] && b[0][0] === 'r') {
            if (!isSquareAttacked(b, 0, 4, 'w') && !isSquareAttacked(b, 0, 3, 'w') && !isSquareAttacked(b, 0, 2, 'w')) {
              moves.push({ from: { r, c }, to: { r: 0, c: 2 }, isCastle: 'Q' });
            }
          }
        }
      }
    }

    return moves;
  }

  // Clone board array
  function cloneBoard(b) {
    return b.map(row => [...row]);
  }

  // Apply move on board clone (without full side-effects)
  function applyMoveOnBoard(b, m) {
    const nextB = cloneBoard(b);
    const piece = nextB[m.from.r][m.from.c];
    nextB[m.from.r][m.from.c] = null;

    if (m.isEnPassant) {
      const capR = m.from.r; // captured pawn is on the same rank as from
      nextB[capR][m.to.c] = null;
    }

    if (m.isCastle) {
      const r = m.to.r;
      if (m.isCastle === 'K') {
        nextB[r][5] = nextB[r][7];
        nextB[r][7] = null;
      } else {
        nextB[r][3] = nextB[r][0];
        nextB[r][0] = null;
      }
    }

    nextB[m.to.r][m.to.c] = m.promo || piece;
    return nextB;
  }

  // Get strictly legal moves for a piece
  function getLegalMoves(b, r, c, ep, cast) {
    const piece = b[r][c];
    if (!piece) return [];
    const color = getPieceColor(piece);
    const pseudo = getPseudoMoves(b, r, c, ep, cast);

    return pseudo.filter(m => {
      const simulatedBoard = applyMoveOnBoard(b, m);
      return !isKingInCheck(simulatedBoard, color);
    });
  }

  // Get all legal moves for current player
  function getAllLegalMoves(b, color, ep, cast) {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] && getPieceColor(b[r][c]) === color) {
          const pieceMoves = getLegalMoves(b, r, c, ep, cast);
          all.push(...pieceMoves);
        }
      }
    }
    return all;
  }

  // --- 7. Board & UI Rendering ---
  function renderBoard() {
    chessboardEl.innerHTML = '';
    const inCheck = isKingInCheck(board, currentTurn);
    const checkKingPos = inCheck ? findKing(board, currentTurn) : null;

    for (let displayR = 0; displayR < 8; displayR++) {
      for (let displayC = 0; displayC < 8; displayC++) {
        const actualR = isFlipped ? (7 - displayR) : displayR;
        const actualC = isFlipped ? (7 - displayC) : displayC;

        const isLight = (actualR + actualC) % 2 === 0;
        const sq = document.createElement('div');
        sq.className = `square ${isLight ? 'light' : 'dark'}`;
        sq.dataset.r = actualR;
        sq.dataset.c = actualC;

        // Rank and File Coordinate Labels
        if (displayC === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = 8 - actualR;
          sq.appendChild(rankLabel);
        }
        if (displayR === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = String.fromCharCode('a'.charCodeAt(0) + actualC);
          sq.appendChild(fileLabel);
        }

        // Selected square highlight
        if (selectedSquare && selectedSquare.r === actualR && selectedSquare.c === actualC) {
          sq.classList.add('selected');
        }

        // Last move highlight
        if (lastMove) {
          if ((lastMove.from.r === actualR && lastMove.from.c === actualC) ||
              (lastMove.to.r === actualR && lastMove.to.c === actualC)) {
            sq.classList.add('last-move');
          }
        }

        // Hint move highlight
        if (hintSquares) {
          if ((hintSquares.from.r === actualR && hintSquares.from.c === actualC) ||
              (hintSquares.to.r === actualR && hintSquares.to.c === actualC)) {
            sq.classList.add('hint-move');
          }
        }

        // Check highlight
        if (checkKingPos && checkKingPos.r === actualR && checkKingPos.c === actualC) {
          sq.classList.add('in-check');
        }

        // Legal move indicator dots
        const legalMove = legalMovesForSelected.find(m => m.to.r === actualR && m.to.c === actualC);
        if (legalMove) {
          if (board[actualR][actualC] || legalMove.isEnPassant) {
            sq.classList.add('legal-capture');
          } else {
            sq.classList.add('legal-move');
          }
        }

        // Piece rendering
        const piece = board[actualR][actualC];
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          pieceEl.innerHTML = SVG_PIECES[piece] || '';
          sq.appendChild(pieceEl);
        }

        sq.addEventListener('click', () => onSquareClick(actualR, actualC));
        chessboardEl.appendChild(sq);
      }
    }
  }

  // --- 8. User Interaction Handler ---
  function onSquareClick(r, c) {
    if (isGameOver) return;

    // In AI mode, prevent human from moving during AI's turn
    if (gameMode === 'ai' && currentTurn !== playerSide) {
      return;
    }

    const clickedPiece = board[r][c];
    const clickedColor = getPieceColor(clickedPiece);

    // If an own piece was clicked and no pending move, select it
    if (clickedPiece && clickedColor === currentTurn) {
      selectedSquare = { r, c };
      legalMovesForSelected = getLegalMoves(board, r, c, enPassant, castling);
      hintSquares = null;
      renderBoard();
      return;
    }

    // If a square is already selected, check if this is a legal target
    if (selectedSquare) {
      const move = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
      if (move) {
        // Check for Pawn Promotion
        const movingPiece = board[selectedSquare.r][selectedSquare.c];
        const isPawn = movingPiece && movingPiece.toLowerCase() === 'p';
        const promoRank = (currentTurn === 'w') ? 0 : 7;

        if (isPawn && r === promoRank && !move.promo) {
          pendingPromotion = { from: selectedSquare, to: { r, c }, legalMoves: legalMovesForSelected };
          openPromotionModal(currentTurn);
          return;
        }

        executeMove(move);
        selectedSquare = null;
        legalMovesForSelected = [];
        return;
      }

      // Deselect if clicked empty or invalid
      selectedSquare = null;
      legalMovesForSelected = [];
      renderBoard();
    }
  }

  // Open Promotion Modal
  function openPromotionModal(color) {
    const isW = (color === 'w');
    document.getElementById('promo-q').innerHTML = SVG_PIECES[isW ? 'Q' : 'q'];
    document.getElementById('promo-r').innerHTML = SVG_PIECES[isW ? 'R' : 'r'];
    document.getElementById('promo-b').innerHTML = SVG_PIECES[isW ? 'B' : 'b'];
    document.getElementById('promo-n').innerHTML = SVG_PIECES[isW ? 'N' : 'n'];
    promoModalEl.classList.remove('hidden');
  }

  // Promotion Button Selection
  promoPiecesEl.addEventListener('click', e => {
    const btn = e.target.closest('.promo-btn');
    if (!btn || !pendingPromotion) return;
    const choice = btn.dataset.piece; // Q, R, B, N
    const promoPiece = (currentTurn === 'w') ? choice.toUpperCase() : choice.toLowerCase();

    const move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promo: promoPiece
    };

    promoModalEl.classList.add('hidden');
    pendingPromotion = null;
    executeMove(move);
    selectedSquare = null;
    legalMovesForSelected = [];
  });

  // --- 9. Move Execution & Side Effects ---
  function executeMove(m) {
    const piece = board[m.from.r][m.from.c];
    const isCapture = !!m.capture || !!board[m.to.r][m.to.c] || m.isEnPassant;
    const capturedPiece = m.isEnPassant ? (currentTurn === 'w' ? 'p' : 'P') : board[m.to.r][m.to.c];

    // Notation building
    const pieceChar = piece.toUpperCase() === 'P' ? '' : piece.toUpperCase();
    const fromAlg = coordsToAlgebraic(m.from.r, m.from.c);
    const toAlg = coordsToAlgebraic(m.to.r, m.to.c);
    let notation = '';

    if (m.isCastle) {
      notation = (m.isCastle === 'K') ? 'O-O' : 'O-O-O';
    } else {
      const capSymbol = isCapture ? (pieceChar === '' ? `${fromAlg[0]}x` : 'x') : '';
      const promoSuffix = m.promo ? `=${m.promo.toUpperCase()}` : '';
      notation = `${pieceChar}${capSymbol}${toAlg}${promoSuffix}`;
    }

    // Save previous state for undo
    const stateRecord = {
      board: cloneBoard(board),
      turn: currentTurn,
      castling: { ...castling },
      enPassant: enPassant ? { ...enPassant } : null,
      halfMoveClock,
      fullMoveNumber,
      lastMove: lastMove ? { ...lastMove } : null,
      capturedPiece,
      notation
    };
    moveHistory.push(stateRecord);

    // Apply move on the board
    board = applyMoveOnBoard(board, m);
    lastMove = { from: m.from, to: m.to };

    // Update castling rights
    if (piece === 'K') { castling.wK = false; castling.wQ = false; }
    if (piece === 'k') { castling.bK = false; castling.bQ = false; }
    if (piece === 'R') {
      if (m.from.r === 7 && m.from.c === 7) castling.wK = false;
      if (m.from.r === 7 && m.from.c === 0) castling.wQ = false;
    }
    if (piece === 'r') {
      if (m.from.r === 0 && m.from.c === 7) castling.bK = false;
      if (m.from.r === 0 && m.from.c === 0) castling.bQ = false;
    }
    // If a rook is captured, revoke castling
    if (capturedPiece === 'R') {
      if (m.to.r === 7 && m.to.c === 7) castling.wK = false;
      if (m.to.r === 7 && m.to.c === 0) castling.wQ = false;
    }
    if (capturedPiece === 'r') {
      if (m.to.r === 0 && m.to.c === 7) castling.bK = false;
      if (m.to.r === 0 && m.to.c === 0) castling.bQ = false;
    }

    // Update En Passant target
    if (m.isDoublePawn) {
      enPassant = { r: (m.from.r + m.to.r) / 2, c: m.from.c };
    } else {
      enPassant = null;
    }

    // Sound effect
    if (isCapture) playSound('capture');
    else playSound('move');

    // Toggle turn
    currentTurn = (currentTurn === 'w') ? 'b' : 'w';
    if (currentTurn === 'w') fullMoveNumber++;

    // Check & End Game Condition
    const allNextMoves = getAllLegalMoves(board, currentTurn, enPassant, castling);
    const inCheck = isKingInCheck(board, currentTurn);

    if (inCheck) {
      notation += '+';
      playSound('check');
    }

    stateRecord.notation = notation; // Update with check symbol

    if (allNextMoves.length === 0) {
      isGameOver = true;
      clearInterval(timerInterval);
      if (inCheck) {
        stateRecord.notation = stateRecord.notation.replace('+', '#');
        const winner = (currentTurn === 'w') ? '⚫ 흑' : '⚪ 백';
        showGameOver(winner, '체크메이트! 승리');
        playSound('win');
        if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        showGameOver('무승부', '스테일메이트 (Stalemate)');
      }
    }

    renderBoard();
    updateUI();
    updateEval();

    // Trigger AI if applicable
    if (!isGameOver && gameMode === 'ai' && currentTurn !== playerSide) {
      const delay = aiDiff === 'easy' ? 300 : aiDiff === 'normal' ? 500 : 700;
      setTimeout(makeAiMove, delay);
    }
  }

  // --- 10. AI Engine (Minimax with Alpha-Beta Pruning) ---
  function evaluatePosition(b) {
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (!p) continue;

        const val = PIECE_VALUES[p.toLowerCase()] || 0;
        let posVal = 0;
        const type = p.toLowerCase();
        const pTableR = (p === p.toUpperCase()) ? r : (7 - r);

        if (type === 'p') posVal = PST_PAWN[pTableR][c];
        else if (type === 'n') posVal = PST_KNIGHT[pTableR][c];
        else if (type === 'b') posVal = PST_BISHOP[pTableR][c];
        else if (type === 'r') posVal = PST_ROOK[pTableR][c];
        else if (type === 'q') posVal = PST_QUEEN[pTableR][c];
        else if (type === 'k') posVal = PST_KING_MID[pTableR][c];

        if (p === p.toUpperCase()) {
          score += (val + posVal);
        } else {
          score -= (val + posVal);
        }
      }
    }

    return score; // Positive = White leads, Negative = Black leads
  }

  function minimax(b, depth, alpha, beta, isWhite, ep, cast) {
    if (depth === 0) {
      return { score: evaluatePosition(b) };
    }

    const color = isWhite ? 'w' : 'b';
    const moves = getAllLegalMoves(b, color, ep, cast);

    if (moves.length === 0) {
      if (isKingInCheck(b, color)) {
        return { score: isWhite ? -50000 : 50000 };
      }
      return { score: 0 }; // Stalemate
    }

    // Move ordering: sort captures first for alpha-beta efficiency
    moves.sort((x, y) => (y.capture ? 1 : 0) - (x.capture ? 1 : 0));

    let bestMove = moves[0];

    if (isWhite) {
      let maxEval = -Infinity;
      for (const m of moves) {
        const nextB = applyMoveOnBoard(b, m);
        const nextEp = m.isDoublePawn ? { r: (m.from.r + m.to.r) / 2, c: m.from.c } : null;
        const evalObj = minimax(nextB, depth - 1, alpha, beta, false, nextEp, cast);
        if (evalObj.score > maxEval) {
          maxEval = evalObj.score;
          bestMove = m;
        }
        alpha = Math.max(alpha, evalObj.score);
        if (beta <= alpha) break;
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        const nextB = applyMoveOnBoard(b, m);
        const nextEp = m.isDoublePawn ? { r: (m.from.r + m.to.r) / 2, c: m.from.c } : null;
        const evalObj = minimax(nextB, depth - 1, alpha, beta, true, nextEp, cast);
        if (evalObj.score < minEval) {
          minEval = evalObj.score;
          bestMove = m;
        }
        beta = Math.min(beta, evalObj.score);
        if (beta <= alpha) break;
      }
      return { score: minEval, move: bestMove };
    }
  }

  function makeAiMove() {
    if (isGameOver || currentTurn === playerSide) return;

    turnTextEl.textContent = '🤖 AI가 최선의 수를 생각 중입니다...';

    const isWhite = (currentTurn === 'w');
    const legalMoves = getAllLegalMoves(board, currentTurn, enPassant, castling);
    if (legalMoves.length === 0) return;

    let selectedMove = null;

    if (aiDiff === 'easy') {
      // 50% random, 50% depth 1
      if (Math.random() < 0.4) {
        selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        const result = minimax(board, 1, -Infinity, Infinity, isWhite, enPassant, castling);
        selectedMove = result.move || legalMoves[0];
      }
    } else if (aiDiff === 'normal') {
      const result = minimax(board, 2, -Infinity, Infinity, isWhite, enPassant, castling);
      selectedMove = result.move || legalMoves[0];
    } else { // Hard (depth 3)
      const result = minimax(board, 3, -Infinity, Infinity, isWhite, enPassant, castling);
      selectedMove = result.move || legalMoves[0];
    }

    if (selectedMove) {
      executeMove(selectedMove);
    }
  }

  // --- 11. Clocks & Timers ---
  function updateClocks() {
    if (isGameOver || timeLimit <= 0) return;

    if (currentTurn === 'w') {
      whiteTime--;
      if (whiteTime <= 0) {
        whiteTime = 0;
        isGameOver = true;
        clearInterval(timerInterval);
        showGameOver('⚫ 흑', '백의 시간 초과 패배!');
      }
    } else {
      blackTime--;
      if (blackTime <= 0) {
        blackTime = 0;
        isGameOver = true;
        clearInterval(timerInterval);
        showGameOver('⚪ 백', '흑의 시간 초과 패배!');
      }
    }

    renderClockDisplay();
  }

  function formatTime(sec) {
    if (timeLimit <= 0) return '∞';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function renderClockDisplay() {
    const topIsWhite = isFlipped ? true : false;
    const topTime = topIsWhite ? whiteTime : blackTime;
    const bottomTime = topIsWhite ? blackTime : whiteTime;

    topClockEl.textContent = formatTime(topTime);
    bottomClockEl.textContent = formatTime(bottomTime);

    if (topTime <= 30 && timeLimit > 0) topClockEl.classList.add('low-time');
    else topClockEl.classList.remove('low-time');

    if (bottomTime <= 30 && timeLimit > 0) bottomClockEl.classList.add('low-time');
    else bottomClockEl.classList.remove('low-time');
  }

  // --- 12. UI & Evaluation Updates ---
  function updateUI() {
    // Turn Dot & Text
    turnDotEl.className = `turn-dot ${currentTurn === 'w' ? 'white' : 'black'}`;
    const turnName = (currentTurn === 'w') ? '⚪ 백' : '⚫ 흑';
    const isPlayer = (gameMode === '2p' || currentTurn === playerSide);
    turnTextEl.textContent = `${turnName}의 차례입니다 ${isPlayer ? '(당신)' : '(AI)'}`;

    // Check Alert
    if (isKingInCheck(board, currentTurn) && !isGameOver) {
      checkAlertEl.classList.remove('hidden');
    } else {
      checkAlertEl.classList.add('hidden');
    }

    // Move Count
    moveCountBadgeEl.textContent = `${moveHistory.length}수`;

    // Move History Notation List
    renderHistoryList();

    // Captured Pieces & Material Differential
    updateCapturedPieces();

    // Clocks
    renderClockDisplay();
  }

  function renderHistoryList() {
    historyListEl.innerHTML = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1];

      const row = document.createElement('div');
      row.className = 'history-row';

      const numEl = document.createElement('span');
      numEl.className = 'history-num';
      numEl.textContent = `${moveNum}.`;

      const wEl = document.createElement('span');
      wEl.className = 'history-move';
      wEl.textContent = whiteMove ? whiteMove.notation : '';

      const bEl = document.createElement('span');
      bEl.className = 'history-move';
      bEl.textContent = blackMove ? blackMove.notation : '';

      row.appendChild(numEl);
      row.appendChild(wEl);
      row.appendChild(bEl);
      historyListEl.appendChild(row);
    }
    historyListEl.scrollTop = historyListEl.scrollHeight;
  }

  function updateCapturedPieces() {
    const counts = { P: 8, N: 2, B: 2, R: 2, Q: 1, p: 8, n: 2, b: 2, r: 2, q: 1 };
    let whiteMat = 0, blackMat = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && counts[p] !== undefined) {
          counts[p]--;
          if (p === p.toUpperCase()) whiteMat += PIECE_VALUES[p.toLowerCase()];
          else blackMat += PIECE_VALUES[p];
        }
      }
    }

    // Build captured icons
    function buildCapturedHtml(list, diff) {
      let html = '';
      for (const [piece, count] of Object.entries(list)) {
        if (count > 0) {
          html += `<span class="captured-piece">${piece}×${count}</span> `;
        }
      }
      if (diff > 0) {
        html += `<span class="captured-diff">+${diff}</span>`;
      }
      return html;
    }

    const whiteDiff = Math.max(0, Math.round((whiteMat - blackMat) / 100));
    const blackDiff = Math.max(0, Math.round((blackMat - whiteMat) / 100));

    const whiteLost = { '♟': counts.P, '♞': counts.N, '♝': counts.B, '♜': counts.R, '♛': counts.Q };
    const blackLost = { '♙': counts.p, '♘': counts.n, '♗': counts.b, '♖': counts.r, '♕': counts.q };

    const topIsWhite = isFlipped;
    topCapturedEl.innerHTML = topIsWhite ? buildCapturedHtml(whiteLost, whiteDiff) : buildCapturedHtml(blackLost, blackDiff);
    bottomCapturedEl.innerHTML = topIsWhite ? buildCapturedHtml(blackLost, blackDiff) : buildCapturedHtml(whiteLost, whiteDiff);
  }

  function updateEval() {
    const rawScore = evaluatePosition(board); // Centipawns
    const scoreInPawns = (rawScore / 100).toFixed(1);
    evalScoreTextEl.textContent = (rawScore > 0 ? `+${scoreInPawns}` : `${scoreInPawns}`);

    // Sigmoid function to map score to win percentage (0 ~ 100%)
    const winRateWhite = Math.round(100 / (1 + Math.exp(-rawScore / 400)));
    const winRateBlack = 100 - winRateWhite;

    evalBarWhiteEl.style.height = `${winRateWhite}%`;
    evalBarBlackEl.style.height = `${winRateBlack}%`;
    evalFillBarEl.style.width = `${winRateWhite}%`;

    evalValueLabelEl.textContent = `${winRateWhite}%`;
    evalWhitePctEl.textContent = `⚪ 백: ${winRateWhite}%`;
    evalBlackPctEl.textContent = `⚫ 흑: ${winRateBlack}%`;
  }

  function updatePlayerHeaders() {
    if (gameMode === '2p') {
      topAvatarEl.textContent = '👤';
      topNameEl.textContent = isFlipped ? '플레이어 1 (백)' : '플레이어 2 (흑)';
      topColorTagEl.textContent = isFlipped ? '⚪ 백' : '⚫ 흑';

      bottomAvatarEl.textContent = '👤';
      bottomNameEl.textContent = isFlipped ? '플레이어 2 (흑)' : '플레이어 1 (백)';
      bottomColorTagEl.textContent = isFlipped ? '⚫ 흑' : '⚪ 백';
    } else {
      const diffLabel = aiDiff === 'easy' ? '쉬움' : aiDiff === 'normal' ? '중간' : '어려움';
      if (playerSide === 'w') {
        topAvatarEl.textContent = '🤖';
        topNameEl.textContent = `알파쌈뽕 (AI ${diffLabel})`;
        topColorTagEl.textContent = '⚫ 흑';

        bottomAvatarEl.textContent = '😎';
        bottomNameEl.textContent = '선우 (플레이어)';
        bottomColorTagEl.textContent = '⚪ 백';
      } else {
        topAvatarEl.textContent = '😎';
        topNameEl.textContent = '선우 (플레이어)';
        topColorTagEl.textContent = '⚫ 흑';

        bottomAvatarEl.textContent = '🤖';
        bottomNameEl.textContent = `알파쌈뽕 (AI ${diffLabel})`;
        bottomColorTagEl.textContent = '⚪ 백';
      }
    }
  }

  function showGameOver(winner, reason) {
    gameOverTitleEl.textContent = `${winner}의 승리!`;
    gameOverDescEl.textContent = reason;
    statTotalMovesEl.textContent = `${moveHistory.length}`;
    const elapsedSec = (timeLimit > 0) ? (timeLimit * 2 - (whiteTime + blackTime)) : 0;
    statTimeEl.textContent = `${Math.floor(elapsedSec / 60)}분 ${elapsedSec % 60}초`;
    gameOverModalEl.classList.remove('hidden');
  }

  // --- 13. Event Listeners for Controls & Settings ---

  // Game Mode Toggle (AI vs 2P)
  document.querySelectorAll('#mode-ai, #mode-2p').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-ai, #mode-2p').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameMode = btn.dataset.mode;
      const diffSetting = document.getElementById('setting-diff');
      const sideSetting = document.getElementById('setting-side');
      if (gameMode === '2p') {
        diffSetting.style.opacity = '0.4';
        sideSetting.style.opacity = '0.4';
      } else {
        diffSetting.style.opacity = '1';
        sideSetting.style.opacity = '1';
      }
      resetGame();
    });
  });

  // AI Difficulty
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      aiDiff = btn.dataset.diff;
      updatePlayerHeaders();
    });
  });

  // Side Selection (White vs Black)
  document.querySelectorAll('.side-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playerSide = btn.dataset.side;
      resetGame();
    });
  });

  // Time Limit Pills
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timeLimit = parseInt(btn.dataset.time, 10);
      resetGame();
    });
  });

  // Theme Picker
  document.querySelectorAll('.theme-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.body.className = btn.dataset.theme;
    });
  });

  // Action: Undo Move
  document.getElementById('btn-undo').addEventListener('click', () => {
    if (moveHistory.length === 0 || isGameOver) return;
    const stepsToUndo = (gameMode === 'ai') ? 2 : 1;
    for (let i = 0; i < stepsToUndo; i++) {
      if (moveHistory.length === 0) break;
      const prev = moveHistory.pop();
      board = prev.board;
      currentTurn = prev.turn;
      castling = prev.castling;
      enPassant = prev.enPassant;
      halfMoveClock = prev.halfMoveClock;
      fullMoveNumber = prev.fullMoveNumber;
      lastMove = prev.lastMove;
    }
    selectedSquare = null;
    legalMovesForSelected = [];
    hintSquares = null;
    renderBoard();
    updateUI();
    updateEval();
  });

  // Action: AI Hint
  document.getElementById('btn-hint').addEventListener('click', () => {
    if (isGameOver) return;
    const isWhite = (currentTurn === 'w');
    const result = minimax(board, 2, -Infinity, Infinity, isWhite, enPassant, castling);
    if (result.move) {
      hintSquares = { from: result.move.from, to: result.move.to };
      renderBoard();
      setTimeout(() => {
        hintSquares = null;
        renderBoard();
      }, 2500);
    }
  });

  // Action: Board Flip
  document.getElementById('btn-flip').addEventListener('click', () => {
    isFlipped = !isFlipped;
    renderBoard();
    updatePlayerHeaders();
    updateCapturedPieces();
    renderClockDisplay();
  });

  // Action: Restart Buttons
  document.getElementById('btn-restart').addEventListener('click', resetGame);
  document.getElementById('btn-modal-restart').addEventListener('click', () => {
    gameOverModalEl.classList.add('hidden');
    resetGame();
  });
  document.getElementById('btn-modal-review').addEventListener('click', () => {
    gameOverModalEl.classList.add('hidden');
  });

  // Initialize Game on Load
  resetGame();
})();
