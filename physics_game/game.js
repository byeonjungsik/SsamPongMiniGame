/**
 * Bouncy Wall Physics Challenge - Main Game Engine with Multi-Stroke Wall Drawing
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const currentTimeEl = document.getElementById('current-time');
  const bestTimeEl = document.getElementById('best-time');
  const currentSpeedEl = document.getElementById('current-speed');
  
  const drawModeBtn = document.getElementById('draw-mode-btn');
  const eraseModeBtn = document.getElementById('erase-mode-btn');
  const startBtn = document.getElementById('start-btn');
  const clearBtn = document.getElementById('clear-btn');
  const retryBtn = document.getElementById('retry-btn');
  
  const toggleVectorsCb = document.getElementById('toggle-vectors');
  const gravitySlider = document.getElementById('gravity-slider');
  const gravityValEl = document.getElementById('gravity-val');
  const elasticitySlider = document.getElementById('elasticity-slider');
  const elasticityValEl = document.getElementById('elasticity-val');
  const frictionSlider = document.getElementById('friction-slider');
  const frictionValEl = document.getElementById('friction-val');
  
  const statusOverlay = document.getElementById('status-overlay');
  const resultTitleEl = document.getElementById('result-title');
  const resultTimeEl = document.getElementById('result-time');

  // Game States & Tools
  const STATES = { DRAWING: 0, READY: 1, SIMULATING: 2, FINISHED: 3 };
  const TOOLS = { DRAW: 'draw', ERASE: 'erase' };
  
  let currentState = STATES.DRAWING;
  let currentTool = TOOLS.DRAW;

  // Markers & Eraser Config
  const startPoint = { x: 80, y: 80 };
  const goalPoint = { x: 880, y: 440 };
  const eraserRadius = 22;
  let mousePos = { x: -100, y: -100 };
  let isMouseOverCanvas = false;

  // Mouse Drawing & Multi-Stroke Wall State
  let currentStroke = [];
  let isMouseDown = false;
  let wallPath = new MultiStrokeWall();

  // Physics Engine & Ball
  const physics = new PhysicsEngine();
  let playerBall = new RigidBall(startPoint, 12, '#f97316');
  let bestTime = localStorage.getItem('bouncy_wall_best_time') ? parseFloat(localStorage.getItem('bouncy_wall_best_time')) : null;

  if (bestTime) {
    bestTimeEl.textContent = bestTime.toFixed(3) + 's';
  }

  function updatePhysicsParams() {
    physics.setParameters(gravitySlider.value, elasticitySlider.value, frictionSlider.value);
  }
  updatePhysicsParams();

  gravitySlider.addEventListener('input', (e) => {
    gravityValEl.textContent = e.target.value;
    updatePhysicsParams();
  });

  elasticitySlider.addEventListener('input', (e) => {
    elasticityValEl.textContent = e.target.value;
    updatePhysicsParams();
  });

  frictionSlider.addEventListener('input', (e) => {
    frictionValEl.textContent = e.target.value;
    updatePhysicsParams();
  });

  // Tool Switchers
  drawModeBtn.addEventListener('click', () => {
    currentTool = TOOLS.DRAW;
    drawModeBtn.classList.add('active');
    eraseModeBtn.classList.remove('active');
  });

  eraseModeBtn.addEventListener('click', () => {
    currentTool = TOOLS.ERASE;
    eraseModeBtn.classList.add('active');
    drawModeBtn.classList.remove('active');
  });

  // Mouse / Touch Event Handlers
  function getCanvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function handleStart(pos, target) {
    if (currentState === STATES.SIMULATING) return;
    if (target && target !== canvas) return;

    isMouseDown = true;
    mousePos = pos;
    isMouseOverCanvas = true;

    if (currentTool === TOOLS.DRAW) {
      currentStroke = [pos];
      statusOverlay.classList.add('hidden');
    } else if (currentTool === TOOLS.ERASE) {
      wallPath.eraseAt(pos, eraserRadius);
    }
  }

  function handleMove(pos) {
    mousePos = pos;
    isMouseOverCanvas = true;

    if (!isMouseDown || currentState === STATES.SIMULATING) return;

    if (currentTool === TOOLS.DRAW) {
      const lastPt = currentStroke[currentStroke.length - 1];
      if (!lastPt || Math.hypot(pos.x - lastPt.x, pos.y - lastPt.y) > 6) {
        currentStroke.push(pos);
      }
    } else if (currentTool === TOOLS.ERASE) {
      wallPath.eraseAt(pos, eraserRadius);
    }
  }

  function handleStop() {
    if (!isMouseDown) return;
    isMouseDown = false;

    if (currentTool === TOOLS.DRAW && currentStroke.length >= 2) {
      wallPath.addStroke(currentStroke);
      currentStroke = [];
      currentState = STATES.READY;
    }
  }

  canvas.addEventListener('mouseenter', () => { isMouseOverCanvas = true; });
  canvas.addEventListener('mouseleave', () => { isMouseOverCanvas = false; isMouseDown = false; });

  canvas.addEventListener('mousedown', (e) => handleStart(getCanvasPos(e), e.target));
  canvas.addEventListener('mousemove', (e) => handleMove(getCanvasPos(e)));
  window.addEventListener('mouseup', handleStop);

  canvas.addEventListener('touchstart', (e) => { 
    if (e.target === canvas) e.preventDefault(); 
    handleStart(getCanvasPos(e), e.target); 
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { 
    if (isMouseDown) e.preventDefault(); 
    handleMove(getCanvasPos(e)); 
  }, { passive: false });
  window.addEventListener('touchend', handleStop);

  // Button Action Handlers
  startBtn.addEventListener('click', () => {
    updatePhysicsParams();
    playerBall.reset();
    currentState = STATES.SIMULATING;
    statusOverlay.classList.add('hidden');
  });

  clearBtn.addEventListener('click', () => {
    currentStroke = [];
    wallPath.clear();
    playerBall.reset();
    currentState = STATES.DRAWING;
    currentTimeEl.textContent = '0.000s';
    currentSpeedEl.textContent = '0.0 m/s';
    statusOverlay.classList.add('hidden');
  });

  retryBtn.addEventListener('click', () => {
    updatePhysicsParams();
    playerBall.reset();
    currentState = STATES.SIMULATING;
    statusOverlay.classList.add('hidden');
  });

  // Game Loop
  let lastTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    if (currentState === STATES.SIMULATING) {
      const substeps = 8;
      const subDt = dt / substeps;
      for (let step = 0; step < substeps; step++) {
        playerBall.update(subDt, wallPath, physics, goalPoint);
      }

      currentTimeEl.textContent = playerBall.elapsedTime.toFixed(3) + 's';
      const speedMps = Math.hypot(playerBall.vx, playerBall.vy) / physics.scale;
      currentSpeedEl.textContent = speedMps.toFixed(1) + ' m/s';

      if (playerBall.isFinished) {
        currentState = STATES.FINISHED;
        handleFinish();
      }
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  function handleFinish() {
    const finalTime = playerBall.elapsedTime;
    resultTimeEl.textContent = finalTime.toFixed(3) + 's';

    if (!bestTime || finalTime < bestTime) {
      bestTime = finalTime;
      localStorage.setItem('bouncy_wall_best_time', bestTime.toString());
      bestTimeEl.textContent = bestTime.toFixed(3) + 's';
      resultTitleEl.textContent = '🏆 최고 기록 달성!';
    } else {
      resultTitleEl.textContent = '🎉 목표 지점 골인!';
    }
    statusOverlay.classList.remove('hidden');
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid
    drawGrid();

    // 2. Drawn Bouncy Walls
    if (wallPath && wallPath.strokes.length > 0) {
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      wallPath.strokes.forEach(stroke => {
        if (stroke.length < 2) return;
        ctx.beginPath();
        stroke.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      });
      ctx.restore();
    }

    // Active drawing stroke
    if (currentStroke.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      currentStroke.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }

    // 3. Eraser Cursor Guide
    if (currentTool === TOOLS.ERASE && isMouseOverCanvas) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, eraserRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Start & Goal Markers
    drawMarker(startPoint, '#22c55e', 'START (시작)');
    drawGoalMarker(goalPoint, '#ef4444', 'GOAL (목표)');

    // 5. Ball Trail Effects
    if (playerBall.trail && playerBall.trail.length > 0) {
      playerBall.trail.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, playerBall.radius * t.alpha * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${t.alpha * 0.4})`;
        ctx.fill();
      });
    }

    // 6. Player Ball
    ctx.save();
    ctx.shadowColor = 'rgba(249, 115, 22, 0.8)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(playerBall.x, playerBall.y, playerBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = playerBall.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 7. Velocity / Motion Vector Arrow
    if (toggleVectorsCb.checked && (currentState === STATES.SIMULATING || currentState === STATES.READY)) {
      const speed = Math.hypot(playerBall.vx, playerBall.vy);
      if (speed > 10) {
        drawVector(playerBall.x, playerBall.y, playerBall.vx * 0.15, playerBall.vy * 0.15, '#facc15');
      }
    }
  }

  function drawGrid() {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 40;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawMarker(pt, color, label) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = color + '22';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pt.x, pt.y - 22);
  }

  function drawGoalMarker(pt, color, label) {
    const time = Date.now() * 0.003;
    const pulseRadius = 20 + Math.sin(time) * 4;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = color + '33';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pt.x, pt.y - 28);
  }

  function drawVector(x, y, dx, dy, color) {
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(x + dx - 8 * Math.cos(angle - Math.PI / 6), y + dy - 8 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x + dx - 8 * Math.cos(angle + Math.PI / 6), y + dy - 8 * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = color;
    ctx.fill();
  }

  requestAnimationFrame(gameLoop);
});
