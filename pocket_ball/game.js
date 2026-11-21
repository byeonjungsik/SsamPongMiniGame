/**
 * 🎱 쌈뽕 포켓볼 (SsamPong Pocket Ball) - 2D Physics Game Engine
 * Features:
 * - Accurate 2D Rigid-Body Elastic Collision & Cushion Physics
 * - 6 Pockets with Smooth Suction & Dropping Animation
 * - Triangle 15-Ball Rack Break & Ball Classification (Solids / Stripes / 8-Ball)
 * - Trajectory Guide Lines with Ghost Ball & Deflection Vectors
 * - 3 Game Modes: 🎯 1-Player Solo, 👥 2-Player Local, 🤖 AI Opponent
 * - Web Audio API Billiards Sound Synthesizer & Canvas Confetti Celebration
 * - Multi-Theme Table Felt (Green, Blue, Neon)
 */

(function () {
  'use strict';

  // --- 1. Audio Synthesizer (Web Audio API) ---
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

  function playSound(type, param = 1) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'strike') {
        // Cue hitting cue ball
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        const vol = Math.min(0.4, 0.1 + param * 0.3);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'clack') {
        // Ball-to-ball impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const baseFreq = 1600 + Math.random() * 400;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        const vol = Math.min(0.35, 0.05 + param * 0.25);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'cushion') {
        // Ball hitting bumper cushion
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'pocket') {
        // Ball potted into pocket
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'foul') {
        // Foul buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === 'win') {
        // Victory fanfare
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.3, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.38);
        });
      }
    } catch (e) {}
  }

  // --- 2. Table & Physics Metrics ---
  const CANVAS_WIDTH = 1020;
  const CANVAS_HEIGHT = 560;

  // Playing field bounds (felt inside the cushions)
  const TABLE_LEFT = 64;
  const TABLE_RIGHT = 956;
  const TABLE_TOP = 64;
  const TABLE_BOTTOM = 496;
  const TABLE_WIDTH = TABLE_RIGHT - TABLE_LEFT; // 892
  const TABLE_HEIGHT = TABLE_BOTTOM - TABLE_TOP; // 432
  const TABLE_CENTER_X = (TABLE_LEFT + TABLE_RIGHT) / 2;
  const TABLE_CENTER_Y = (TABLE_TOP + TABLE_BOTTOM) / 2;

  const BALL_RADIUS = 13.5;
  const FRICTION = 0.988;
  const MIN_VELOCITY = 0.05;
  const RESTITUTION_BALL = 0.94;
  const RESTITUTION_CUSHION = 0.82;

  // 6 Pockets definition
  const POCKETS = [
    { x: TABLE_LEFT + 6, y: TABLE_TOP + 6, r: 30, name: 'TL' },
    { x: TABLE_CENTER_X, y: TABLE_TOP - 2, r: 25, name: 'TM' },
    { x: TABLE_RIGHT - 6, y: TABLE_TOP + 6, r: 30, name: 'TR' },
    { x: TABLE_LEFT + 6, y: TABLE_BOTTOM - 6, r: 30, name: 'BL' },
    { x: TABLE_CENTER_X, y: TABLE_BOTTOM + 2, r: 25, name: 'BM' },
    { x: TABLE_RIGHT - 6, y: TABLE_BOTTOM - 6, r: 30, name: 'BR' }
  ];

  // Colors & Ball Metadata
  const BALL_CONFIGS = [
    { num: 0, type: 'cue', color: '#ffffff', textColor: '#000' }, // White Cue Ball
    { num: 1, type: 'solid', color: '#eab308', textColor: '#000' }, // 1 Yellow
    { num: 2, type: 'solid', color: '#2563eb', textColor: '#fff' }, // 2 Blue
    { num: 3, type: 'solid', color: '#dc2626', textColor: '#fff' }, // 3 Red
    { num: 4, type: 'solid', color: '#7c3aed', textColor: '#fff' }, // 4 Purple
    { num: 5, type: 'solid', color: '#ea580c', textColor: '#fff' }, // 5 Orange
    { num: 6, type: 'solid', color: '#16a34a', textColor: '#fff' }, // 6 Green
    { num: 7, type: 'solid', color: '#881337', textColor: '#fff' }, // 7 Maroon
    { num: 8, type: 'eight', color: '#111827', textColor: '#fff' }, // 8 Black
    { num: 9, type: 'stripe', color: '#eab308', textColor: '#000' }, // 9 Yellow Stripe
    { num: 10, type: 'stripe', color: '#2563eb', textColor: '#fff' }, // 10 Blue Stripe
    { num: 11, type: 'stripe', color: '#dc2626', textColor: '#fff' }, // 11 Red Stripe
    { num: 12, type: 'stripe', color: '#7c3aed', textColor: '#fff' }, // 12 Purple Stripe
    { num: 13, type: 'stripe', color: '#ea580c', textColor: '#fff' }, // 13 Orange Stripe
    { num: 14, type: 'stripe', color: '#16a34a', textColor: '#fff' }, // 14 Green Stripe
    { num: 15, type: 'stripe', color: '#881337', textColor: '#fff' }  // 15 Maroon Stripe
  ];

  // --- 3. Game State ---
  let balls = [];
  let cueBall = null;
  let gameMode = 'solo'; // 'solo', '2p', 'ai'
  let currentPlayer = 1; // 1 or 2 (in 2P mode)
  let player1Group = null; // 'solid' or 'stripe'
  let player2Group = null;
  let totalStrokes = 0;
  let pocketedBalls = [];
  let isAiming = false;
  let cueAngle = 0; // In radians
  let shotPower = 45; // 5 to 100
  let isDraggingCue = false;
  let dragStartPos = null;
  let showGuide = true;
  let foulMessageTimeout = null;

  // DOM Elements
  const canvas = document.getElementById('poolCanvas');
  const ctx = canvas.getContext('2d');
  const turnDotEl = document.getElementById('turn-dot');
  const turnTitleEl = document.getElementById('turn-title');
  const ballGroupTagEl = document.getElementById('ball-group-tag');
  const strokeCountEl = document.getElementById('stroke-count');
  const pocketedTrayEl = document.getElementById('pocketed-tray');
  const foulAlertEl = document.getElementById('foul-alert');

  const powerSlider = document.getElementById('power-slider');
  const powerValText = document.getElementById('power-val');
  const btnStrike = document.getElementById('btn-strike');
  const btnGuideToggle = document.getElementById('btn-guide-toggle');
  const guideIcon = document.getElementById('guide-icon');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnRerack = document.getElementById('btn-rerack');

  const resultModalEl = document.getElementById('result-modal');
  const resultTitleEl = document.getElementById('result-title');
  const resultDescEl = document.getElementById('result-desc');
  const statModeEl = document.getElementById('stat-mode');
  const statStrokesEl = document.getElementById('stat-strokes');
  const statPocketedEl = document.getElementById('stat-pocketed');
  const btnModalRestart = document.getElementById('btn-modal-restart');
  const btnModalReview = document.getElementById('btn-modal-review');

  // --- 4. Ball Class ---
  class Ball {
    constructor(x, y, cfg) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.r = BALL_RADIUS;
      this.num = cfg.num;
      this.type = cfg.type;
      this.color = cfg.color;
      this.textColor = cfg.textColor;
      this.isPocketed = false;
      this.scale = 1.0;
      this.pottingAnimation = false;
      this.potTarget = null;
    }

    update() {
      if (this.isPocketed) return;

      if (this.pottingAnimation) {
        // Sucking into pocket
        const dx = this.potTarget.x - this.x;
        const dy = this.potTarget.y - this.y;
        this.x += dx * 0.15;
        this.y += dy * 0.15;
        this.scale *= 0.88;
        if (this.scale < 0.15) {
          this.pottingAnimation = false;
          this.isPocketed = true;
          this.scale = 0;
          onBallPotted(this);
        }
        return;
      }

      // Movement
      this.x += this.vx;
      this.y += this.vy;

      // Friction
      this.vx *= FRICTION;
      this.vy *= FRICTION;

      if (Math.hypot(this.vx, this.vy) < MIN_VELOCITY) {
        this.vx = 0;
        this.vy = 0;
      }

      // Check pockets
      for (const pocket of POCKETS) {
        const dist = Math.hypot(pocket.x - this.x, pocket.y - this.y);
        if (dist < pocket.r) {
          this.pottingAnimation = true;
          this.potTarget = pocket;
          this.vx *= 0.3;
          this.vy *= 0.3;
          playSound('pocket');
          break;
        }
      }

      if (this.pottingAnimation) return;

      // Check cushions
      this.handleCushions();
    }

    handleCushions() {
      // Cushions with chamfered pocket gaps
      const minX = TABLE_LEFT + this.r;
      const maxX = TABLE_RIGHT - this.r;
      const minY = TABLE_TOP + this.r;
      const maxY = TABLE_BOTTOM - this.r;

      // Left cushion
      if (this.x < minX && this.y > TABLE_TOP + 32 && this.y < TABLE_BOTTOM - 32) {
        this.x = minX;
        this.vx = -this.vx * RESTITUTION_CUSHION;
        playSound('cushion', Math.abs(this.vx));
      }
      // Right cushion
      if (this.x > maxX && this.y > TABLE_TOP + 32 && this.y < TABLE_BOTTOM - 32) {
        this.x = maxX;
        this.vx = -this.vx * RESTITUTION_CUSHION;
        playSound('cushion', Math.abs(this.vx));
      }
      // Top Left cushion
      if (this.y < minY && this.x > TABLE_LEFT + 32 && this.x < TABLE_CENTER_X - 22) {
        this.y = minY;
        this.vy = -this.vy * RESTITUTION_CUSHION;
        playSound('cushion', Math.abs(this.vy));
      }
      // Top Right cushion
      if (this.y < minY && this.x > TABLE_CENTER_X + 22 && this.x < TABLE_RIGHT - 32) {
        this.y = minY;
        this.vy = -this.vy * RESTITUTION_CUSHION;
        playSound('cushion', Math.abs(this.vy));
      }
      // Bottom Left cushion
      if (this.y > maxY && this.x > TABLE_LEFT + 32 && this.x < TABLE_CENTER_X - 22) {
        this.y = maxY;
        this.vy = -this.vy * RESTITUTION_CUSHION;
        playSound('cushion', Math.abs(this.vy));
      }
      // Bottom Right cushion
      if (this.y > maxY && this.x > TABLE_CENTER_X + 22 && this.x < TABLE_RIGHT - 32) {
        this.y = maxY;
        this.vy = -this.vy * RESTITUTION_CUSHION;
        playSound('cushion', Math.abs(this.vy));
      }
    }

    draw(renderCtx) {
      if (this.isPocketed && !this.pottingAnimation) return;

      const currentR = this.r * this.scale;
      renderCtx.save();
      renderCtx.translate(this.x, this.y);

      // Ball Shadow
      renderCtx.beginPath();
      renderCtx.arc(2, 3, currentR, 0, Math.PI * 2);
      renderCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      renderCtx.fill();

      // Ball Base Circle
      renderCtx.beginPath();
      renderCtx.arc(0, 0, currentR, 0, Math.PI * 2);

      if (this.type === 'cue') {
        renderCtx.fillStyle = '#f8fafc';
        renderCtx.fill();
        // Red cue dot
        renderCtx.beginPath();
        renderCtx.arc(0, 0, currentR * 0.18, 0, Math.PI * 2);
        renderCtx.fillStyle = '#ef4444';
        renderCtx.fill();
      } else if (this.type === 'solid' || this.type === 'eight') {
        renderCtx.fillStyle = this.color;
        renderCtx.fill();
        // Number circle
        this.drawNumberCircle(renderCtx, currentR);
      } else if (this.type === 'stripe') {
        // White ball with wide colored stripe
        renderCtx.fillStyle = '#ffffff';
        renderCtx.fill();

        renderCtx.save();
        renderCtx.clip();
        renderCtx.beginPath();
        renderCtx.rect(-currentR, -currentR * 0.55, currentR * 2, currentR * 1.1);
        renderCtx.fillStyle = this.color;
        renderCtx.fill();
        renderCtx.restore();

        this.drawNumberCircle(renderCtx, currentR);
      }

      // Realistic spherical lighting sheen
      const grad = renderCtx.createRadialGradient(
        -currentR * 0.35, -currentR * 0.35, currentR * 0.1,
        -currentR * 0.1, -currentR * 0.1, currentR
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
      renderCtx.beginPath();
      renderCtx.arc(0, 0, currentR, 0, Math.PI * 2);
      renderCtx.fillStyle = grad;
      renderCtx.fill();

      renderCtx.restore();
    }

    drawNumberCircle(renderCtx, r) {
      renderCtx.beginPath();
      renderCtx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
      renderCtx.fillStyle = '#ffffff';
      renderCtx.fill();

      renderCtx.fillStyle = '#09090b';
      renderCtx.font = `bold ${Math.max(8, r * 0.55)}px sans-serif`;
      renderCtx.textAlign = 'center';
      renderCtx.textBaseline = 'middle';
      renderCtx.fillText(this.num, 0, 1);
    }
  }

  // --- 5. Rack Initialization ---
  function setupRack() {
    balls = [];
    pocketedBalls = [];
    totalStrokes = 0;
    player1Group = null;
    player2Group = null;

    // 1. Cue Ball placed at 1/4 headstring
    cueBall = new Ball(TABLE_LEFT + TABLE_WIDTH * 0.25, TABLE_CENTER_Y, BALL_CONFIGS[0]);
    balls.push(cueBall);

    // 2. 15 Object balls in Triangle Rack
    const apexX = TABLE_LEFT + TABLE_WIDTH * 0.72;
    const apexY = TABLE_CENTER_Y;
    const dx = BALL_RADIUS * Math.sqrt(3) + 0.6;
    const dy = BALL_RADIUS + 0.4;

    // Standard 8-ball triangle numbers pattern:
    // Row 0: [1]
    // Row 1: [2, 9]
    // Row 2: [3, 8, 10] (8 in the center!)
    // Row 3: [11, 4, 12, 5]
    // Row 4: [6, 13, 7, 14, 15]
    const rackOrder = [
      [1],
      [9, 2],
      [3, 8, 10],
      [11, 4, 12, 5],
      [6, 13, 7, 14, 15]
    ];

    for (let row = 0; row < rackOrder.length; row++) {
      const countInRow = rackOrder[row].length;
      const startY = apexY - (countInRow - 1) * dy;
      for (let col = 0; col < countInRow; col++) {
        const num = rackOrder[row][col];
        const cfg = BALL_CONFIGS[num];
        const bx = apexX + row * dx;
        const by = startY + col * (dy * 2);
        balls.push(new Ball(bx, by, cfg));
      }
    }

    cueAngle = 0; // Default aim towards rack
    updateHUD();
    renderPocketedTray();
  }

  // --- 6. Ball Collisions Physics Engine ---
  function resolveBallCollisions() {
    const n = balls.length;
    for (let i = 0; i < n; i++) {
      const b1 = balls[i];
      if (b1.isPocketed || b1.pottingAnimation) continue;

      for (let j = i + 1; j < n; j++) {
        const b2 = balls[j];
        if (b2.isPocketed || b2.pottingAnimation) continue;

        const deltaX = b2.x - b1.x;
        const deltaY = b2.y - b1.y;
        const dist = Math.hypot(deltaX, deltaY);
        const minDist = b1.r + b2.r;

        if (dist < minDist && dist > 1e-4) {
          // Normal vector
          const nx = deltaX / dist;
          const ny = deltaY / dist;

          // Separate overlapping balls
          const overlap = minDist - dist;
          b1.x -= nx * overlap * 0.5;
          b1.y -= ny * overlap * 0.5;
          b2.x += nx * overlap * 0.5;
          b2.y += ny * overlap * 0.5;

          // Relative velocity along normal
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2; // Equal mass

          if (nx * kx + ny * ky > 0) {
            b1.vx -= p * nx * RESTITUTION_BALL;
            b1.vy -= p * ny * RESTITUTION_BALL;
            b2.vx += p * nx * RESTITUTION_BALL;
            b2.vy += p * ny * RESTITUTION_BALL;

            const impactSpeed = Math.hypot(kx, ky);
            playSound('clack', impactSpeed);
          }
        }
      }
    }
  }

  function areBallsMoving() {
    return balls.some(b => !b.isPocketed && (Math.hypot(b.vx, b.vy) > 0.05 || b.pottingAnimation));
  }

  // --- 7. Pocket Event & Rule Evaluation ---
  function onBallPotted(ball) {
    if (ball.type === 'cue') {
      showFoul('⚠️ 스크래치! (흰 공 포켓팅)');
      setTimeout(() => {
        // Respawn cue ball at headstring
        cueBall.isPocketed = false;
        cueBall.scale = 1.0;
        cueBall.pottingAnimation = false;
        cueBall.x = TABLE_LEFT + TABLE_WIDTH * 0.25;
        cueBall.y = TABLE_CENTER_Y;
        cueBall.vx = 0;
        cueBall.vy = 0;
      }, 700);
      return;
    }

    pocketedBalls.push(ball);
    renderPocketedTray();

    // 8-Ball Pocketed Check
    if (ball.type === 'eight') {
      const remainingObjectBalls = balls.filter(b => b.num !== 0 && b.num !== 8 && !b.isPocketed);
      if (remainingObjectBalls.length === 0) {
        // Legal 8-ball potted -> WIN!
        handleGameWon();
      } else {
        // Early 8-ball potted -> LOSS in 2P, or respawn in Solo
        if (gameMode === 'solo') {
          showFoul('8번 공 조기 포켓! 다시 배치합니다.');
          setTimeout(() => {
            ball.isPocketed = false;
            ball.scale = 1.0;
            ball.x = TABLE_LEFT + TABLE_WIDTH * 0.72;
            ball.y = TABLE_CENTER_Y;
            ball.vx = 0;
            ball.vy = 0;
            const idx = pocketedBalls.indexOf(ball);
            if (idx !== -1) pocketedBalls.splice(idx, 1);
            renderPocketedTray();
          }, 800);
        } else {
          handleGameLost();
        }
      }
      return;
    }

    // 2-Player Group assignment on first ball
    if (gameMode === '2p' && !player1Group) {
      if (ball.type === 'solid') {
        player1Group = (currentPlayer === 1) ? 'solid' : 'stripe';
        player2Group = (currentPlayer === 1) ? 'stripe' : 'solid';
      } else if (ball.type === 'stripe') {
        player1Group = (currentPlayer === 1) ? 'stripe' : 'solid';
        player2Group = (currentPlayer === 1) ? 'solid' : 'stripe';
      }
      updateHUD();
    }

    // Solo completion check
    if (gameMode === 'solo') {
      const remaining = balls.filter(b => b.num !== 0 && !b.isPocketed);
      if (remaining.length === 0) {
        handleGameWon();
      }
    }
  }

  function showFoul(msg) {
    playSound('foul');
    foulAlertEl.textContent = msg;
    foulAlertEl.classList.remove('hidden');
    clearTimeout(foulMessageTimeout);
    foulMessageTimeout = setTimeout(() => {
      foulAlertEl.classList.add('hidden');
    }, 2400);
  }

  function handleGameWon() {
    playSound('win');
    if (typeof confetti === 'function') {
      confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 } });
    }
    resultTitleEl.textContent = '8볼 클리어! 승리!';
    resultDescEl.textContent = `축하합니다! 총 ${totalStrokes}타 만에 멋지게 승리했습니다!`;
    statModeEl.textContent = gameMode === 'solo' ? '1인 연습' : gameMode === '2p' ? '2인 대전' : 'AI 대결';
    statStrokesEl.textContent = `${totalStrokes}타`;
    statPocketedEl.textContent = `${pocketedBalls.length} / 15개`;
    resultModalEl.classList.remove('hidden');
  }

  function handleGameLost() {
    playSound('foul');
    resultTitleEl.textContent = '게임 오버 (8번 공 조기 포켓)';
    resultDescEl.textContent = '다른 목적구를 모두 넣기 전에 8번 공이 들어가 패배했습니다.';
    statModeEl.textContent = gameMode === 'solo' ? '1인 연습' : '2인 대전';
    statStrokesEl.textContent = `${totalStrokes}타`;
    statPocketedEl.textContent = `${pocketedBalls.length} / 15개`;
    resultModalEl.classList.remove('hidden');
  }

  // --- 8. Aiming, Trajectory Guide Line & Cue Stick ---
  function calculateAimIntersection() {
    if (!cueBall || cueBall.isPocketed) return null;

    const dirX = Math.cos(cueAngle);
    const dirY = Math.sin(cueAngle);

    let closestDist = Infinity;
    let hitBall = null;
    let hitPoint = null;

    // 1. Raycast vs Other Balls
    for (const b of balls) {
      if (b === cueBall || b.isPocketed || b.pottingAnimation) continue;

      const dX = b.x - cueBall.x;
      const dY = b.y - cueBall.y;
      const proj = dX * dirX + dY * dirY;

      if (proj > 0) {
        const perpDistSq = (dX * dX + dY * dY) - proj * proj;
        const radiusSum = BALL_RADIUS * 2;
        if (perpDistSq <= radiusSum * radiusSum) {
          const dCenter = Math.sqrt(radiusSum * radiusSum - perpDistSq);
          const t = proj - dCenter;
          if (t > 0 && t < closestDist) {
            closestDist = t;
            hitBall = b;
            hitPoint = {
              x: cueBall.x + dirX * t,
              y: cueBall.y + dirY * t
            };
          }
        }
      }
    }

    // 2. If no ball hit, intersect with cushion boundaries
    if (!hitPoint) {
      let tCushion = Infinity;
      if (dirX > 0) tCushion = Math.min(tCushion, (TABLE_RIGHT - BALL_RADIUS - cueBall.x) / dirX);
      if (dirX < 0) tCushion = Math.min(tCushion, (TABLE_LEFT + BALL_RADIUS - cueBall.x) / dirX);
      if (dirY > 0) tCushion = Math.min(tCushion, (TABLE_BOTTOM - BALL_RADIUS - cueBall.y) / dirY);
      if (dirY < 0) tCushion = Math.min(tCushion, (TABLE_TOP + BALL_RADIUS - cueBall.y) / dirY);

      if (tCushion < Infinity) {
        hitPoint = {
          x: cueBall.x + dirX * tCushion,
          y: cueBall.y + dirY * tCushion
        };
      }
    }

    return { hitPoint, hitBall };
  }

  function drawAimingGuide() {
    if (!showGuide || !cueBall || cueBall.isPocketed || areBallsMoving()) return;

    const result = calculateAimIntersection();
    if (!result || !result.hitPoint) return;

    const { hitPoint, hitBall } = result;

    // Cue Ball Trajectory Line
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(cueBall.x, cueBall.y);
    ctx.lineTo(hitPoint.x, hitPoint.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ghost Cue Ball at impact
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(hitPoint.x, hitPoint.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
    ctx.stroke();

    // If target ball is hit: draw target deflection line and cue deflection line
    if (hitBall) {
      const targetDirX = hitBall.x - hitPoint.x;
      const targetDirY = hitBall.y - hitPoint.y;
      const targetDist = Math.hypot(targetDirX, targetDirY);

      if (targetDist > 1e-4) {
        const normX = targetDirX / targetDist;
        const normY = targetDirY / targetDist;

        // Target Ball Direction line
        ctx.beginPath();
        ctx.moveTo(hitBall.x, hitBall.y);
        ctx.lineTo(hitBall.x + normX * 80, hitBall.y + normY * 80);
        ctx.strokeStyle = '#22c55e'; // Green guide for target ball
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Target Ball Arrow Head
        ctx.beginPath();
        ctx.arc(hitBall.x + normX * 80, hitBall.y + normY * 80, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawCueStick() {
    if (!cueBall || cueBall.isPocketed || areBallsMoving()) return;

    ctx.save();
    ctx.translate(cueBall.x, cueBall.y);
    ctx.rotate(cueAngle + Math.PI); // Drawn behind the cue ball

    // Drawback distance based on shotPower
    const pullDistance = BALL_RADIUS + 8 + (shotPower / 100) * 32;

    const stickLength = 260;
    const stickTipWidth = 4;
    const stickButtWidth = 9;

    // Cue Stick Body
    const grad = ctx.createLinearGradient(pullDistance, 0, pullDistance + stickLength, 0);
    grad.addColorStop(0, '#fef08a'); // Chalk tip / horn
    grad.addColorStop(0.04, '#e2e8f0');
    grad.addColorStop(0.15, '#b45309'); // Wood shaft
    grad.addColorStop(0.65, '#78350f');
    grad.addColorStop(0.85, '#1e293b'); // Grip wrap
    grad.addColorStop(1, '#0f172a');

    ctx.beginPath();
    ctx.moveTo(pullDistance, -stickTipWidth / 2);
    ctx.lineTo(pullDistance + stickLength, -stickButtWidth / 2);
    ctx.lineTo(pullDistance + stickLength, stickButtWidth / 2);
    ctx.lineTo(pullDistance, stickTipWidth / 2);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    // Cue Tip Chalk
    ctx.beginPath();
    ctx.rect(pullDistance, -stickTipWidth / 2, 4, stickTipWidth);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.restore();
  }

  // --- 9. Strike Execution & Turn Passing ---
  let isShotInProgress = false;

  function strikeBall() {
    if (!cueBall || cueBall.isPocketed || areBallsMoving()) return;

    const speedScale = 0.28;
    const speed = shotPower * speedScale;

    cueBall.vx = Math.cos(cueAngle) * speed;
    cueBall.vy = Math.sin(cueAngle) * speed;

    totalStrokes++;
    strokeCountEl.textContent = `스트로크: ${totalStrokes}타`;
    playSound('strike', shotPower / 100);

    isShotInProgress = true;
  }

  function handleTurnEnd() {
    isShotInProgress = false;

    if (gameMode === '2p') {
      currentPlayer = (currentPlayer === 1) ? 2 : 1;
    }

    updateHUD();

    // Trigger AI shot if in AI mode
    if (gameMode === 'ai' && currentPlayer === 2) {
      setTimeout(makeAiShot, 800);
    }
  }

  // --- 10. AI Opponent ---
  function makeAiShot() {
    if (areBallsMoving() || cueBall.isPocketed) return;

    // Find easiest ball to aim towards any pocket
    let bestAngle = 0;
    let bestScore = -Infinity;

    const targetBalls = balls.filter(b => b.num !== 0 && !b.isPocketed);
    if (targetBalls.length === 0) return;

    for (const ball of targetBalls) {
      for (const pocket of POCKETS) {
        const pocketDirX = pocket.x - ball.x;
        const pocketDirY = pocket.y - ball.y;
        const pocketDist = Math.hypot(pocketDirX, pocketDirY);

        if (pocketDist > 1e-4) {
          const normX = pocketDirX / pocketDist;
          const normY = pocketDirY / pocketDist;

          // Ghost ball position for cue ball impact
          const ghostX = ball.x - normX * (BALL_RADIUS * 2);
          const ghostY = ball.y - normY * (BALL_RADIUS * 2);

          const cueDirX = ghostX - cueBall.x;
          const cueDirY = ghostY - cueBall.y;
          const cueDist = Math.hypot(cueDirX, cueDirY);

          // Dot product between cue-ghost vector and ghost-ball vector (straightness of shot)
          const alignment = (cueDirX / cueDist) * normX + (cueDirY / cueDist) * normY;

          const score = alignment * 100 - (cueDist + pocketDist) * 0.1;
          if (score > bestScore) {
            bestScore = score;
            bestAngle = Math.atan2(cueDirY, cueDirX);
          }
        }
      }
    }

    cueAngle = bestAngle;
    shotPower = Math.floor(40 + Math.random() * 30);
    powerSlider.value = shotPower;
    powerValText.textContent = `${shotPower}%`;

    setTimeout(strikeBall, 500);
  }

  // --- 11. Rendering & Animation Loop ---
  function drawTable() {
    // 1. Table Rails & Cushions Border
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--rail-color').trim() || '#3b2014';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Decorative table trim
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--cushion-trim').trim() || '#ca8a04';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);

    // Diamond Sight Markers on Rails
    ctx.fillStyle = '#f8fafc';
    for (let i = 1; i <= 3; i++) {
      // Top & Bottom markers
      const x1 = TABLE_LEFT + (TABLE_WIDTH * 0.25) * i;
      ctx.beginPath();
      ctx.arc(x1, 38, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x1, CANVAS_HEIGHT - 38, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 1; i <= 2; i++) {
      // Left & Right markers
      const y1 = TABLE_TOP + (TABLE_HEIGHT * 0.33) * i;
      ctx.beginPath();
      ctx.arc(38, y1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 38, y1, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Main Felt Area
    const feltColor = getComputedStyle(document.body).getPropertyValue('--felt-color').trim() || '#0d6338';
    ctx.fillStyle = feltColor;
    ctx.fillRect(TABLE_LEFT, TABLE_TOP, TABLE_WIDTH, TABLE_HEIGHT);

    // Felt Shadow at Cushion Inset
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 6;
    ctx.strokeRect(TABLE_LEFT + 3, TABLE_TOP + 3, TABLE_WIDTH - 6, TABLE_HEIGHT - 6);

    // Headstring line
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(TABLE_LEFT + TABLE_WIDTH * 0.25, TABLE_TOP);
    ctx.lineTo(TABLE_LEFT + TABLE_WIDTH * 0.25, TABLE_BOTTOM);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Pockets (6 Holes)
    for (const pocket of POCKETS) {
      // Outer drop rim
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.r + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#18181b';
      ctx.fill();

      // Deep dark pocket interior
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.r - 2, 0, Math.PI * 2);
      ctx.fillStyle = '#020617';
      ctx.fill();
    }
  }

  function gameLoop() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawTable();

    // Physics step
    const wasMoving = areBallsMoving();

    resolveBallCollisions();
    balls.forEach(b => b.update());

    // Check if shot has settled
    if (wasMoving && !areBallsMoving() && isShotInProgress) {
      handleTurnEnd();
    }

    // Draw Aiming Guide & Balls
    drawAimingGuide();
    balls.forEach(b => b.draw(ctx));
    drawCueStick();

    requestAnimationFrame(gameLoop);
  }

  // --- 12. UI Updates ---
  function updateHUD() {
    if (gameMode === 'solo') {
      turnDotEl.style.background = '#22c55e';
      turnTitleEl.textContent = '1인 연습 (스트로크 챌린지)';
      ballGroupTagEl.textContent = '자유구 (모든 공 포켓팅)';
    } else if (gameMode === '2p') {
      const pColor = currentPlayer === 1 ? '#38bdf8' : '#f59e0b';
      turnDotEl.style.background = pColor;
      turnTitleEl.textContent = `플레이어 ${currentPlayer}의 차례`;
      const group = currentPlayer === 1 ? player1Group : player2Group;
      ballGroupTagEl.textContent = group
        ? (group === 'solid' ? '🔴 솔리드 (1~7번)' : '🟡 스트라이프 (9~15번)')
        : '자유구 (첫 포켓팅으로 결정)';
    } else {
      // AI Mode
      if (currentPlayer === 1) {
        turnDotEl.style.background = '#38bdf8';
        turnTitleEl.textContent = '선우 (내 차례)';
      } else {
        turnDotEl.style.background = '#f59e0b';
        turnTitleEl.textContent = '알파쌈뽕 AI (생각 중...)';
      }
      ballGroupTagEl.textContent = '8볼 대결';
    }
  }

  function renderPocketedTray() {
    pocketedTrayEl.innerHTML = '';
    pocketedBalls.forEach(b => {
      const mini = document.createElement('div');
      mini.className = 'mini-ball';
      mini.style.backgroundColor = b.color;
      mini.textContent = b.num;
      if (b.type === 'stripe') {
        mini.style.border = '2px solid #ffffff';
      }
      pocketedTrayEl.appendChild(mini);
    });
  }

  // --- 13. Event Listeners ---
  // Canvas Mouse Aiming
  canvas.addEventListener('mousemove', (e) => {
    if (areBallsMoving() || !cueBall || cueBall.isPocketed) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    cueAngle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
  });

  // Drag cue to adjust power and shoot
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && !areBallsMoving()) {
      isDraggingCue = true;
      dragStartPos = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingCue) {
      isDraggingCue = false;
      strikeBall();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingCue && dragStartPos) {
      const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
      shotPower = Math.min(100, Math.max(5, Math.floor(dist * 0.75)));
      powerSlider.value = shotPower;
      powerValText.textContent = `${shotPower}%`;
    }
  });

  // Touch Support
  canvas.addEventListener('touchmove', (e) => {
    if (areBallsMoving() || !cueBall || cueBall.isPocketed) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    cueAngle = Math.atan2(touchY - cueBall.y, touchX - cueBall.x);
    e.preventDefault();
  }, { passive: false });

  // Spacebar to shoot
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      strikeBall();
    }
  });

  // Power Slider
  powerSlider.addEventListener('input', (e) => {
    shotPower = parseInt(e.target.value, 10);
    powerValText.textContent = `${shotPower}%`;
  });

  // Strike Button
  btnStrike.addEventListener('click', strikeBall);

  // Guide Toggle
  btnGuideToggle.addEventListener('click', () => {
    showGuide = !showGuide;
    btnGuideToggle.classList.toggle('active', showGuide);
    guideIcon.textContent = showGuide ? '🎯 조준선 ON' : '🎯 조준선 OFF';
  });

  // Sound Toggle
  btnSoundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊 소리' : '🔇 음소거';
  });

  // Re-rack Button
  btnRerack.addEventListener('click', setupRack);

  // Game Mode Toggle
  document.querySelectorAll('#mode-solo, #mode-2p, #mode-ai').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-solo, #mode-2p, #mode-ai').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameMode = btn.dataset.mode;
      currentPlayer = 1;
      setupRack();
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

  // Modal Restart Buttons
  btnModalRestart.addEventListener('click', () => {
    resultModalEl.classList.add('hidden');
    setupRack();
  });
  btnModalReview.addEventListener('click', () => {
    resultModalEl.classList.add('hidden');
  });

  // Start initial game & loop
  setupRack();
  requestAnimationFrame(gameLoop);
})();
