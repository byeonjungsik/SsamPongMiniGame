/**
 * 🔥❄️ A Dance of Fire and Ice (얼불춤) - Web Rhythm Game Engine
 * Author: Antigravity AI
 */

(function () {
  'use strict';

  // --- STAGE DEFINITIONS ---
  const STAGES = [
    {
      id: 0,
      name: "STAGE 1. 불과 얼음의 시작",
      badge: "EASY",
      bpm: 100,
      description: "기본 180° 및 90° 꺾임 트랙",
      // Tile angle sequence in degrees relative to standard angles
      // 0: Right, 90: Up, 180: Left, 270: Down
      tiles: [
        0, 0, 0, 90, 90, 0, 0, 270, 270, 0, 0, 90, 90, 90, 0, 0,
        0, 270, 270, 180, 180, 270, 0, 0, 90, 0, 0, 0
      ]
    },
    {
      id: 1,
      name: "STAGE 2. 네온 펄스 비트",
      badge: "NORMAL",
      bpm: 130,
      description: "180°, 90°, U턴 복합 트랙",
      tiles: [
        0, 0, 90, 180, 180, 270, 0, 0, 90, 90, 180, 270, 270, 0, 90, 0,
        90, 180, 180, 90, 0, 0, 270, 270, 0, 90, 180, 180, 270, 0, 0, 0, 0
      ]
    },
    {
      id: 2,
      name: "STAGE 3. 광란의 나선",
      badge: "HARD",
      bpm: 160,
      description: "45° 사선 & 원형 스파이럴 트랙",
      tiles: [
        0, 45, 90, 135, 180, 225, 270, 315, 0, 0, 45, 45, 90, 90, 135, 180,
        225, 270, 315, 0, 0, 90, 180, 270, 0, 45, 90, 135, 180, 0, 0, 0
      ]
    },
    {
      id: 3,
      name: "STAGE 4. 인페르노 프로스트 (보스)",
      badge: "INSANE",
      bpm: 190,
      description: "극악의 변속 & 복합 비트 곡선",
      tiles: [
        0, 0, 45, 90, 135, 180, 180, 270, 0, 45, 90, 0, 270, 180, 135, 90,
        45, 0, 315, 270, 225, 180, 180, 90, 90, 0, 45, 90, 135, 180, 270, 0,
        0, 90, 180, 270, 0, 0, 0, 0
      ]
    },
    {
      id: 4,
      name: "STAGE 5. 쌈뽕 질주 (SsamPong Rush)",
      badge: "HARD",
      bpm: 150,
      description: "신나는 지그재그 리듬 & 연속 꺾임 질주 트랙",
      tiles: [
        0, 0, 90, 0, 90, 0, 270, 0, 270, 0, 90, 90, 180, 270, 0, 0,
        90, 180, 180, 270, 0, 0, 90, 0, 90, 180, 270, 270, 0, 0, 90, 0,
        0, 0, 0, 0
      ]
    },
    {
      id: 5,
      name: "STAGE 6. 코스믹 갤럭시 (Cosmic Galaxy)",
      badge: "EXPERT",
      bpm: 175,
      description: "45° 사선 비행 & 롤러코스터 루프 트랙",
      tiles: [
        0, 45, 90, 45, 0, 315, 270, 315, 0, 45, 90, 135, 180, 225, 270, 315,
        0, 0, 45, 90, 45, 0, 270, 180, 135, 90, 45, 0, 315, 270, 270, 0,
        45, 90, 135, 180, 0, 0, 0, 0, 0, 0
      ]
    },
    {
      id: 6,
      name: "STAGE 7. 다크 볼텍스 (Dark Vortex)",
      badge: "CHAOS",
      bpm: 200,
      description: "초극악 360° 소용돌이와 폭풍 연타 트랙",
      tiles: [
        0, 45, 90, 135, 180, 225, 270, 315, 0, 90, 180, 270, 0, 45, 90, 135,
        180, 270, 0, 0, 270, 180, 90, 0, 45, 90, 135, 180, 225, 270, 315, 0,
        0, 90, 180, 270, 0, 45, 90, 180, 270, 0, 0, 0, 0, 0
      ]
    },
    {
      id: 7,
      name: "STAGE 8. 갓 오브 파이어앤아이스",
      badge: "GOD",
      bpm: 220,
      description: "얼불춤 마스터를 위한 전설의 초고속 피벗 트랙",
      tiles: [
        0, 0, 90, 180, 270, 0, 45, 90, 135, 180, 225, 270, 315, 0, 0, 270,
        180, 90, 0, 45, 90, 135, 180, 0, 270, 180, 90, 0, 45, 90, 0, 270,
        180, 90, 0, 45, 135, 225, 315, 0, 90, 180, 270, 0, 45, 90, 180, 0,
        0, 0, 0, 0
      ]
    }
  ];

  // Map Presets for Level Editor
  const MAP_PRESETS = {
    sprint: {
      name: "초스피드 일직선 질주",
      bpm: 160,
      tiles: [0, 0, 0, 0, 0, 0, 0, 0, 90, 90, 180, 180, 180, 180, 180, 180, 270, 270, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    zigzag: {
      name: "계단식 지그재그",
      bpm: 140,
      tiles: [0, 90, 0, 90, 0, 90, 0, 270, 0, 270, 0, 270, 0, 90, 0, 90, 0, 270, 0, 270, 0, 0, 0]
    },
    spiral: {
      name: "회오리 소용돌이",
      bpm: 155,
      tiles: [0, 45, 90, 135, 180, 225, 270, 315, 0, 45, 90, 135, 180, 225, 270, 315, 0, 0, 0, 0]
    },
    roller: {
      name: "롤러코스터 루프",
      bpm: 170,
      tiles: [0, 0, 45, 90, 135, 180, 225, 270, 315, 0, 45, 0, 315, 270, 225, 180, 135, 90, 45, 0, 0, 0]
    },
    star: {
      name: "오각별 스윙",
      bpm: 180,
      tiles: [0, 72, 144, 216, 288, 0, 72, 144, 216, 288, 0, 0, 72, 144, 216, 288, 0, 0, 0]
    }
  };

  // --- AUDIO SYNTHESIZER ENGINE (Web Audio API) ---
  class AudioEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playHitSound(isFire, judgement) {
      if (!this.ctx) return;
      this.init();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (isFire) {
        // Fire hit sound (warm synth pop)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(judgement === 'PERFECT' ? 440 : 380, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      } else {
        // Ice hit sound (crisp crystalline chime)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(judgement === 'PERFECT' ? 880 : 760, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      }

      osc.start(now);
      osc.stop(now + 0.15);
    }

    playFailSound() {
      if (!this.ctx) return;
      this.init();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.3);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }

    playClearSound() {
      if (!this.ctx) return;
      this.init();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + i * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      });
    }

    playBeatMetronome() {
      if (!this.ctx) return;
      this.init();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  // --- PARTICLE SYSTEM ---
  class Particle {
    constructor(x, y, color, speed, size, isSparkle = false) {
      this.x = x;
      this.y = y;
      this.color = color;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed * (0.5 + Math.random());
      this.vy = Math.sin(angle) * speed * (0.5 + Math.random());
      this.size = size;
      this.maxSize = size;
      this.alpha = 1;
      this.life = 1;
      this.decay = 0.02 + Math.random() * 0.03;
      this.isSparkle = isSparkle;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.alpha = Math.max(0, this.life);
      this.size = this.maxSize * this.life;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      if (this.isSparkle) {
        // Draw diamond sparkle for ice
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y);
      } else {
        // Draw circle for fire
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  // --- MAIN GAME APPLICATION ---
  class AdofaiGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.audio = new AudioEngine();

      // UI Elements
      this.hud = document.getElementById('game-hud');
      this.hudStageName = document.getElementById('hud-stage-name');
      this.hudProgressBar = document.getElementById('hud-progress-bar');
      this.hudPercent = document.getElementById('hud-percent');
      this.hudCombo = document.getElementById('hud-combo');
      this.hudAccuracy = document.getElementById('hud-accuracy');
      this.hudScore = document.getElementById('hud-score');
      this.hitFeedback = document.getElementById('hit-feedback');
      this.stageMenu = document.getElementById('stage-menu');
      this.editorMenu = document.getElementById('editor-menu');
      this.resultMenu = document.getElementById('result-menu');

      // State Variables
      this.currentStageIndex = 0;
      this.speedMultiplier = 1.0;
      this.audioOffsetMs = 0;
      this.isPlaying = false;
      this.isPaused = false;
      this.isEditor = false;

      // Track & Physics Parameters
      this.tileSpacing = 110; // Pixels between tiles
      this.tiles = [];        // [{x, y, angle}]
      this.currentTileIdx = 0;

      // Planets (Orbs) State
      // orbPivot: index 0 (Fire) or 1 (Ice)
      this.orbPivot = 0; // 0 = Fire is Pivot, Ice is revolving
      this.fireOrb = { x: 0, y: 0, color: '#ff4500', glow: '#ff8c00' };
      this.iceOrb = { x: 0, y: 0, color: '#00f0ff', glow: '#00ffff' };

      // Rotation parameters
      this.rotAngle = 0;        // Current rotation angle in radians
      this.rotDirection = 1;    // 1 (Counter-Clockwise) or -1 (Clockwise)
      this.targetAngle = 0;     // Target angle in radians to land on next tile
      this.bpm = 100;
      this.lastTime = 0;

      // Stats
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.totalHits = 0;
      this.weightedHits = 0;
      this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };

      // FX & Camera
      this.particles = [];
      this.screenShake = 0;
      this.camX = 0;
      this.camY = 0;

      // Custom Editor State
      this.customTiles = [0, 0, 90, 90, 180];
      this.customBpm = 120;

      // High Scores array from localStorage
      this.highScores = JSON.parse(localStorage.getItem('adofai_highscores') || '[{},{},{},{}]');

      this.initWindow();
      this.initEvents();
      this.updateHighScoreDisplay();
    }

    initWindow() {
      const resize = () => {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
      };
      window.addEventListener('resize', resize);
      resize();
    }

    initEvents() {
      // Key input for hitting beats
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyK' || e.code === 'Enter') {
          if (this.isPlaying && !this.isPaused) {
            e.preventDefault();
            this.handleHitInput();
          }
        }
        if (e.code === 'Escape' && this.isPlaying) {
          this.togglePause();
        }
      });

      // Canvas click / touch input
      this.canvas.addEventListener('pointerdown', (e) => {
        if (this.isPlaying && !this.isPaused) {
          this.audio.init();
          this.handleHitInput();
        }
      });

      // Stage cards selection
      document.querySelectorAll('.stage-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.stage-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.currentStageIndex = parseInt(card.dataset.stage);
        });
      });

      // Menu Buttons
      document.getElementById('start-stage-btn').addEventListener('click', () => {
        this.startStage(this.currentStageIndex);
      });

      document.getElementById('pause-btn').addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('speed-select').addEventListener('change', (e) => {
        this.speedMultiplier = parseFloat(e.target.value);
      });

      document.getElementById('offset-input').addEventListener('input', (e) => {
        this.audioOffsetMs = parseInt(e.target.value);
        document.getElementById('offset-val').innerText = `${this.audioOffsetMs}ms`;
      });

      // Editor Buttons
      document.getElementById('open-editor-btn').addEventListener('click', () => {
        this.stageMenu.classList.add('hidden');
        this.editorMenu.classList.remove('hidden');
        this.updateEditorUI();
      });

      document.getElementById('close-editor-btn').addEventListener('click', () => {
        this.editorMenu.classList.add('hidden');
        this.stageMenu.classList.remove('hidden');
      });

      document.querySelectorAll('.dir-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.customTiles.push(parseInt(btn.dataset.dir));
          this.updateEditorUI();
        });
      });

      document.getElementById('clear-tiles-btn').addEventListener('click', () => {
        this.customTiles = [];
        this.updateEditorUI();
      });

      document.getElementById('undo-tile-btn').addEventListener('click', () => {
        this.customTiles.pop();
        this.updateEditorUI();
      });

      // Preset Map Buttons
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetKey = btn.dataset.preset;
          const preset = MAP_PRESETS[presetKey];
          if (preset) {
            this.customTiles = [...preset.tiles];
            document.getElementById('custom-bpm').value = preset.bpm;
            this.updateEditorUI();
          }
        });
      });

      // Apply Manual Tile Sequence Button
      const applySeqBtn = document.getElementById('apply-sequence-btn');
      if (applySeqBtn) {
        applySeqBtn.addEventListener('click', () => {
          const inputVal = document.getElementById('tile-sequence').value;
          const parsed = inputVal
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));
          if (parsed.length === 0) {
            alert('올바른 각도 숫자(예: 0, 90, 180, 270)를 입력해 주세요!');
            return;
          }
          this.customTiles = parsed;
          this.updateEditorUI();
        });
      }

      document.getElementById('play-custom-btn').addEventListener('click', () => {
        if (this.customTiles.length === 0) {
          alert('최소 1개 이상의 타일을 추가하세요!');
          return;
        }
        this.customBpm = parseInt(document.getElementById('custom-bpm').value) || 120;
        this.editorMenu.classList.add('hidden');
        this.startCustomStage();
      });

      // Result Buttons
      document.getElementById('retry-btn').addEventListener('click', () => {
        this.resultMenu.classList.add('hidden');
        if (this.isEditor) {
          this.startCustomStage();
        } else {
          this.startStage(this.currentStageIndex);
        }
      });

      document.getElementById('next-stage-btn').addEventListener('click', () => {
        this.resultMenu.classList.add('hidden');
        this.currentStageIndex = (this.currentStageIndex + 1) % STAGES.length;
        this.startStage(this.currentStageIndex);
      });

      document.getElementById('result-menu-btn').addEventListener('click', () => {
        this.resultMenu.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.stageMenu.classList.remove('hidden');
        this.isPlaying = false;
      });
    }

    updateHighScoreDisplay() {
      STAGES.forEach(s => {
        const hs = this.highScores[s.id] || { score: 0, acc: 0 };
        const elem = document.getElementById(`hs-${s.id}`);
        if (elem) {
          elem.innerText = `${hs.score.toLocaleString()}점 (${hs.acc.toFixed(1)}%)`;
        }
      });
    }

    updateEditorUI() {
      const seqInput = document.getElementById('tile-sequence');
      if (seqInput) {
        seqInput.value = this.customTiles.join(', ');
      }
    }

    buildTrack(tileAngles) {
      this.tiles = [];
      let curX = 0;
      let curY = 0;

      // First tile at origin (0,0)
      this.tiles.push({ x: curX, y: curY, angle: tileAngles[0] });

      for (let i = 0; i < tileAngles.length; i++) {
        const angleDeg = tileAngles[i];
        const rad = (angleDeg * Math.PI) / 180;
        // In Canvas 2D: X increases right, Y increases down.
        curX += Math.cos(rad) * this.tileSpacing;
        curY -= Math.sin(rad) * this.tileSpacing;

        const nextAngle = (i < tileAngles.length - 1) ? tileAngles[i + 1] : angleDeg;
        this.tiles.push({ x: curX, y: curY, angle: nextAngle });
      }
    }

    startStage(stageIdx) {
      const stage = STAGES[stageIdx];
      this.isEditor = false;
      this.bpm = stage.bpm;
      this.hudStageName.innerText = stage.name;
      this.buildTrack(stage.tiles);
      this.resetGameState();
    }

    startCustomStage() {
      this.isEditor = true;
      this.bpm = this.customBpm;
      this.hudStageName.innerText = "🎨 CUSTOM STAGE";
      this.buildTrack(this.customTiles);
      this.resetGameState();
    }

    resetGameState() {
      this.audio.init();
      this.currentTileIdx = 0;
      this.orbPivot = 0; // Fire starts as Pivot at Tile 0

      // Fire Orb at Tile 0
      this.fireOrb.x = this.tiles[0].x;
      this.fireOrb.y = this.tiles[0].y;

      // Ice Orb positioned relative to Tile 0 (pointing opposite to entry or starting at 180 deg)
      const firstTargetAngle = Math.atan2(-(this.tiles[1].y - this.tiles[0].y), this.tiles[1].x - this.tiles[0].x);
      // Revolving orb starts 180 degrees away from target
      this.rotAngle = firstTargetAngle + Math.PI;
      this.rotDirection = 1;

      this.iceOrb.x = this.fireOrb.x + Math.cos(this.rotAngle) * this.tileSpacing;
      this.iceOrb.y = this.fireOrb.y - Math.sin(this.rotAngle) * this.tileSpacing;

      // Reset Stats
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.totalHits = 0;
      this.weightedHits = 0;
      this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
      this.particles = [];

      this.isPlaying = true;
      this.isPaused = false;

      // UI
      this.stageMenu.classList.add('hidden');
      this.editorMenu.classList.add('hidden');
      this.resultMenu.classList.add('hidden');
      this.hud.classList.remove('hidden');
      this.updateHUD();

      // Camera init
      this.camX = this.tiles[0].x;
      this.camY = this.tiles[0].y;

      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.gameLoop(t));
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      if (!this.isPaused) {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
      }
    }

    handleHitInput() {
      if (this.currentTileIdx >= this.tiles.length - 1) return;

      const pivotTile = this.tiles[this.currentTileIdx];
      const targetTile = this.tiles[this.currentTileIdx + 1];

      // Target Angle from Pivot to Target Tile in Canvas radians
      const reqTargetAngle = Math.atan2(-(targetTile.y - pivotTile.y), targetTile.x - pivotTile.x);

      // Current rotation angle normalized to [-PI, PI] relative to target
      let diff = this.rotAngle - reqTargetAngle;
      // Normalize angle difference to [-PI, PI]
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Convert difference to degrees
      const diffDeg = Math.abs((diff * 180) / Math.PI);

      let judgement = null;
      let scoreAdd = 0;
      let accWeight = 0;

      if (diffDeg <= 18) {
        judgement = 'PERFECT';
        scoreAdd = 300;
        accWeight = 1.0;
        this.counts.perfect++;
      } else if (diffDeg <= 35) {
        judgement = 'GREAT';
        scoreAdd = 200;
        accWeight = 0.85;
        this.counts.great++;
      } else if (diffDeg <= 52) {
        judgement = 'GOOD';
        scoreAdd = 100;
        accWeight = 0.6;
        this.counts.good++;
      } else {
        // Miss / Out of range
        judgement = diff > 0 ? 'TOO LATE' : 'TOO EARLY';
        this.triggerFailure(judgement);
        return;
      }

      // Successful hit!
      this.totalHits++;
      this.weightedHits += accWeight;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.score += scoreAdd + this.combo * 10;

      // Audio & Particle FX
      const isFireMoving = (this.orbPivot === 1); // If Ice is pivot, Fire is moving
      this.audio.playHitSound(isFireMoving, judgement);
      this.showHitFeedback(judgement);
      this.createHitExplosion(targetTile.x, targetTile.y, isFireMoving ? '#ff4500' : '#00f0ff');

      // ADVANCE TO NEXT TILE & PIVOT SWAP
      this.currentTileIdx++;
      this.orbPivot = 1 - this.orbPivot; // Toggle Pivot (0 -> 1 or 1 -> 0)

      // Snap the newly landed orb precisely onto the target tile center
      if (this.orbPivot === 0) {
        // Fire is now Pivot
        this.fireOrb.x = targetTile.x;
        this.fireOrb.y = targetTile.y;
      } else {
        // Ice is now Pivot
        this.iceOrb.x = targetTile.x;
        this.iceOrb.y = targetTile.y;
      }

      // Check for Stage Finish
      if (this.currentTileIdx >= this.tiles.length - 1) {
        this.triggerStageClear();
        return;
      }

      // Reverse rotation direction for smooth continuous movement in ADOFAI geometry
      this.rotDirection *= -1;

      // Update Rotation Angle to start smoothly from landed position towards next target
      const nextPivot = this.tiles[this.currentTileIdx];
      const nextTarget = this.tiles[this.currentTileIdx + 1];
      const newTargetAngle = Math.atan2(-(nextTarget.y - nextPivot.y), nextTarget.x - nextPivot.x);

      // Start angle is opposite direction of previous segment
      this.rotAngle = reqTargetAngle;

      this.updateHUD();
    }

    showHitFeedback(text) {
      this.hitFeedback.className = 'hit-feedback';
      void this.hitFeedback.offsetWidth; // Trigger reflow
      const clsName = text.toLowerCase().replace(' ', '-');
      this.hitFeedback.classList.add(`show-${clsName}`);
      this.hitFeedback.innerText = text;
    }

    createHitExplosion(x, y, color) {
      for (let i = 0; i < 20; i++) {
        this.particles.push(new Particle(x, y, color, 4 + Math.random() * 6, 3 + Math.random() * 4));
      }
      this.screenShake = 6;
    }

    triggerFailure(reason) {
      this.counts.miss++;
      this.combo = 0;
      this.audio.playFailSound();
      this.showHitFeedback(reason);

      const pivotOrb = this.orbPivot === 0 ? this.fireOrb : this.iceOrb;
      this.createHitExplosion(pivotOrb.x, pivotOrb.y, '#ff0055');

      setTimeout(() => {
        this.showResultScreen(false);
      }, 1000);
    }

    triggerStageClear() {
      this.audio.playClearSound();
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      setTimeout(() => {
        this.showResultScreen(true);
      }, 1000);
    }

    showResultScreen(isClear) {
      this.isPlaying = false;
      this.hud.classList.add('hidden');
      this.resultMenu.classList.remove('hidden');

      const title = document.getElementById('result-title');
      const rank = document.getElementById('result-rank');
      const nextBtn = document.getElementById('next-stage-btn');

      const acc = this.totalHits > 0 ? (this.weightedHits / this.totalHits) * 100 : 0;

      if (isClear) {
        title.innerText = "🎉 STAGE CLEAR!";
        title.style.color = "#00ffcc";

        if (acc >= 98) rank.innerText = "SS";
        else if (acc >= 92) rank.innerText = "S";
        else if (acc >= 85) rank.innerText = "A";
        else if (acc >= 75) rank.innerText = "B";
        else rank.innerText = "C";

        nextBtn.style.display = 'inline-flex';

        // Save High Score
        if (!this.isEditor) {
          const currentHs = this.highScores[this.currentStageIndex] || { score: 0, acc: 0 };
          if (this.score > currentHs.score) {
            this.highScores[this.currentStageIndex] = { score: this.score, acc: acc };
            localStorage.setItem('adofai_highscores', JSON.stringify(this.highScores));
            this.updateHighScoreDisplay();
          }
        }
      } else {
        title.innerText = "💥 STAGE FAILED";
        title.style.color = "#ff3366";
        rank.innerText = "F";
        nextBtn.style.display = 'none';
      }

      document.getElementById('res-score').innerText = this.score.toLocaleString();
      document.getElementById('res-accuracy').innerText = `${acc.toFixed(1)}%`;
      document.getElementById('res-maxcombo').innerText = this.maxCombo;
      document.getElementById('res-perfect').innerText = this.counts.perfect;
      document.getElementById('res-great').innerText = this.counts.great;
      document.getElementById('res-miss').innerText = this.counts.good + this.counts.miss;
    }

    updateHUD() {
      const pct = Math.floor((this.currentTileIdx / (this.tiles.length - 1)) * 100);
      this.hudProgressBar.style.width = `${pct}%`;
      this.hudPercent.innerText = `${pct}%`;
      this.hudCombo.innerText = this.combo;
      this.hudScore.innerText = this.score.toLocaleString();

      const acc = this.totalHits > 0 ? (this.weightedHits / this.totalHits) * 100 : 100;
      this.hudAccuracy.innerText = `${acc.toFixed(1)}%`;
    }

    gameLoop(timestamp) {
      if (!this.isPlaying || this.isPaused) return;

      const dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      this.updatePhysics(dt);
      this.render();

      requestAnimationFrame((t) => this.gameLoop(t));
    }

    updatePhysics(dt) {
      if (this.currentTileIdx >= this.tiles.length - 1) return;

      // Angular velocity omega = (2 * PI * BPM / 60) * SpeedMultiplier
      const omega = ((Math.PI * 2 * this.bpm) / 60) * this.speedMultiplier;

      // Update rotation angle
      this.rotAngle += omega * dt * this.rotDirection;

      // Pivot orb and Revolving orb update
      const pivotTile = this.tiles[this.currentTileIdx];
      const targetTile = this.tiles[this.currentTileIdx + 1];

      let pivotX = pivotTile.x;
      let pivotY = pivotTile.y;

      let revX = pivotX + Math.cos(this.rotAngle) * this.tileSpacing;
      let revY = pivotY - Math.sin(this.rotAngle) * this.tileSpacing;

      if (this.orbPivot === 0) {
        // Fire is Pivot
        this.fireOrb.x = pivotX;
        this.fireOrb.y = pivotY;
        this.iceOrb.x = revX;
        this.iceOrb.y = revY;
        // Emit Ice sparkles
        this.particles.push(new Particle(revX, revY, '#00f0ff', 1, 2, true));
      } else {
        // Ice is Pivot
        this.iceOrb.x = pivotX;
        this.iceOrb.y = pivotY;
        this.fireOrb.x = revX;
        this.fireOrb.y = revY;
        // Emit Fire sparks
        this.particles.push(new Particle(revX, revY, '#ff4500', 1, 3, false));
      }

      // Check if revolving orb over-rotated past target tile angle (Miss due to late reaction)
      const reqTargetAngle = Math.atan2(-(targetTile.y - pivotTile.y), targetTile.x - pivotTile.x);
      let angleDiff = (this.rotAngle - reqTargetAngle) * this.rotDirection;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      // If angle passed target by more than 60 degrees (0.35 rad) -> Miss
      if (angleDiff > 0.35) {
        this.triggerFailure('TOO LATE');
        return;
      }

      // Smooth Camera Follow
      const targetCamX = (this.fireOrb.x + this.iceOrb.x) / 2;
      const targetCamY = (this.fireOrb.y + this.iceOrb.y) / 2;
      this.camX += (targetCamX - this.camX) * 0.1;
      this.camY += (targetCamY - this.camY) * 0.1;

      // Particles update
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();
        if (this.particles[i].life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      if (this.screenShake > 0) {
        this.screenShake *= 0.85;
        if (this.screenShake < 0.1) this.screenShake = 0;
      }
    }

    render() {
      const width = this.canvas.width;
      const height = this.canvas.height;

      this.ctx.save();
      this.ctx.clearRect(0, 0, width, height);

      // Apply Screen Shake
      if (this.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * this.screenShake * 4;
        const shakeY = (Math.random() - 0.5) * this.screenShake * 4;
        this.ctx.translate(shakeX, shakeY);
      }

      // Transform to Camera Viewport Centered
      this.ctx.translate(width / 2 - this.camX, height / 2 - this.camY);

      // 1. Draw Background Space Grid & Star Dust
      this.drawBackgroundGrid();

      // 2. Draw Track Path & Tiles
      this.drawTrack();

      // 3. Draw Particle FX
      this.particles.forEach(p => p.draw(this.ctx));

      // 4. Draw Orbs & Rotating Orbit Line
      this.drawOrbs();

      this.ctx.restore();
    }

    drawBackgroundGrid() {
      const step = 150;
      const startX = Math.floor((this.camX - this.canvas.width) / step) * step;
      const endX = Math.ceil((this.camX + this.canvas.width) / step) * step;
      const startY = Math.floor((this.camY - this.canvas.height) / step) * step;
      const endY = Math.ceil((this.camY + this.canvas.height) / step) * step;

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      for (let x = startX; x <= endX; x += step) {
        this.ctx.moveTo(x, startY);
        this.ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += step) {
        this.ctx.moveTo(startX, y);
        this.ctx.lineTo(endX, y);
      }
      this.ctx.stroke();
    }

    drawTrack() {
      if (this.tiles.length < 2) return;

      // Draw Connecting Path Lines
      this.ctx.lineWidth = 16;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      for (let i = 0; i < this.tiles.length - 1; i++) {
        const t1 = this.tiles[i];
        const t2 = this.tiles[i + 1];

        this.ctx.beginPath();
        this.ctx.moveTo(t1.x, t1.y);
        this.ctx.lineTo(t2.x, t2.y);

        if (i < this.currentTileIdx) {
          // Passed tiles (glowing gold)
          this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        } else if (i === this.currentTileIdx) {
          // Current active tile path (glowing white)
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        } else {
          // Future tiles (cool cyan/blue path)
          this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        }
        this.ctx.stroke();
      }

      // Draw Individual Tile Nodes
      for (let i = 0; i < this.tiles.length; i++) {
        const tile = this.tiles[i];
        const isCurrentTarget = (i === this.currentTileIdx + 1);
        const isPivot = (i === this.currentTileIdx);

        this.ctx.save();
        this.ctx.beginPath();

        if (i < this.currentTileIdx) {
          // Passed tile
          this.ctx.fillStyle = '#ffd700';
          this.ctx.arc(tile.x, tile.y, 14, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (isPivot) {
          // Active Pivot tile
          this.ctx.fillStyle = '#ffffff';
          this.ctx.shadowColor = '#ffffff';
          this.ctx.shadowBlur = 15;
          this.ctx.arc(tile.x, tile.y, 18, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (isCurrentTarget) {
          // Target tile to hit
          this.ctx.fillStyle = '#00f0ff';
          this.ctx.shadowColor = '#00f0ff';
          this.ctx.shadowBlur = 20;
          this.ctx.arc(tile.x, tile.y, 18 + Math.sin(performance.now() * 0.01) * 3, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Future tile
          this.ctx.fillStyle = 'rgba(15, 25, 45, 0.9)';
          this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
          this.ctx.lineWidth = 3;
          this.ctx.arc(tile.x, tile.y, 14, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
        }

        this.ctx.restore();
      }
    }

    drawOrbs() {
      const pivotOrb = this.orbPivot === 0 ? this.fireOrb : this.iceOrb;

      // Draw Orbit Circle Guide
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 6]);
      this.ctx.arc(pivotOrb.x, pivotOrb.y, this.tileSpacing, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      // Draw Fire Orb
      this.ctx.save();
      this.ctx.shadowColor = this.fireOrb.glow;
      this.ctx.shadowBlur = 25;
      this.ctx.fillStyle = this.fireOrb.color;
      this.ctx.beginPath();
      this.ctx.arc(this.fireOrb.x, this.fireOrb.y, 16, 0, Math.PI * 2);
      this.ctx.fill();
      // Inner core
      this.ctx.fillStyle = '#ffffaa';
      this.ctx.beginPath();
      this.ctx.arc(this.fireOrb.x, this.fireOrb.y, 7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // Draw Ice Orb
      this.ctx.save();
      this.ctx.shadowColor = this.iceOrb.glow;
      this.ctx.shadowBlur = 25;
      this.ctx.fillStyle = this.iceOrb.color;
      this.ctx.beginPath();
      this.ctx.arc(this.iceOrb.x, this.iceOrb.y, 16, 0, Math.PI * 2);
      this.ctx.fill();
      // Inner core
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(this.iceOrb.x, this.iceOrb.y, 7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  // Launch Game on Load
  window.addEventListener('DOMContentLoaded', () => {
    window.adofai = new AdofaiGame();
  });
})();
