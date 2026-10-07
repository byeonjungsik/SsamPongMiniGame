/**
 * Neon Snake Arcade Game Engine
 * Features Neon Graphics, Power-ups, Portal Wrap Mode, Particle FX & Sound Synth.
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const currentScoreEl = document.getElementById('current-score');
  const highScoreEl = document.getElementById('high-score');
  const gameModal = document.getElementById('game-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMsg = document.getElementById('modal-msg');
  const startBtn = document.getElementById('start-btn');
  const wallModeSelect = document.getElementById('wall-mode-select');
  const speedSelect = document.getElementById('speed-select');
  const powerupBadge = document.getElementById('powerup-badge');
  const powerupIcon = document.getElementById('powerup-icon');
  const powerupName = document.getElementById('powerup-name');

  // D-Pad Buttons
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');

  // Grid Constants
  const GRID_SIZE = 25;
  const CELL_SIZE = canvas.width / GRID_SIZE; // 24px per cell

  // Game State Variables
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = null;
  let particles = [];
  let score = 0;
  let highScore = parseInt(localStorage.getItem('neon_snake_highscore') || '0', 10);

  let gameLoopTimer = null;
  let isRunning = false;
  let wallMode = 'portal'; // 'classic' | 'portal'
  let baseSpeedDelay = 90; // ms per step
  let activeSpeedDelay = 90;

  // Active Power-up States
  let hasShield = false;
  let isSlowed = false;
  let slowTimer = null;

  highScoreEl.textContent = highScore;

  // Web Audio API Sound Synthesizer
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

  function playSound(type) {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === 'eat') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'powerup') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.2, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.11);
      });
    } else if (type === 'shield') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } else if (type === 'gameover') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.41);
    }
  }

  // Particle System Effect
  function spawnParticles(x, y, color, count = 16) {
    const px = (x + 0.5) * CELL_SIZE;
    const py = (y + 0.5) * CELL_SIZE;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: color,
        life: 1.0,
        decay: 1.5 + Math.random() * 1.5
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Food Generator
  function spawnFood() {
    let valid = false;
    let fx, fy;

    while (!valid) {
      fx = Math.floor(Math.random() * GRID_SIZE);
      fy = Math.floor(Math.random() * GRID_SIZE);
      valid = !snake.some(seg => seg.x === fx && seg.y === fy);
    }

    // Determine type: apple (70%), star (12%), shield (10%), slow (8%)
    const rand = Math.random();
    let type = 'apple';
    if (rand > 0.92) type = 'slow';
    else if (rand > 0.82) type = 'shield';
    else if (rand > 0.70) type = 'star';

    food = { x: fx, y: fy, type: type, pulse: 0 };
  }

  // Start / Reset Game
  function startGame() {
    wallMode = wallModeSelect.value;
    baseSpeedDelay = parseInt(speedSelect.value, 10);
    activeSpeedDelay = baseSpeedDelay;

    snake = [
      { x: 12, y: 12 },
      { x: 11, y: 12 },
      { x: 10, y: 12 }
    ];

    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    currentScoreEl.textContent = '0';
    particles = [];

    hasShield = false;
    isSlowed = false;
    if (slowTimer) clearTimeout(slowTimer);
    updatePowerupBadge();

    spawnFood();
    gameModal.classList.add('hidden');
    isRunning = true;

    scheduleNextStep();
  }

  function gameOver() {
    isRunning = false;
    if (gameLoopTimer) clearTimeout(gameLoopTimer);

    playSound('gameover');

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('neon_snake_highscore', highScore);
      highScoreEl.textContent = highScore;
      modalTitle.textContent = '🏆 NEW HIGH SCORE!';
    } else {
      modalTitle.textContent = '💀 GAME OVER';
    }

    modalMsg.textContent = `최종 점수: ${score}점`;
    startBtn.textContent = '🔄 다시하기';
    gameModal.classList.remove('hidden');
  }

  function updatePowerupBadge() {
    if (hasShield) {
      powerupIcon.textContent = '🛡️';
      powerupName.textContent = '방어막 가동 중';
      powerupBadge.classList.remove('hidden');
    } else if (isSlowed) {
      powerupIcon.textContent = '⏳';
      powerupName.textContent = '슬로우 모션 (감속)';
      powerupBadge.classList.remove('hidden');
    } else {
      powerupBadge.classList.add('hidden');
    }
  }

  // Game Step
  function gameStep() {
    if (!isRunning) return;

    dir = { ...nextDir };
    let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall Collision / Portal Wrap
    if (wallMode === 'portal') {
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;
    } else {
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        if (hasShield) {
          hasShield = false;
          playSound('shield');
          updatePowerupBadge();
          // Bounce back inside
          head.x = Math.max(0, Math.min(GRID_SIZE - 1, head.x));
          head.y = Math.max(0, Math.min(GRID_SIZE - 1, head.y));
        } else {
          gameOver();
          return;
        }
      }
    }

    // Self Collision
    const selfHitIndex = snake.findIndex(seg => seg.x === head.x && seg.y === head.y);
    if (selfHitIndex !== -1) {
      if (hasShield) {
        hasShield = false;
        playSound('shield');
        updatePowerupBadge();
      } else {
        gameOver();
        return;
      }
    }

    snake.unshift(head);

    // Check Food Collision
    if (food && head.x === food.x && head.y === food.y) {
      if (food.type === 'apple') {
        score += 10;
        playSound('eat');
        spawnParticles(food.x, food.y, '#4ade80');
      } else if (food.type === 'star') {
        score += 30;
        playSound('powerup');
        spawnParticles(food.x, food.y, '#fbbf24', 24);
      } else if (food.type === 'shield') {
        score += 20;
        hasShield = true;
        playSound('powerup');
        spawnParticles(food.x, food.y, '#38bdf8', 24);
        updatePowerupBadge();
      } else if (food.type === 'slow') {
        score += 15;
        isSlowed = true;
        playSound('powerup');
        spawnParticles(food.x, food.y, '#c084fc', 24);
        updatePowerupBadge();

        if (slowTimer) clearTimeout(slowTimer);
        slowTimer = setTimeout(() => {
          isSlowed = false;
          updatePowerupBadge();
        }, 6000);
      }

      currentScoreEl.textContent = score;
      spawnFood();
    } else {
      snake.pop(); // Keep same length
    }

    scheduleNextStep();
  }

  function scheduleNextStep() {
    if (!isRunning) return;
    const currentDelay = isSlowed ? baseSpeedDelay * 1.6 : baseSpeedDelay;
    gameLoopTimer = setTimeout(gameStep, currentDelay);
  }

  // Main Render Loop
  let lastTime = performance.now();

  function render(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // Clear Canvas with Neon Dark Gradient
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Subtle Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Update & Draw Particles
    updateParticles(dt);
    drawParticles();

    // Draw Food Item
    if (food) {
      food.pulse += dt * 5;
      const pulseScale = 1 + Math.sin(food.pulse) * 0.12;

      ctx.save();
      const fx = (food.x + 0.5) * CELL_SIZE;
      const fy = (food.y + 0.5) * CELL_SIZE;
      const r = (CELL_SIZE * 0.4) * pulseScale;

      let color = '#f43f5e'; // Apple red
      let glow = '#f43f5e';
      let icon = '🍎';

      if (food.type === 'star') { color = '#fbbf24'; glow = '#fbbf24'; icon = '⭐'; }
      else if (food.type === 'shield') { color = '#38bdf8'; glow = '#38bdf8'; icon = '🛡️'; }
      else if (food.type === 'slow') { color = '#c084fc'; glow = '#c084fc'; icon = '⏳'; }

      ctx.shadowColor = glow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();

      // Icon Text
      ctx.font = `${CELL_SIZE * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, fx, fy);
      ctx.restore();
    }

    // Draw Snake
    if (snake.length > 0) {
      snake.forEach((seg, index) => {
        const sx = seg.x * CELL_SIZE;
        const sy = seg.y * CELL_SIZE;
        const radius = 6;

        ctx.save();

        if (index === 0) {
          // Snake Head
          ctx.fillStyle = hasShield ? '#38bdf8' : '#4ade80';
          ctx.shadowColor = hasShield ? '#38bdf8' : '#4ade80';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 8);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#070a14';
          const eyeSize = 3;
          let eyeX1 = sx + 6, eyeY1 = sy + 6, eyeX2 = sx + 14, eyeY2 = sy + 6;

          if (dir.x === 1) { eyeX1 = sx + 16; eyeY1 = sy + 6; eyeX2 = sx + 16; eyeY2 = sy + 14; }
          else if (dir.x === -1) { eyeX1 = sx + 6; eyeY1 = sy + 6; eyeX2 = sx + 6; eyeY2 = sy + 14; }
          else if (dir.y === 1) { eyeX1 = sx + 6; eyeY1 = sy + 16; eyeX2 = sx + 14; eyeY2 = sy + 16; }

          ctx.beginPath();
          ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
          ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // Snake Body Segments (Gradient Fade)
          const fade = 1 - (index / snake.length) * 0.65;
          ctx.fillStyle = `rgba(56, 189, 248, ${fade})`;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.shadowBlur = 6;

          ctx.beginPath();
          ctx.roundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    requestAnimationFrame(render);
  }

  // Keyboard Event Listeners
  window.addEventListener('keydown', (e) => {
    if (!isRunning) return;

    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y !== 1) {
      nextDir = { x: 0, y: -1 };
    } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y !== -1) {
      nextDir = { x: 0, y: 1 };
    } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x !== 1) {
      nextDir = { x: -1, y: 0 };
    } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x !== -1) {
      nextDir = { x: 1, y: 0 };
    }
  });

  // Touch Swipe Gesture Handling
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!isRunning) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && dir.x !== -1) nextDir = { x: 1, y: 0 };
      else if (dx < -30 && dir.x !== 1) nextDir = { x: -1, y: 0 };
    } else {
      if (dy > 30 && dir.y !== -1) nextDir = { x: 0, y: 1 };
      else if (dy < -30 && dir.y !== 1) nextDir = { x: 0, y: -1 };
    }
  }, { passive: true });

  // Mobile D-Pad Event Handlers
  btnUp.addEventListener('click', () => { if (isRunning && dir.y !== 1) nextDir = { x: 0, y: -1 }; });
  btnDown.addEventListener('click', () => { if (isRunning && dir.y !== -1) nextDir = { x: 0, y: 1 }; });
  btnLeft.addEventListener('click', () => { if (isRunning && dir.x !== 1) nextDir = { x: -1, y: 0 }; });
  btnRight.addEventListener('click', () => { if (isRunning && dir.x !== -1) nextDir = { x: 1, y: 0 }; });

  // Start Button Event
  startBtn.addEventListener('click', startGame);

  // Start Animation Render Loop
  requestAnimationFrame(render);
});
